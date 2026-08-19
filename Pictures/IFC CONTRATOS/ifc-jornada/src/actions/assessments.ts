'use server';

import { Prisma, PunchType, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  calculateMonthlyAssessment,
  getMonthRange,
  QUALITY_QUESTIONS,
  type QualityRating,
} from "@/lib/assessments";
import {
  DEFAULT_CONTRACT_MONTHLY_VALUE,
  DEFAULT_CONTRACT_POSTS,
  DEFAULT_CRECHE_ADDITIONAL_PERCENTAGE,
  DEFAULT_CRECHE_MONTHLY_DIFFERENCE,
  DEFAULT_EXPECTED_BUSINESS_DAYS,
  DEFAULT_MINUTES_PER_WORKDAY,
  DEFAULT_POST_MONTHLY_VALUE,
  REPORT_MANAGER_NAME,
  DEFAULT_VT_MONTHLY_DIFFERENCE,
} from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

type AssessmentFormState = { success?: boolean; message?: string } | undefined;

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function generateMonthlyAssessmentAction(
  _state: AssessmentFormState,
  formData: FormData,
): Promise<AssessmentFormState> {
  const currentUser = await requireUser([Role.ADMIN]);
  const monthKey = String(formData.get("monthKey") || "").trim();

  if (!/^\d{4}-\d{2}$/.test(monthKey)) return { message: "Informe um mês válido no formato AAAA-MM." };

  const qualityResponses = Object.fromEntries(
    QUALITY_QUESTIONS.map((question) => {
      const raw = String(formData.get(question.key) || "N").trim();
      const rating = ["O", "B", "R", "I", "N"].includes(raw) ? (raw as QualityRating) : "N";
      return [question.key, rating];
    }),
  );

  const submittedContractMonthlyWithVt = parseNumber(formData.get("contractMonthlyWithVt"), DEFAULT_CONTRACT_MONTHLY_VALUE);
  const submittedPostMonthlyValue = parseNumber(formData.get("postMonthlyValue"), DEFAULT_POST_MONTHLY_VALUE);
  const submittedContractPosts = parseNumber(formData.get("contractPosts"), DEFAULT_CONTRACT_POSTS);
  const latestCost = await db.contractCostSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
    select: { monthlyProposed: true, costPerEmployee: true, calculatedEmployees: true },
  });

  // Uma avaliação nova nasce com os valores da última planilha importada.
  // Se o administrador já abriu uma avaliação existente e alterou manualmente o valor,
  // o valor enviado pelo formulário é preservado.
  const contractMonthlyWithVt =
    submittedContractMonthlyWithVt === DEFAULT_CONTRACT_MONTHLY_VALUE && latestCost
      ? Number(latestCost.monthlyProposed)
      : submittedContractMonthlyWithVt;
  const postMonthlyValue =
    submittedPostMonthlyValue === DEFAULT_POST_MONTHLY_VALUE && latestCost
      ? Number(latestCost.costPerEmployee)
      : submittedPostMonthlyValue;
  const contractPosts =
    submittedContractPosts === DEFAULT_CONTRACT_POSTS && latestCost?.calculatedEmployees
      ? latestCost.calculatedEmployees
      : submittedContractPosts;

  const vtMonthlyDifference = parseNumber(formData.get("vtMonthlyDifference"), DEFAULT_VT_MONTHLY_DIFFERENCE);
  const expectedBusinessDays = parseNumber(formData.get("expectedBusinessDays"), DEFAULT_EXPECTED_BUSINESS_DAYS);
  const rawVtDaysNotPaid = parseNumber(formData.get("vtDaysNotPaid"), 0);
  const vtDiscountAmountOverride = parseOptionalNumber(formData.get("vtDiscountAmountOverride"));
  const exactVtDailyDifference = expectedBusinessDays > 0 && contractPosts > 0 ? vtMonthlyDifference / expectedBusinessDays / contractPosts : 0;
  const vtDaysNotPaid =
    vtDiscountAmountOverride !== undefined && exactVtDailyDifference > 0
      ? Math.max(0, Math.round(vtDiscountAmountOverride / exactVtDailyDifference))
      : rawVtDaysNotPaid;

  const assessmentInput = {
    monthKey,
    managerName: String(formData.get("managerName") || REPORT_MANAGER_NAME).trim(),
    contractMonthlyWithVt,
    vtMonthlyDifference,
    vtDaysNotPaid,
    crecheMonthlyDifference: parseNumber(formData.get("crecheMonthlyDifference"), DEFAULT_CRECHE_MONTHLY_DIFFERENCE),
    crechePaidAmount: parseNumber(formData.get("crechePaidAmount"), 0),
    crecheAdditionalPercentage: parseNumber(formData.get("crecheAdditionalPercentage"), DEFAULT_CRECHE_ADDITIONAL_PERCENTAGE),
    postMonthlyValue,
    expectedBusinessDays,
    minutesPerWorkDay: parseNumber(formData.get("minutesPerWorkDay"), DEFAULT_MINUTES_PER_WORKDAY),
    contractPosts,
    indicator1Occurrences: parseNumber(formData.get("indicator1Occurrences"), 0),
    indicator2Occurrences: parseNumber(formData.get("indicator2Occurrences"), 0),
    indicator3Occurrences: parseNumber(formData.get("indicator3Occurrences"), 0),
    indicator4Occurrences: parseNumber(formData.get("indicator4Occurrences"), 0),
    qualityResponses,
    employees: [] as Array<{ employeeId: string; employeeName: string; punches: Array<{ workDate: Date; type: PunchType; time: string }> }>,
  };

  const { start, end } = getMonthRange(monthKey);
  const employees = await db.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      punches: {
        where: { workDate: { gte: start, lt: end } },
        select: { workDate: true, type: true, time: true },
      },
    },
  });

  assessmentInput.employees = employees.map((employee) => ({ employeeId: employee.id, employeeName: employee.name, punches: employee.punches }));
  const assessment = calculateMonthlyAssessment(assessmentInput);

  await db.$transaction(async (tx) => {
    const existing = await tx.monthlyAssessment.findUnique({ where: { monthKey }, select: { id: true } });
    if (existing) await tx.employeeMonthlyAssessment.deleteMany({ where: { assessmentId: existing.id } });

    const commonData = {
      referenceDate: assessment.referenceDate,
      managerName: assessment.managerName,
      contractMonthlyValue: new Prisma.Decimal(assessment.contractMonthlyValue),
      contractMonthlyWithVt: new Prisma.Decimal(assessment.contractMonthlyWithVt),
      contractMonthlyWithoutVt: new Prisma.Decimal(assessment.contractMonthlyWithoutVt),
      vtMonthlyDifference: new Prisma.Decimal(assessment.vtMonthlyDifference),
      vtDailyDifference: new Prisma.Decimal(assessment.vtDailyDifference),
      vtDaysNotPaid: assessment.vtDaysNotPaid,
      vtDiscountAmount: new Prisma.Decimal(assessment.vtDiscountAmount),
      crecheMonthlyDifference: new Prisma.Decimal(assessment.crecheMonthlyDifference),
      crechePaidAmount: new Prisma.Decimal(assessment.crechePaidAmount),
      crecheAdditionalPercentage: new Prisma.Decimal(assessment.crecheAdditionalPercentage),
      crecheDiscountAmount: new Prisma.Decimal(assessment.crecheDiscountAmount),
      postMonthlyValue: new Prisma.Decimal(assessment.postMonthlyValue),
      minutesPerWorkDay: assessment.minutesPerWorkDay,
      expectedBusinessDays: assessment.expectedBusinessDays,
      totalEmployees: assessment.totalEmployees,
      indicator1Occurrences: assessment.indicator1Occurrences,
      indicator1Score: new Prisma.Decimal(assessment.indicator1Score),
      indicator2Occurrences: assessment.indicator2Occurrences,
      indicator2Score: new Prisma.Decimal(assessment.indicator2Score),
      indicator3Occurrences: assessment.indicator3Occurrences,
      indicator3Score: new Prisma.Decimal(assessment.indicator3Score),
      indicator4Occurrences: assessment.indicator4Occurrences,
      indicator4Score: new Prisma.Decimal(assessment.indicator4Score),
      qualityResponses: assessment.qualityResponses,
      qualityCounts: assessment.qualityCounts,
      indicator5Score: new Prisma.Decimal(assessment.indicator5Score),
      totalScore: new Prisma.Decimal(assessment.totalScore),
      serviceLevelFactor: new Prisma.Decimal(assessment.serviceLevelFactor),
      valueAfterImr: new Prisma.Decimal(assessment.valueAfterImr),
      journeyGlosaTotal: new Prisma.Decimal(assessment.journeyGlosaTotal),
      finalAmount: new Prisma.Decimal(assessment.finalAmount),
      overallScore: new Prisma.Decimal(assessment.overallScore),
      estimatedDiscount: new Prisma.Decimal(assessment.estimatedDiscount),
      createdById: currentUser.id,
    };

    const monthlyAssessment = await tx.monthlyAssessment.upsert({
      where: { monthKey },
      update: commonData,
      create: { monthKey: assessment.monthKey, ...commonData },
    });

    await tx.employeeMonthlyAssessment.createMany({
      data: assessment.items.map((item) => ({
        assessmentId: monthlyAssessment.id,
        employeeId: item.employeeId,
        expectedDays: item.expectedDays,
        workedDays: item.workedDays,
        completeDays: item.completeDays,
        incompleteDays: item.incompleteDays,
        missingDays: item.missingDays,
        workedMinutes: item.workedMinutes,
        missingMinutes: item.missingMinutes,
        journeyGlosaAmount: new Prisma.Decimal(item.journeyGlosaAmount),
        complianceScore: new Prisma.Decimal(item.complianceScore),
        employeeReferenceValue: new Prisma.Decimal(item.employeeReferenceValue),
        estimatedDiscount: new Prisma.Decimal(item.estimatedDiscount),
      })),
    });

    await tx.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "MONTHLY_ASSESSMENT_GENERATED",
        entity: "monthly_assessment",
        entityId: monthlyAssessment.id,
        payload: { monthKey, totalScore: assessment.totalScore, finalAmount: assessment.finalAmount, valueAfterImr: assessment.valueAfterImr, journeyGlosaTotal: assessment.journeyGlosaTotal },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/avaliacoes");
  redirect(`/dashboard/avaliacoes?month=${monthKey}`);
}
