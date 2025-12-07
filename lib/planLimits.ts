/**
 * Plan-based feature limits and configurations
 */

export type Plan = "free" | "starter" | "pro";

export interface PlanLimits {
  maxCompareModels: number;
  researchPanelEnabled: boolean;
  maxHistorySessions: number;
  freeDailyCreditsMax: number;
  monthlyCredits: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxCompareModels: 3,
    researchPanelEnabled: false,
    maxHistorySessions: 10,
    freeDailyCreditsMax: 10,
    monthlyCredits: 0,
  },
  starter: {
    maxCompareModels: 5,
    researchPanelEnabled: true,
    maxHistorySessions: 200,
    freeDailyCreditsMax: 10,
    monthlyCredits: 1000,
  },
  pro: {
    maxCompareModels: 5,
    researchPanelEnabled: true,
    maxHistorySessions: 1000,
    freeDailyCreditsMax: 10,
    monthlyCredits: 3000,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}
