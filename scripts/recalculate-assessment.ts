import { Prisma, PunchType } from "@prisma/client";

import { calculateMonthlyAssessment, getMonthRange, type QualityRating } from "../src/lib/assessments";
import { db } from "../src/lib/db";

type MonthlyAssessmentSnapshot = {
  monthKey: string;
  managerName: string;
  contractMonthlyWithVt: Prisma.Decimal;
  vtMonthlyDifference: Prisma.Decimal;
  vtDaysNotPaid: number;
  crecheMonthlyDifference: Prisma.Decimal;
  crechePaidAmount: Prisma.Decimal;
  crecheAdditionalPercentage: Prisma.Decimal;
  postMonthlyValue: Prisma.Decimal;
  expectedBusinessDays: number;
  minutesPerWorkDay: number;
  indicator1Occurrences: number;
  indicator2Occurrences: number;
  indicator3Occurrences: number;
  indicator4Occurrences: number;
  qualityResponses: unknown;
};

function parseQualityResponses(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, QualityRating>)
    : {};
}

async function main() {
  const monthKey = process.argv[2];
  const vtDaysNotPaidArg = process.argv[3];

  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    throw new Error("Informe o mês no formato AAAA-MM. Ex.: npx tsx scripts/recalculate-assessment.ts 2026-06 110");
  }

  const vtDaysNotPaid = Number(vtDaysNotPaidArg);

  if (!Number.isInteger(vtDaysNotPaid) || vtDaysNotPaid < 0) {
    throw new Error("Informe a quantidade de dias sem VT como inteiro não negativo.");
  }

  const existing = await db.monthlyAssessment.findUnique({
    where: { monthKey },
    select: {
      id: true,
      monthKey: true,
      managerName: true,
      contractMonthlyWithVt: true,
      vtMonthlyDifference: true,
      vtDaysNotPaid: true,
      crecheMonthlyDifference: true,
      crechePaidAmount: true,
      crecheAdditionalPercentage: true,
      postMonthlyValue: true,
      expectedBusinessDays: true,
      minutesPerWorkDay: true,
      indicator1Occurrences: true,
      indicator2Occurrences: true,
      indicator3Occurrences: true,
      indicator4Occurrences: true,
      qualityResponses: true,
    },
  });

  if (!existing) {
    throw new Error(`Avaliação ${monthKey} não encontrada.`);
  }

  const { start, end } = getMonthRange(monthKey);
  const employees = await db.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      punches: {
        where: {
          workDate: {
            gte: start,
            lt: end,
          },
        },
        select: {
          workDate: true,
          type: true,
          time: true,
        },
      },
    },
  });

  const assessment = calculateMonthlyAssessment({
    monthKey,
    managerName: existing.managerName,
    contractMonthlyWithVt: Number(existing.contractMonthlyWithVt),
    vtMonthlyDifference: Number(existing.vtMonthlyDifference),
    vtDaysNotPaid,
    crecheMonthlyDifference: Number(existing.crecheMonthlyDifference),
    crechePaidAmount: Number(existing.crechePaidAmount),
    crecheAdditionalPercentage: Number(existing.crecheAdditionalPercentage),
    postMonthlyValue: Number(existing.postMonthlyValue),
    expectedBusinessDays: existing.expectedBusinessDays,
    minutesPerWorkDay: existing.minutesPerWorkDay,
    indicator1Occurrences: existing.indicator1Occurrences,
    indicator2Occurrences: existing.indicator2Occurrences,
    indicator3Occurrences: existing.indicator3Occurrences,
    indicator4Occurrences: existing.indicator4Occurrences,
    qualityResponses: parseQualityResponses(existing.qualityResponses),
    employees: employees.map((employee) => ({
      employeeId: employee.id,
      employeeName: employee.name,
      punches: employee.punches as Array<{ workDate: Date; type: PunchType; time: string }>,
    })),
  });

  await db.$transaction(async (tx) => {
    await tx.employeeMonthlyAssessment.deleteMany({
      where: { assessmentId: existing.id },
    });

    const monthlyAssessment = await tx.monthlyAssessment.update({
      where: { monthKey },
      data: {
        referenceDate: assessment.referenceDate,
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
      },
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
  });

  console.log(
    JSON.stringify(
      {
        monthKey,
        vtDaysNotPaid: assessment.vtDaysNotPaid,
        vtDiscountAmount: assessment.vtDiscountAmount,
        contractMonthlyValue: assessment.contractMonthlyValue,
        valueAfterImr: assessment.valueAfterImr,
        finalAmount: assessment.finalAmount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });