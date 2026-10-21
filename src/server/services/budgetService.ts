import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { budgetRepository } from "@/server/repositories/budgetRepository";
import { observeBudgetAndAct } from "@/server/agents/budgetOperationsAgent";
import type {
  BudgetImpactInput,
  CreateBudgetInput,
  LockBudgetInput,
} from "@/server/validators/budget";

export const budgetService = {
  get(propertyId: string, ownerId: string) {
    return budgetRepository.findPlan(propertyId, ownerId);
  },

  async create(propertyId: string, ownerId: string, input: CreateBudgetInput) {
    try {
      const result = await budgetRepository.createVersion(
        propertyId,
        ownerId,
        input,
      );
      if (!result) throw new NotFoundError("Property");
      // README §15 BOQ & Budget Operations Agent: observes the newly
      // saved plan and notifies the owner if it's already at its
      // estimated ceiling or a real trade-off is available. Best-effort
      // and swallowed - an observation failure must never fail the real,
      // already-persisted budget write that triggered it.
      await observeBudgetAndAct(propertyId, ownerId).catch(() => undefined);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === "BUDGET_LOCKED") {
        throw new ConflictError(
          "Budget plan is locked; create a new decision instead of mutating it",
        );
      }
      throw error;
    }
  },

  async lock(propertyId: string, ownerId: string, input: LockBudgetInput) {
    const result = await budgetRepository.lockVersion(
      propertyId,
      ownerId,
      input.version,
    );
    if (!result) throw new NotFoundError("Budget plan");
    if ("missing" in result) throw new NotFoundError("Budget version");
    if ("conflict" in result) {
      throw new ConflictError("Budget plan is already locked");
    }
    return result;
  },

  async impact(propertyId: string, ownerId: string, input: BudgetImpactInput) {
    const result = await budgetRepository.createImpact(
      propertyId,
      ownerId,
      input,
    );
    if (!result) throw new NotFoundError("Budget plan");
    return result;
  },
};
