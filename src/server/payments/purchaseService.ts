import { prisma } from "@/server/db/prisma";
import { notificationService } from "@/server/services/notificationService";
import { buildMoment } from "@/server/personality/momentTemplates";
import { ensureCommercialPackages } from "./packages";
import { getPaymentProvider } from "./provider";
import { computeReferralDiscount } from "@/server/services/referralPlanDiscount";
import { referralPlanDiscountService } from "@/server/services/referralPlanDiscountService";
import { computeQuotationCharges } from "@/server/services/quotationCharges";

export async function createPurchase(
  userId: string,
  packageCode: string,
  voluntaryContributionMinor = 0n,
) {
  await ensureCommercialPackages();
  const pkg = await prisma.package.findFirst({
    where: { code: packageCode, active: true },
  });
  if (!pkg) throw new Error("PACKAGE_NOT_FOUND");

  // Real referral eligibility, checked here for the first time - a user
  // is eligible for the discount either as the referred party (they
  // themselves were referred and have now genuinely converted) or as the
  // referrer (someone they referred has genuinely converted). Checked
  // independently rather than assuming only one direction applies; a
  // single 20% discount is applied either way, never stacked twice for
  // the same purchase - the combined-discount cap in
  // computeReferralDiscount already protects against that regardless.
  const [referredEligibility, referrerEligibility] = await Promise.all([
    referralPlanDiscountService.checkReferredEligibility(userId),
    referralPlanDiscountService.checkReferrerEligibility(userId),
  ]);
  const isReferralEligible =
    referredEligibility.eligible || referrerEligibility.eligible;

  const { finalPlanPriceMinor, discountMinor } = isReferralEligible
    ? computeReferralDiscount(pkg.priceMinor)
    : {
        finalPlanPriceMinor: pkg.priceMinor,
        discountMinor: 0n,
      };

  const charges = computeQuotationCharges({
    planPriceMinor: finalPlanPriceMinor,
    voluntaryContributionMinor,
  });

  const purchase = await prisma.purchase.create({
    data: {
      userId,
      packageId: pkg.id,
      amountMinor: charges.totalMinor,
      discountMinor,
      platformFeeMinor: charges.platformFeeMinor,
      gstMinor: charges.gstMinor,
      voluntaryContributionMinor: charges.voluntaryContributionMinor,
      currency: pkg.currency,
      provider: "razorpay",
      payment: {
        create: {
          id: `payment_${crypto.randomUUID()}`,
          amountMinor: charges.totalMinor,
          currency: pkg.currency,
        },
      },
    },
  });
  try {
    const order = await getPaymentProvider().createOrder({
      amountMinor: charges.totalMinor,
      currency: pkg.currency,
      receipt: purchase.id,
    });
    return prisma.purchase.update({
      where: { id: purchase.id },
      data: { providerOrderId: order.id },
      include: { package: true, payment: true },
    });
  } catch (error) {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

export async function activatePaidPurchase(input: {
  providerOrderId: string;
  providerPaymentId: string;
  signature?: string;
  rawEventHash: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { providerOrderId: input.providerOrderId },
      include: { package: true, payment: true },
    });
    if (!purchase) throw new Error("PURCHASE_NOT_FOUND");
    if (
      purchase.status === "PAID" &&
      purchase.payment?.providerPaymentId === input.providerPaymentId
    )
      return { purchase, wasNewlyActivated: false };
    if (purchase.payment?.status === "CAPTURED")
      return { purchase, wasNewlyActivated: false };
    const updated = await tx.purchase.updateMany({
      where: { id: purchase.id, status: { not: "PAID" } },
      data: { status: "PAID" },
    });
    if (updated.count === 0) return { purchase, wasNewlyActivated: false };
    await tx.payment.update({
      where: { purchaseId: purchase.id },
      data: {
        status: "CAPTURED",
        providerPaymentId: input.providerPaymentId,
        signature: input.signature,
        rawEventHash: input.rawEventHash,
      },
    });
    const key = `purchase:${purchase.id}`;
    await tx.entitlement.upsert({
      where: {
        userId_idempotencyKey: { userId: purchase.userId, idempotencyKey: key },
      },
      create: {
        userId: purchase.userId,
        purchaseId: purchase.id,
        packageId: purchase.packageId,
        creditsTotal: purchase.package.credits,
        idempotencyKey: key,
      },
      update: {},
    });
    await tx.auditLog.create({
      data: {
        userId: purchase.userId,
        action: "PURCHASE_ACTIVATED",
        entity: "Purchase",
        entityId: purchase.id,
        metadata: { providerPaymentId: input.providerPaymentId },
      },
    });
    const fresh = await tx.purchase.findUniqueOrThrow({
      where: { id: purchase.id },
      include: { package: true, payment: true, entitlements: true },
    });
    return { purchase: fresh, wasNewlyActivated: true };
  });

  // README §14: notifications must cover real purchase/payment state -
  // fired here, outside the transaction (notificationService uses its
  // own real prisma client, not the transaction's tx), and only for a
  // genuinely NEW activation. A webhook re-delivery for an already-
  // active purchase (Razorpay's own documented retry behavior) must
  // never produce a second, duplicate "payment received" notification
  // for the same real purchase.
  if (result.wasNewlyActivated) {
    const moment = buildMoment("PURCHASE_CONFIRMED", {
      packageName: result.purchase.package.name,
      amountMinor: result.purchase.amountMinor,
    });
    await notificationService.notify({
      userId: result.purchase.userId,
      type: "PURCHASE_CONFIRMED",
      title: moment.title,
      message: moment.message,
      relatedEntityType: "Purchase",
      relatedEntityId: result.purchase.id,
    });
  }

  return result.purchase;
}
