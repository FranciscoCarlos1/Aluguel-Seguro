import { calculateMonthlyAssessment, type AssessmentFormInput, type CalculatedMonthlyAssessment } from "@/lib/assessments";
import { CONTRACT_COST_SNAPSHOT } from "@/lib/contract-costs";

export type MonthlyFlowInput = Omit<AssessmentFormInput, "contractMonthlyWithVt" | "postMonthlyValue"> & {
  contractMonthlyWithVt?: number;
  postMonthlyValue?: number;
};

/** Single calculation pipeline used by the monthly screen/report:
 * jornada -> contractual deductions -> IMR -> journey glosa -> final amount.
 * The supplied spreadsheet bases remain explicit rather than being silently reconciled.
 */
export function calculateUnifiedMonthlyFlow(input: MonthlyFlowInput): CalculatedMonthlyAssessment {
  const base = input.contractMonthlyWithVt ?? CONTRACT_COST_SNAPSHOT.monthlyProposed;
  const post = input.postMonthlyValue ?? CONTRACT_COST_SNAPSHOT.laborBase;

  return calculateMonthlyAssessment({
    ...input,
    contractMonthlyWithVt: base,
    postMonthlyValue: post,
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
