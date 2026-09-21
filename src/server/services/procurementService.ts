import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { transitionOrder } from "@/server/execution/orderWorkflow";
import { procurementRepository } from "@/server/repositories/procurementRepository";
import { evaluateNegotiation } from "@/server/services/negotiationEngine";
import { notificationService } from "@/server/services/notificationService";
import { referralService } from "@/server/services/referralService";
import type { OrderState } from "@/server/execution/orderWorkflow";
import type {
  CreateProcurementRequestInput,
  SubmitQuoteInput,
} from "@/server/validators/procurement";

export const procurementService = {
  async create(
    propertyId: string,
    ownerId: string,
    input: CreateProcurementRequestInput,
  ) {
    const existing = await procurementRepository.findByIdempotencyKey(
      propertyId,
      input.idempotencyKey,
    );
    if (existing) return existing;

    const budgetPlan = await procurementRepository.findLockedBudgetPlanForOwner(
      propertyId,
      ownerId,
    );
    if (!budgetPlan || budgetPlan.lockedVersion !== input.lockedBudgetVersion) {
      throw new ConflictError(
        "Procurement can only be started from the property's currently locked budget version",
      );
    }

    return procurementRepository.create(propertyId, ownerId, input);
  },

  async get(procurementRequestId: string, ownerId: string) {
    const request = await procurementRepository.findForOwner(
      procurementRequestId,
      ownerId,
    );
    if (!request) throw new NotFoundError("ProcurementRequest");
    return request;
  },

  async listForProperty(propertyId: string, ownerId: string) {
    return procurementRepository.listForProperty(propertyId, ownerId);
  },

  async submitQuote(
    procurementRequestId: string,
    ownerId: string,
    input: SubmitQuoteInput,
  ) {
    const request = await procurementRepository.findForOwner(
      procurementRequestId,
      ownerId,
    );
    if (!request) throw new NotFoundError("ProcurementRequest");
    const quote = await procurementRepository.submitQuote(
      procurementRequestId,
      input,
    );
    await notificationService.notify({
      userId: ownerId,
      type: "QUOTE_RECEIVED",
      title: "New quote received",
      message: `${input.supplierName} submitted a quote for your procurement request`,
      relatedEntityType: "ProcurementRequest",
      relatedEntityId: procurementRequestId,
    });
    return quote;
  },

  async acceptQuote(
    procurementRequestId: string,
    quoteId: string,
    ownerId: string,
  ) {
    const order = await procurementRepository.acceptQuoteAndCreateOrder(
      procurementRequestId,
      quoteId,
      ownerId,
    );
    if (!order) {
      const quote = await procurementRepository.findQuoteForOwner(
        procurementRequestId,
        quoteId,
        ownerId,
      );
      if (!quote) throw new NotFoundError("Quote");
      throw new ConflictError(
        "Quote has already been accepted, rejected, or expired",
      );
    }
    return order;
  },

  async updateOrderStatus(
    orderId: string,
    ownerId: string,
    nextStatus: OrderState,
  ) {
    const order = await procurementRepository.findOrderForOwner(
      orderId,
      ownerId,
    );
    if (!order) throw new NotFoundError("Order");

    const currentStatus = order.status as OrderState;
    transitionOrder(currentStatus, nextStatus);

    const result = await procurementRepository.updateOrderStatus(
      orderId,
      ownerId,
      currentStatus,
      nextStatus,
    );
    if (result.count === 0) {
      throw new ConflictError(
        "Order changed before this status update could be applied",
      );
    }

    const updated = await procurementRepository.findOrderForOwner(
      orderId,
      ownerId,
    );
    await notificationService.notify({
      userId: ownerId,
      type: "ORDER_STATUS_CHANGED",
      title: "Order status updated",
      message: `Your order is now ${nextStatus.toLowerCase()}`,
      relatedEntityType: "Order",
      relatedEntityId: orderId,
    });
    if (nextStatus === "DELIVERED") {
      await referralService.rewardReferralIfPending(ownerId, orderId);
    }
    return updated;
  },

  async scheduleExecution(
    orderId: string,
    ownerId: string,
    scheduledDate: Date,
  ) {
    const order = await procurementRepository.findOrderForOwner(
      orderId,
      ownerId,
    );
    if (!order) throw new NotFoundError("Order");
    return procurementRepository.scheduleExecution(orderId, scheduledDate);
  },

  async updateExecutionStatus(
    executionId: string,
    ownerId: string,
    status: string,
    snagNotes?: string,
  ) {
    const result = await procurementRepository.updateExecutionStatus(
      executionId,
      ownerId,
      status,
      snagNotes,
    );
    if (result.count === 0) throw new NotFoundError("ExecutionRecord");
    const execution = await procurementRepository.findExecutionForOwner(
      executionId,
      ownerId,
    );
    await notificationService.notify({
      userId: ownerId,
      type: "EXECUTION_STATUS_CHANGED",
      title:
        status === "SNAGGED"
          ? "Issue found during execution"
          : "Execution update",
      message:
        status === "SNAGGED"
          ? (snagNotes ??
            "An issue was found during execution and needs your attention")
          : `Execution is now ${status.toLowerCase()}`,
      relatedEntityType: "ExecutionRecord",
      relatedEntityId: executionId,
    });
    return execution;
  },

  async proposeNegotiation(
    procurementRequestId: string,
    quoteId: string,
    ownerId: string,
    proposedAmountMinor: bigint,
  ) {
    const quote = await procurementRepository.findNegotiableQuoteForOwner(
      procurementRequestId,
      quoteId,
      ownerId,
    );
    if (!quote) {
      const exists = await procurementRepository.findQuoteForOwner(
        procurementRequestId,
        quoteId,
        ownerId,
      );
      if (!exists) throw new NotFoundError("Quote");
      throw new ConflictError("This quote is no longer open for negotiation");
    }

    const result = evaluateNegotiation(quote, proposedAmountMinor);

    await procurementRepository.recordNegotiation(
      quoteId,
      proposedAmountMinor,
      result.decision,
      result.counterAmountMinor,
    );

    if (result.decision === "ACCEPTED") {
      await procurementRepository.applyAcceptedNegotiation(
        quoteId,
        proposedAmountMinor,
      );
    }

    return result;
  },
};
