import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { activatePaidPurchase, createPurchase } from "./purchaseService";
import { ensureCommercialPackages } from "./packages";
import { getPaymentProvider } from "./provider";
import { referralPlanDiscountService } from "@/server/services/referralPlanDiscountService";
import { notificationService } from "@/server/services/notificationService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    package: { findFirst: vi.fn() },
    purchase: { create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("./packages", () => ({
  ensureCommercialPackages: vi.fn(),
}));

vi.mock("./provider", () => ({
  getPaymentProvider: vi.fn(),
}));

vi.mock("@/server/services/referralPlanDiscountService", () => ({
  referralPlanDiscountService: {
    checkReferredEligibility: vi.fn(),
    checkReferrerEligibility: vi.fn(),
  },
}));

vi.mock("@/server/services/notificationService", () => ({
  notificationService: { notify: vi.fn() },
}));

const transaction = vi.mocked(prisma.$transaction);
const packageFindFirst = vi.mocked(prisma.package.findFirst);
const purchaseCreate = vi.mocked(prisma.purchase.create);
const purchaseUpdate = vi.mocked(prisma.purchase.update);
const ensurePackages = vi.mocked(ensureCommercialPackages);
const paymentProvider = vi.mocked(getPaymentProvider);
const referralService = vi.mocked(referralPlanDiscountService);
const mockNotify = vi.mocked(notificationService.notify);

const NOT_ELIGIBLE = { eligible: false, reason: "not eligible" };

describe("createPurchase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensurePackages.mockResolvedValue(undefined);
    referralService.checkReferredEligibility.mockResolvedValue(NOT_ELIGIBLE);
    referralService.checkReferrerEligibility.mockResolvedValue(NOT_ELIGIBLE);
    paymentProvider.mockReturnValue({
      createOrder: vi.fn().mockResolvedValue({ id: "order-1" }),
    } as never);
  });

  it("rejects an unknown or inactive package code", async () => {
    packageFindFirst.mockResolvedValue(null);

    await expect(createPurchase("user-1", "UNKNOWN_PACKAGE")).rejects.toThrow(
      "PACKAGE_NOT_FOUND",
    );
  });

  it("charges the exact hand-verified real total (platform fee + GST, no discount) when the customer is not referral-eligible", async () => {
    packageFindFirst.mockResolvedValue({
      id: "package-1",
      priceMinor: 999_900n,
      currency: "INR",
    } as never);
    purchaseCreate.mockResolvedValue({ id: "purchase-1" } as never);
    purchaseUpdate.mockResolvedValue({
      id: "purchase-1",
      package: { code: "NIWASTHAN_IMMERSIVE" },
      payment: {},
    } as never);

    await createPurchase("user-1", "NIWASTHAN_IMMERSIVE");

    // Hand-verified: taxable base = 999,900 + 700 = 1,000,600.
    // GST (18%) = 180,108. Total = 1,180,708.
    expect(purchaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountMinor: 1_180_708n,
          discountMinor: 0n,
          platformFeeMinor: 700n,
          gstMinor: 180_108n,
        }),
      }),
    );
  });

  it("applies the real referral discount before computing charges when the customer is eligible as the referred party", async () => {
    packageFindFirst.mockResolvedValue({
      id: "package-1",
      priceMinor: 999_900n,
      currency: "INR",
    } as never);
    referralService.checkReferredEligibility.mockResolvedValue({
      eligible: true,
      reason: "real referral",
    });
    purchaseCreate.mockResolvedValue({ id: "purchase-1" } as never);
    purchaseUpdate.mockResolvedValue({
      id: "purchase-1",
      package: { code: "NIWASTHAN_IMMERSIVE" },
      payment: {},
    } as never);

    await createPurchase("user-1", "NIWASTHAN_IMMERSIVE");

    // Hand-verified: 20% off 999,900 = discount 199,980, discounted
    // price 799,920. Taxable base = 799,920 + 700 = 800,620.
    // GST (18%) = 144,111 (integer division). Total = 944,731.
    expect(purchaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountMinor: 944_731n,
          discountMinor: 199_980n,
          gstMinor: 144_111n,
        }),
      }),
    );
  });

  it("also applies the discount when the customer is eligible only as the referrer, not the referred party", async () => {
    packageFindFirst.mockResolvedValue({
      id: "package-1",
      priceMinor: 999_900n,
      currency: "INR",
    } as never);
    referralService.checkReferrerEligibility.mockResolvedValue({
      eligible: true,
      reason: "referred person converted",
    });
    purchaseCreate.mockResolvedValue({ id: "purchase-1" } as never);
    purchaseUpdate.mockResolvedValue({
      id: "purchase-1",
      package: { code: "NIWASTHAN_IMMERSIVE" },
      payment: {},
    } as never);

    await createPurchase("user-1", "NIWASTHAN_IMMERSIVE");

    expect(purchaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ discountMinor: 199_980n }),
      }),
    );
  });

  it("includes a genuine voluntary contribution in the real total, on top of the plan price and charges", async () => {
    packageFindFirst.mockResolvedValue({
      id: "package-1",
      priceMinor: 999_900n,
      currency: "INR",
    } as never);
    purchaseCreate.mockResolvedValue({ id: "purchase-1" } as never);
    purchaseUpdate.mockResolvedValue({
      id: "purchase-1",
      package: { code: "NIWASTHAN_IMMERSIVE" },
      payment: {},
    } as never);

    await createPurchase("user-1", "NIWASTHAN_IMMERSIVE", 5_000n);

    // Base total (no discount) was 1,180,708 - plus the real 5,000
    // voluntary contribution, untaxed (never marked up itself).
    expect(purchaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountMinor: 1_185_708n,
          voluntaryContributionMinor: 5_000n,
        }),
      }),
    );
  });

  it("sends the real, final total - never the bare package price - to the payment provider", async () => {
    packageFindFirst.mockResolvedValue({
      id: "package-1",
      priceMinor: 999_900n,
      currency: "INR",
    } as never);
    purchaseCreate.mockResolvedValue({ id: "purchase-1" } as never);
    purchaseUpdate.mockResolvedValue({
      id: "purchase-1",
      package: { code: "NIWASTHAN_IMMERSIVE" },
      payment: {},
    } as never);
    const createOrder = vi.fn().mockResolvedValue({ id: "order-1" });
    paymentProvider.mockReturnValue({ createOrder } as never);

    await createPurchase("user-1", "NIWASTHAN_IMMERSIVE");

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinor: 1_180_708n }),
    );
  });
});

describe("activatePaidPurchase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("activates a captured purchase atomically and grants its entitlement", async () => {
    const purchase = {
      id: "purchase-1",
      userId: "user-1",
      packageId: "package-1",
      amountMinor: 99900n,
      status: "PENDING",
      package: { name: "Niwasthan Design", credits: 100 },
      payment: { status: "PENDING", providerPaymentId: null },
    };
    const tx = {
      purchase: {
        findUnique: vi.fn().mockResolvedValue(purchase),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          ...purchase,
          status: "PAID",
        }),
      },
      payment: { update: vi.fn().mockResolvedValue({}) },
      entitlement: { upsert: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    transaction.mockImplementation(async (callback) => callback(tx as never));

    await expect(
      activatePaidPurchase({
        providerOrderId: "order-1",
        providerPaymentId: "payment-1",
        signature: "sig-1",
        rawEventHash: "hash-1",
      }),
    ).resolves.toMatchObject({ id: "purchase-1", status: "PAID" });

    expect(tx.purchase.updateMany).toHaveBeenCalledWith({
      where: { id: "purchase-1", status: { not: "PAID" } },
      data: { status: "PAID" },
    });
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { purchaseId: "purchase-1" },
      data: {
        status: "CAPTURED",
        providerPaymentId: "payment-1",
        signature: "sig-1",
        rawEventHash: "hash-1",
      },
    });
    expect(tx.entitlement.upsert).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("fires the real PURCHASE_CONFIRMED notification, with the real package name and amount, for a genuinely new activation", async () => {
    const purchase = {
      id: "purchase-1",
      userId: "user-1",
      packageId: "package-1",
      amountMinor: 99900n,
      status: "PENDING",
      package: { name: "Niwasthan Design", credits: 100 },
      payment: { status: "PENDING", providerPaymentId: null },
    };
    const tx = {
      purchase: {
        findUnique: vi.fn().mockResolvedValue(purchase),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          ...purchase,
          status: "PAID",
        }),
      },
      payment: { update: vi.fn().mockResolvedValue({}) },
      entitlement: { upsert: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    transaction.mockImplementation(async (callback) => callback(tx as never));

    await activatePaidPurchase({
      providerOrderId: "order-1",
      providerPaymentId: "payment-1",
      rawEventHash: "hash-1",
    });

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "PURCHASE_CONFIRMED",
        relatedEntityId: "purchase-1",
      }),
    );
    // Hand-verified: 99900 paise = ₹999
    const call = mockNotify.mock.calls[0]![0];
    expect(call.message).toContain("Niwasthan Design");
    expect(call.message).toContain("₹999");
  });

  it("does not duplicate an already-captured payment", async () => {
    const purchase = {
      id: "purchase-1",
      status: "PAID",
      payment: { status: "CAPTURED", providerPaymentId: "payment-1" },
    };
    const tx = {
      purchase: { findUnique: vi.fn().mockResolvedValue(purchase) },
      payment: { update: vi.fn() },
      entitlement: { upsert: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    transaction.mockImplementation(async (callback) => callback(tx as never));

    await expect(
      activatePaidPurchase({
        providerOrderId: "order-1",
        providerPaymentId: "payment-1",
        rawEventHash: "hash-1",
      }),
    ).resolves.toEqual(purchase);

    expect(tx.payment.update).not.toHaveBeenCalled();
    expect(tx.entitlement.upsert).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("never fires a duplicate real notification for a webhook re-delivery of an already-activated purchase", async () => {
    const purchase = {
      id: "purchase-1",
      status: "PAID",
      payment: { status: "CAPTURED", providerPaymentId: "payment-1" },
    };
    const tx = {
      purchase: { findUnique: vi.fn().mockResolvedValue(purchase) },
      payment: { update: vi.fn() },
      entitlement: { upsert: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    transaction.mockImplementation(async (callback) => callback(tx as never));

    await activatePaidPurchase({
      providerOrderId: "order-1",
      providerPaymentId: "payment-1",
      rawEventHash: "hash-1",
    });

    expect(mockNotify).not.toHaveBeenCalled();
  });
});
