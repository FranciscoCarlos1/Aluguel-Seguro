import { calculateMonthlyAssessment, type AssessmentFormInput, type CalculatedMonthlyAssessment } from "@/lib/assessments";
import { CONTRACT_COST_SNAPSHOT } from "@/lib/contract-costs";

export type MonthlyFlowInput = Omit<AssessmentFormInput, "contractMonthlyWithVt" | "postMonthlyValue"> & {
  contractMonthlyWithVt?: number;
  postMonthlyValue?: number;
};

/**
 * Single calculation pipeline for the monthly measurement.
 * Source bases remain explicit: contract-cost workbook and IMR/measurement workbook.
 */
export function calculateUnifiedMonthlyFlow(input: MonthlyFlowInput): CalculatedMonthlyAssessment {
  return calculateMonthlyAssessment({
    ...input,
    contractMonthlyWithVt: input.contractMonthlyWithVt ?? CONTRACT_COST_SNAPSHOT.monthlyProposed,
    postMonthlyValue: input.postMonthlyValue ?? CONTRACT_COST_SNAPSHOT.laborBase,
  });
}

export function getUnifiedFlowSummary(result: CalculatedMonthlyAssessment) {
  return {
    monthKey: result.monthKey,
    grossContractValue: result.contractMonthlyWithVt,
    vtDiscount: result.vtDiscountAmount,
    crecheDiscount: result.crecheDiscountAmount,
    baseAfterContractualDeductions: result.contractMonthlyValue,
    imrScore: result.totalScore,
    imrFactor: result.serviceLevelFactor,
    valueAfterImr: result.valueAfterImr,
    journeyGlosa: result.journeyGlosaTotal,
    finalAmount: result.finalAmount,
    totalEstimatedDiscount: result.estimatedDiscount,
    employees: result.items.length,
  };
}
