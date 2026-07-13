import { db } from "@/lib/db";
import {
  calculateMonthlyAssessment,
  type CalculatedEmployeeAssessment,
  type QualityRating,
} from "@/lib/assessments";
import {
  DEFAULT_CONTRACT_MONTHLY_VALUE,
  DEFAULT_CONTRACT_POSTS,
  DEFAULT_CRECHE_ADDITIONAL_PERCENTAGE,
  DEFAULT_CRECHE_MONTHLY_DIFFERENCE,
  DEFAULT_EXPECTED_BUSINESS_DAYS,
  JOURNEY_MISSING_TOLERANCE_MINUTES,
  DEFAULT_MINUTES_PER_WORKDAY,
  DEFAULT_POST_MONTHLY_VALUE,
  REPORT_MANAGER_NAME,
  DEFAULT_VT_MONTHLY_DIFFERENCE,
} from "@/lib/constants";
import { calculateWorkedMinutesForPunches, formatMinutesAsHours } from "@/lib/journey";
import { formatMonthLabel, formatWorkDate, getCurrentMonthKey } from "@/lib/utils";

type QualityCounts = {
  O: number;
  B: number;
  R: number;
  I: number;
  N: number;
};

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function getQualityDisplayScore(counts: QualityCounts) {
  const applicable = counts.O + counts.B + counts.R + counts.I;

  if (applicable === 0) {
    return 0;
  }

  return roundToTwo(((counts.O + counts.B) / applicable) * 25);
}

export type JourneyDayReport = {
  workDate: string;
  dateLabel: string;
  entryTimes: string[];
  exitTimes: string[];
  workedMinutes: number;
  missingMinutes: number;
  workedHoursLabel: string;
  missingHoursLabel: string;
  statusLabel: string;
};

export type EmployeeJourneyReport = CalculatedEmployeeAssessment & {
  days: JourneyDayReport[];
};

export type AssessmentHistoryEntry = {
  id: string;
  monthKey: string;
  contractMonthlyWithVt: number;
  totalScore: number;
  finalAmount: number;
  journeyGlosaTotal: number;
  totalEmployees: number;
};

export type ActiveAssessmentReport = Omit<
  ReturnType<typeof calculateMonthlyAssessment>,
  "items" | "qualityCounts" | "qualityResponses"
> & {
  displayMonthLabel: string;
  qualityResponses: Record<string, QualityRating>;
  qualityCounts: QualityCounts;
  qualityDisplayScore: number;
  items: EmployeeJourneyReport[];
};

export type MonthlyAssessmentReportData = {
  activeAssessment: ActiveAssessmentReport;
  assessmentHistory: AssessmentHistoryEntry[];
};

function parseQualityCounts(value: unknown): QualityCounts {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    O: Number(record.O ?? 0),
    B: Number(record.B ?? 0),
    R: Number(record.R ?? 0),
    I: Number(record.I ?? 0),
    N: Number(record.N ?? 0),
  };
}

function parseQualityResponses(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, QualityRating>)
    : {};
}

function buildJourneyDays(
  punches: Array<{ workDate: Date; type: "ENTRY" | "EXIT"; time: string }>,
  minutesPerWorkDay: number,
) {
  const punchesByDay = new Map<string, Array<{ type: "ENTRY" | "EXIT"; time: string }>>();

  for (const punch of punches) {
    const key = punch.workDate.toISOString().slice(0, 10);
    const current = punchesByDay.get(key) ?? [];
    current.push({ type: punch.type, time: punch.time });
    punchesByDay.set(key, current);
  }

  return [...punchesByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([workDate, dayPunches]) => {
      const sortedPunches = [...dayPunches].sort((left, right) => left.time.localeCompare(right.time));
      const entryTimes = sortedPunches.filter((punch) => punch.type === "ENTRY").map((punch) => punch.time);
      const exitTimes = sortedPunches.filter((punch) => punch.type === "EXIT").map((punch) => punch.time);
      const calculation = calculateWorkedMinutesForPunches(sortedPunches);
      const consideredWorkedMinutes = Math.min(calculation.workedMinutes, minutesPerWorkDay);
      const rawMissingMinutes = Math.max(minutesPerWorkDay - consideredWorkedMinutes, 0);
      const missingMinutes = rawMissingMinutes <= JOURNEY_MISSING_TOLERANCE_MINUTES ? 0 : rawMissingMinutes;
      const date = new Date(`${workDate}T00:00:00.000Z`);

      return {
        workDate,
        dateLabel: formatWorkDate(date),
        entryTimes,
        exitTimes,
        workedMinutes: consideredWorkedMinutes,
        missingMinutes,
        workedHoursLabel: formatMinutesAsHours(consideredWorkedMinutes),
        missingHoursLabel: formatMinutesAsHours(missingMinutes),
        statusLabel:
          missingMinutes > 0 || calculation.incomplete
            ? "Incompleta"
            : "Completa",
      } satisfies JourneyDayReport;
    });
}

