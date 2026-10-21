-- README §15: second real specialist agent in the roster (BOQ & Budget
-- Operations Agent), same governance shape as the existing
-- EXECUTION_QUALITY policy - rule-based, notify-only authority, no
-- power to change budget/financial truth itself.
INSERT INTO "AgentPolicy" ("id", "agentName", "workflow", "readableScopes", "allowedTools", "autonomousActionClasses", "prohibitedActions", "maxActionAttempts", "maxRetries", "escalationThreshold", "customerImpactRule", "modelProvider", "timeoutMs", "enabled", "version", "createdAt", "updatedAt")
VALUES ('agent_policy_boq_budget', 'BOQ_BUDGET', 'BOQ_AND_BUDGET', '["budget", "boq", "projectOptimization"]', '["notificationService"]', '["A", "B"]', '["change_financial_truth", "modify_budget_version", "commit_savings"]', 1, 0, 1, 'Notify owner only; human retains all budget-committing authority.', 'rule-based', 10000, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