export async function getMonthlyAssessmentReport(monthKey?: string): Promise<MonthlyAssessmentReportData> {
  const currentMonthKey = getCurrentMonthKey();

  const latestMonth = await db.monthlyAssessment.findFirst({
    orderBy: { referenceDate: "desc" },
    select: { monthKey: true },
  });

  const targetMonthKey = monthKey ?? latestMonth?.monthKey ?? currentMonthKey;
  const targetYear = Number(targetMonthKey.slice(0, 4));
  const targetMonth = Number(targetMonthKey.slice(5));

  const [selectedAssessment, assessmentHistory] = await Promise.all([
    db.monthlyAssessment.findUnique({
      where: { monthKey: targetMonthKey },
      include: {
        items: {
          include: {
            employee: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    db.monthlyAssessment.findMany({
      take: 6,
      orderBy: { referenceDate: "desc" },
      select: {
        id: true,
        monthKey: true,
        contractMonthlyWithVt: true,
        totalScore: true,
        finalAmount: true,
        journeyGlosaTotal: true,
        totalEmployees: true,
      },
    }),
  ]);

  const employeeIds = selectedAssessment
    ? selectedAssessment.items.map((item) => item.employeeId)
    : undefined;

  const employees = await db.employee.findMany({
    where: employeeIds?.length
      ? {
          id: {
            in: employeeIds,
          },
        }
      : {
          active: true,
        },
    orderBy: { name: "asc" },
    include: {
      punches: {
        where: {
          workDate: {
            gte: new Date(Date.UTC(targetYear, targetMonth - 1, 1)),
            lt: new Date(Date.UTC(targetYear, targetMonth, 1)),
          },
        },
        select: {
          workDate: true,
          type: true,
          time: true,
        },
        orderBy: [{ workDate: "asc" }, { time: "asc" }],
      },
    },
  });

  const employeePunchMap = new Map(
    employees.map((employee) => [
      employee.id,
      {
        employeeId: employee.id,
        employeeName: employee.name,
        punches: employee.punches,
      },
    ]),
  );

  const activeAssessment = selectedAssessment
    ? {
        monthKey: selectedAssessment.monthKey,
        referenceDate: selectedAssessment.referenceDate,
        managerName: selectedAssessment.managerName || REPORT_MANAGER_NAME,
        contractMonthlyValue: Number(selectedAssessment.contractMonthlyValue),
        contractMonthlyWithVt: Number(selectedAssessment.contractMonthlyWithVt),
        contractMonthlyWithoutVt: Number(selectedAssessment.contractMonthlyWithoutVt),
        vtMonthlyDifference: Number(selectedAssessment.vtMonthlyDifference),
        vtDailyDifference: Number(selectedAssessment.vtDailyDifference),
        vtDaysNotPaid: selectedAssessment.vtDaysNotPaid,
        vtDiscountAmount: Number(selectedAssessment.vtDiscountAmount),
        crecheMonthlyDifference: Number(selectedAssessment.crecheMonthlyDifference),
        crechePaidAmount: Number(selectedAssessment.crechePaidAmount),
        crecheAdditionalPercentage: Number(selectedAssessment.crecheAdditionalPercentage),
        crecheDiscountAmount: Number(selectedAssessment.crecheDiscountAmount),
        postMonthlyValue: Number(selectedAssessment.postMonthlyValue),
        minutesPerWorkDay: selectedAssessment.minutesPerWorkDay,
        expectedBusinessDays: selectedAssessment.expectedBusinessDays,
        totalEmployees: selectedAssessment.totalEmployees,
        indicator1Occurrences: selectedAssessment.indicator1Occurrences,
        indicator1Score: Number(selectedAssessment.indicator1Score),
        indicator2Occurrences: selectedAssessment.indicator2Occurrences,
        indicator2Score: Number(selectedAssessment.indicator2Score),
        indicator3Occurrences: selectedAssessment.indicator3Occurrences,
        indicator3Score: Number(selectedAssessment.indicator3Score),
        indicator4Occurrences: selectedAssessment.indicator4Occurrences,
        indicator4Score: Number(selectedAssessment.indicator4Score),
        qualityResponses: parseQualityResponses(selectedAssessment.qualityResponses),
        qualityCounts: parseQualityCounts(selectedAssessment.qualityCounts),
        indicator5Score: Number(selectedAssessment.indicator5Score),
        totalScore: Number(selectedAssessment.totalScore),
        serviceLevelFactor: Number(selectedAssessment.serviceLevelFactor),
        valueAfterImr: Number(selectedAssessment.valueAfterImr),
        journeyGlosaTotal: Number(selectedAssessment.journeyGlosaTotal),
        finalAmount: Number(selectedAssessment.finalAmount),
        overallScore: Number(selectedAssessment.overallScore),
        estimatedDiscount: Number(selectedAssessment.estimatedDiscount),
        items: [...selectedAssessment.items]
          .sort((left, right) => left.employee.name.localeCompare(right.employee.name))
          .map((item) => ({
            employeeId: item.employeeId,
            employeeName: item.employee.name,
            expectedDays: item.expectedDays,
            workedDays: item.workedDays,
            completeDays: item.completeDays,
            incompleteDays: item.incompleteDays,
            missingDays: item.missingDays,
            workedMinutes: item.workedMinutes,
            missingMinutes: item.missingMinutes,
            journeyGlosaAmount: Number(item.journeyGlosaAmount),
            complianceScore: Number(item.complianceScore),
            employeeReferenceValue: Number(item.employeeReferenceValue),
            estimatedDiscount: Number(item.estimatedDiscount),
            days: buildJourneyDays(employeePunchMap.get(item.employeeId)?.punches ?? [], selectedAssessment.minutesPerWorkDay),
          })),
      }
    : (() => {
        const preview = calculateMonthlyAssessment({
          monthKey: targetMonthKey,
          managerName: REPORT_MANAGER_NAME,
          contractMonthlyWithVt: DEFAULT_CONTRACT_MONTHLY_VALUE,
          vtMonthlyDifference: DEFAULT_VT_MONTHLY_DIFFERENCE,
          vtDaysNotPaid: 0,
          crecheMonthlyDifference: DEFAULT_CRECHE_MONTHLY_DIFFERENCE,
          crechePaidAmount: 0,
          crecheAdditionalPercentage: DEFAULT_CRECHE_ADDITIONAL_PERCENTAGE,
          postMonthlyValue: DEFAULT_POST_MONTHLY_VALUE,
          expectedBusinessDays: DEFAULT_EXPECTED_BUSINESS_DAYS,
          minutesPerWorkDay: DEFAULT_MINUTES_PER_WORKDAY,
          contractPosts: DEFAULT_CONTRACT_POSTS,
          indicator1Occurrences: 0,
          indicator2Occurrences: 0,
          indicator3Occurrences: 0,
          indicator4Occurrences: 0,
          qualityResponses: {},
          employees: employees.map((employee) => ({
            employeeId: employee.id,
            employeeName: employee.name,
            punches: employee.punches,
          })),
        });

        return {
          ...preview,
          qualityResponses: preview.qualityResponses,
          qualityCounts: preview.qualityCounts,
          items: preview.items.map((item) => ({
            ...item,
            days: buildJourneyDays(employeePunchMap.get(item.employeeId)?.punches ?? [], preview.minutesPerWorkDay),
          })),
        };
      })();

  const qualityDisplayScore = getQualityDisplayScore(activeAssessment.qualityCounts);

  return {
    activeAssessment: {
      ...activeAssessment,
      displayMonthLabel: formatMonthLabel(activeAssessment.monthKey),
      qualityDisplayScore,
    },
    assessmentHistory: assessmentHistory.map((item) => ({
      id: item.id,
      monthKey: item.monthKey,
      contractMonthlyWithVt: Number(item.contractMonthlyWithVt),
      totalScore: Number(item.totalScore),
      finalAmount: Number(item.finalAmount),
      journeyGlosaTotal: Number(item.journeyGlosaTotal),
      totalEmployees: item.totalEmployees,
    })),
  };
}
