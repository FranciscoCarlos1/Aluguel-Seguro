import { PunchType, type TimePunch } from "@prisma/client";

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
import { calculateWorkedMinutesForPunches } from "@/lib/journey";
import { parseIsoDateToUtcDate } from "@/lib/utils";

export type QualityRating = "O" | "B" | "R" | "I" | "N";

export type ImrIndicatorDefinition = {
  code: "IND1" | "IND2" | "IND3" | "IND4" | "IND5";
  title: string;
  shortTitle: string;
  finalidade: string;
  target: string;
  measurementInstrument: string;
  periodicity: string;
  reportMetric: string;
  maxPoints: number;
  scoreBands: string[];
};

export const IMR_INDICATORS: ImrIndicatorDefinition[] = [
  {
    code: "IND1",
    title: "Uso dos EPI's e Uniformes",
    shortTitle: "EPI e uniforme",
    finalidade:
      "Mensurar o atendimento às exigências específicas relacionadas à segurança do trabalho, fornecimento e uso dos uniformes.",
    target: "Nenhuma ocorrência no mês.",
    measurementInstrument: "Constatação formal de ocorrências.",
    periodicity: "Diária, com aferição mensal do trabalho.",
    reportMetric: "Número de ocorrências registradas no mês.",
    maxPoints: 10,
    scoreBands: [
      "Sem ocorrências = 10 pontos",
      "1 ocorrência = 8 pontos",
      "2 ocorrências = 6 pontos",
      "3 ocorrências = 4 pontos",
      "4 ocorrências = 2 pontos",
      "5 ou mais ocorrências = 0 pontos",
    ],
  },
  {
    code: "IND2",
    title: "Tempo de Respostas às Solicitações da Contratante",
    shortTitle: "Tempo de resposta",
    finalidade: "Avaliar a agilidade da contratada no atendimento às solicitações da contratante.",
    target: "Atendimento imediato.",
    measurementInstrument: "Registro de solicitações.",
    periodicity: "Mensal.",
    reportMetric: "Quantidade de respostas tardias ou de dias de atraso apurados no mês.",
    maxPoints: 10,
    scoreBands: [
      "Sem ocorrências = 10 pontos",
      "1 resposta ou 1 dia de atraso = 8 pontos",
      "2 respostas ou 2 dias de atraso = 6 pontos",
      "3 respostas ou 3 dias de atraso = 4 pontos",
      "4 respostas ou 4 dias de atraso = 2 pontos",
      "5 ou mais respostas ou dias de atraso = 0 pontos",
    ],
  },
  {
    code: "IND3",
    title: "Atraso no Pagamento de Salários e Outros Benefícios",
    shortTitle: "Pagamento de salários e benefícios",
    finalidade: "Verificar o cumprimento das obrigações trabalhistas e sociais da contratada.",
    target: "Nenhum atraso.",
    measurementInstrument: "Análise documental.",
    periodicity: "Mensal.",
    reportMetric: "Número de ocorrências de atraso no pagamento de salários e benefícios.",
    maxPoints: 35,
    scoreBands: ["Sem ocorrências = 35 pontos", "1 ou mais ocorrências = 0 pontos"],
  },
  {
    code: "IND4",
    title: "Falta de Materiais Previstos no Contrato",
    shortTitle: "Falta de materiais",
    finalidade: "Garantir a disponibilidade dos materiais necessários à execução dos serviços.",
    target: "Nenhuma falta.",
    measurementInstrument: "Registro de ocorrências.",
    periodicity: "Mensal.",
    reportMetric: "Número de ocorrências de falta de materiais previstos no contrato.",
    maxPoints: 20,
    scoreBands: ["Sem ocorrências = 20 pontos", "1 ou mais ocorrências = 0 pontos"],
  },
  {
    code: "IND5",
    title: "Qualidade dos Serviços Prestados",
    shortTitle: "Pesquisa de qualidade",
    finalidade: "Avaliar a qualidade global dos serviços executados.",
    target: "Resultado da pesquisa de satisfação da contratante.",
    measurementInstrument: "Pesquisa de satisfação realizada pela contratante.",
    periodicity: "Mensal.",
    reportMetric: "Média aritmética das avaliações dos quesitos aplicáveis, com peso de até 25 pontos.",
    maxPoints: 25,
    scoreBands: [
      "Índice O = número de Ótimo / quesitos avaliados",
      "Índice B = número de Bom / quesitos avaliados",
      "Pontuação = (Índice O + Índice B) x 25",
      "Quesitos com N não entram no divisor",
    ],
  },
];

export const QUALITY_QUESTIONS = [
  { key: "q1", section: "Execução dos Serviços", label: "Avaliação direta dos banheiros em geral" },
  { key: "q2", section: "Execução dos Serviços", label: "Avaliação direta dos móveis" },
  { key: "q3", section: "Execução dos Serviços", label: "Avaliação direta das paredes e forros" },
  { key: "q4", section: "Execução dos Serviços", label: "Avaliação direta dos pisos em geral" },
  { key: "q5", section: "Execução dos Serviços", label: "Avaliação direta das esquadrias internas e externas" },
  { key: "q6", section: "Execução dos Serviços", label: "Avaliação direta dos laboratórios e salas de aula" },
  { key: "q7", section: "Execução dos Serviços", label: "Avaliação direta das salas administrativas e salas dos professores" },
  { key: "q8", section: "Execução dos Serviços", label: "Avaliação direta dos recipientes de lixo" },
  { key: "q9", section: "Execução dos Serviços", label: "Avaliação direta das áreas externas" },
  { key: "q10", section: "Execução dos Serviços", label: "Técnicas de limpeza" },
  { key: "q11", section: "Execução dos Serviços", label: "Acondicionamento dos materiais e equipamentos de limpeza" },
  { key: "q12", section: "Funcionários", label: "Cumprimento do horário de trabalho" },
  { key: "q13", section: "Funcionários", label: "Qualidade na execução dos serviços" },
  { key: "q14", section: "Funcionários", label: "Utilização de EPI’s" },
  { key: "q15", section: "Funcionários", label: "Utilização de uniforme/crachá" },
  { key: "q16", section: "Funcionários", label: "Organização do ambiente de trabalho" },
  { key: "q17", section: "Funcionários", label: "Relacionamento interpessoal" },
  { key: "q18", section: "Empresa Contratada", label: "Substituição de funcionários em tempo adequado" },
  { key: "q19", section: "Empresa Contratada", label: "Qualidade dos materiais disponibilizados" },
  { key: "q20", section: "Empresa Contratada", label: "Presença e fiscalização periódica do preposto" },
  { key: "q21", section: "Empresa Contratada", label: "Atendimento em tempo hábil de documentação exigida pela contratante" },
] as const;

export function getQualityApplicableCount(counts: Record<QualityRating, number>) {
  return counts.O + counts.B + counts.R + counts.I;
}

export function getQualityIndexes(counts: Record<QualityRating, number>) {
  const applicable = getQualityApplicableCount(counts);

  if (applicable === 0) {
    return { applicable, O: 0, B: 0, R: 0, I: 0 };
  }

  return {
    applicable,
    O: roundToTwo(counts.O / applicable),
    B: roundToTwo(counts.B / applicable),
    R: roundToTwo(counts.R / applicable),
    I: roundToTwo(counts.I / applicable),
  };
}

type EmployeeAssessmentInput = {
  employeeId: string;
  employeeName: string;
  punches: Pick<TimePunch, "workDate" | "type" | "time">[];
};

export type AssessmentFormInput = {
  monthKey: string;
  managerName?: string;
  contractMonthlyWithVt?: number;
  vtMonthlyDifference?: number;
  vtDaysNotPaid?: number;
  crecheMonthlyDifference?: number;
  crechePaidAmount?: number;
  crecheAdditionalPercentage?: number;
  postMonthlyValue?: number;
  expectedBusinessDays?: number;
  minutesPerWorkDay?: number;
  contractPosts?: number;
  indicator1Occurrences?: number;
  indicator2Occurrences?: number;
  indicator3Occurrences?: number;
  indicator4Occurrences?: number;
  qualityResponses: Record<string, QualityRating>;
  employees: EmployeeAssessmentInput[];
};

export type CalculatedEmployeeAssessment = {
  employeeId: string;
  employeeName: string;
  expectedDays: number;
  workedDays: number;
  completeDays: number;
  incompleteDays: number;
  missingDays: number;
  workedMinutes: number;
  missingMinutes: number;
  journeyGlosaAmount: number;
  complianceScore: number;
  employeeReferenceValue: number;
  estimatedDiscount: number;
};

export type CalculatedMonthlyAssessment = {
  monthKey: string;
  referenceDate: Date;
  managerName: string;
  contractMonthlyValue: number;
  contractMonthlyWithVt: number;
  contractMonthlyWithoutVt: number;
  vtMonthlyDifference: number;
  vtDailyDifference: number;
  vtDaysNotPaid: number;
  vtDiscountAmount: number;
  crecheMonthlyDifference: number;
  crechePaidAmount: number;
  crecheAdditionalPercentage: number;
  crecheDiscountAmount: number;
  postMonthlyValue: number;
  minutesPerWorkDay: number;
  expectedBusinessDays: number;
  totalEmployees: number;
  indicator1Occurrences: number;
  indicator1Score: number;
  indicator2Occurrences: number;
  indicator2Score: number;
  indicator3Occurrences: number;
  indicator3Score: number;
  indicator4Occurrences: number;
  indicator4Score: number;
  qualityResponses: Record<string, QualityRating>;
  qualityCounts: Record<QualityRating, number>;
  indicator5Score: number;
  totalScore: number;
  serviceLevelFactor: number;
  valueAfterImr: number;
  journeyGlosaTotal: number;
  finalAmount: number;
  overallScore: number;
  estimatedDiscount: number;
  items: CalculatedEmployeeAssessment[];
};

export function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { start, end };
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function scoreIndicator1(occurrences: number) {
  if (occurrences <= 0) return 10;
  if (occurrences === 1) return 8;
  if (occurrences === 2) return 6;
  if (occurrences === 3) return 4;
  if (occurrences === 4) return 2;
  return 0;
}

function scoreIndicator2(occurrences: number) {
  if (occurrences <= 0) return 10;
  if (occurrences === 1) return 8;
  if (occurrences === 2) return 6;
  if (occurrences === 3) return 4;
  if (occurrences === 4) return 2;
  return 0;
}

function scoreIndicator3(occurrences: number) {
  return occurrences <= 0 ? 35 : 0;
}

function scoreIndicator4(occurrences: number) {
  return occurrences <= 0 ? 20 : 0;
}

function scoreIndicator5(responses: Record<string, QualityRating>) {
  const counts: Record<QualityRating, number> = { O: 0, B: 0, R: 0, I: 0, N: 0 };

  for (const question of QUALITY_QUESTIONS) {
    const rating = responses[question.key] ?? "N";
    counts[rating] += 1;
  }

  const applicable = counts.O + counts.B + counts.R + counts.I;

  if (applicable === 0) {
    return { score: 0, counts };
  }

  return {
    score: roundToTwo(((counts.O + counts.B) / applicable) * 25),
    counts,
  };
}

function getServiceLevelFactor(totalScore: number) {
  if (totalScore >= 80) return 1;
  if (totalScore >= 70) return 0.97;
  if (totalScore >= 60) return 0.95;
  if (totalScore >= 50) return 0.93;
  return 0.9;
}

function calculateEmployeeAssessment(
  employee: EmployeeAssessmentInput,
  expectedBusinessDays: number,
  minutesPerWorkDay: number,
  postMonthlyValue: number,
) {
  const punchesByDay = new Map<string, Pick<TimePunch, "type" | "time">[]>();

  for (const punch of employee.punches) {
    const key = punch.workDate.toISOString().slice(0, 10);
    const current = punchesByDay.get(key) ?? [];
    current.push({ type: punch.type, time: punch.time });
    punchesByDay.set(key, current);
  }

  let workedDays = 0;
  let completeDays = 0;
  let incompleteDays = 0;
  let workedMinutes = 0;
  let missingMinutes = 0;

  for (const dayPunches of punchesByDay.values()) {
    const result = calculateWorkedMinutesForPunches(dayPunches);
    const consideredWorkedMinutes = Math.min(result.workedMinutes, minutesPerWorkDay);
    const rawMissingMinutes = Math.max(minutesPerWorkDay - consideredWorkedMinutes, 0);
    const dayMissingMinutes = rawMissingMinutes <= JOURNEY_MISSING_TOLERANCE_MINUTES ? 0 : rawMissingMinutes;

    workedDays += 1;
    workedMinutes += consideredWorkedMinutes;
    missingMinutes += dayMissingMinutes;

    if (dayMissingMinutes === 0 && !result.incomplete) {
      completeDays += 1;
    } else {
      incompleteDays += 1;
    }
  }

  const missingDays = Math.max(expectedBusinessDays - workedDays, 0);
  const journeyGlosaAmount = roundToTwo(((postMonthlyValue / expectedBusinessDays) / minutesPerWorkDay) * missingMinutes);
  const employeeReferenceValue = roundToTwo(postMonthlyValue);
  const complianceScore =
    expectedBusinessDays === 0
      ? 100
      : roundToTwo(
          Math.max(
            0,
            ((expectedBusinessDays * minutesPerWorkDay - missingMinutes) / (expectedBusinessDays * minutesPerWorkDay)) * 100,
          ),
        );

  return {
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    expectedDays: expectedBusinessDays,
    workedDays,
    completeDays,
    incompleteDays,
    missingDays,
    workedMinutes,
    missingMinutes,
    journeyGlosaAmount,
    complianceScore,
    employeeReferenceValue,
    estimatedDiscount: journeyGlosaAmount,
  } satisfies CalculatedEmployeeAssessment;
}

export function calculateMonthlyAssessment(input: AssessmentFormInput) {
  const managerName = input.managerName?.trim() || REPORT_MANAGER_NAME;
  const contractMonthlyWithVt = input.contractMonthlyWithVt ?? DEFAULT_CONTRACT_MONTHLY_VALUE;
  const vtMonthlyDifference = input.vtMonthlyDifference ?? DEFAULT_VT_MONTHLY_DIFFERENCE;
  const vtDaysNotPaid = input.vtDaysNotPaid ?? 0;
  const crecheMonthlyDifference = input.crecheMonthlyDifference ?? DEFAULT_CRECHE_MONTHLY_DIFFERENCE;
  const crechePaidAmount = input.crechePaidAmount ?? 0;
  const crecheAdditionalPercentage = input.crecheAdditionalPercentage ?? DEFAULT_CRECHE_ADDITIONAL_PERCENTAGE;
  const postMonthlyValue = input.postMonthlyValue ?? DEFAULT_POST_MONTHLY_VALUE;
  const expectedBusinessDays = input.expectedBusinessDays ?? DEFAULT_EXPECTED_BUSINESS_DAYS;
  const minutesPerWorkDay = input.minutesPerWorkDay ?? DEFAULT_MINUTES_PER_WORKDAY;
  const contractPosts = input.contractPosts ?? DEFAULT_CONTRACT_POSTS;

  const exactVtDailyDifference = vtMonthlyDifference / expectedBusinessDays / contractPosts;
  const vtDailyDifference = roundToTwo(exactVtDailyDifference);
  const vtDiscountAmount = roundToTwo(exactVtDailyDifference * vtDaysNotPaid);
  const crechePaidWithAdditionalCosts = roundToTwo(crechePaidAmount * (1 + crecheAdditionalPercentage));
  const crecheDiscountAmount = roundToTwo(Math.max(crecheMonthlyDifference - crechePaidWithAdditionalCosts, 0));
  const contractMonthlyWithoutVt = roundToTwo(contractMonthlyWithVt - vtMonthlyDifference);
  const contractMonthlyValue = roundToTwo(contractMonthlyWithVt - vtDiscountAmount - crecheDiscountAmount);

  const indicator1Occurrences = input.indicator1Occurrences ?? 0;
  const indicator2Occurrences = input.indicator2Occurrences ?? 0;
  const indicator3Occurrences = input.indicator3Occurrences ?? 0;
  const indicator4Occurrences = input.indicator4Occurrences ?? 0;

  const indicator1Score = scoreIndicator1(indicator1Occurrences);
  const indicator2Score = scoreIndicator2(indicator2Occurrences);
  const indicator3Score = scoreIndicator3(indicator3Occurrences);
  const indicator4Score = scoreIndicator4(indicator4Occurrences);
  const quality = scoreIndicator5(input.qualityResponses);
  const totalScore = roundToTwo(
    indicator1Score + indicator2Score + indicator3Score + indicator4Score + quality.score,
  );
  const serviceLevelFactor = getServiceLevelFactor(totalScore);
  const valueAfterImr = roundToTwo(contractMonthlyValue * serviceLevelFactor);

  const items = input.employees.map((employee) =>
    calculateEmployeeAssessment(employee, expectedBusinessDays, minutesPerWorkDay, postMonthlyValue),
  );

  const journeyGlosaTotal = roundToTwo(items.reduce((total, item) => total + item.journeyGlosaAmount, 0));
  const finalAmount = valueAfterImr;
  const estimatedDiscount = roundToTwo(contractMonthlyWithVt - finalAmount);

  return {
    monthKey: input.monthKey,
    referenceDate: parseIsoDateToUtcDate(`${input.monthKey}-01`),
    managerName,
    contractMonthlyValue,
    contractMonthlyWithVt,
    contractMonthlyWithoutVt,
    vtMonthlyDifference,
    vtDailyDifference,
    vtDaysNotPaid,
    vtDiscountAmount,
    crecheMonthlyDifference,
    crechePaidAmount,
    crecheAdditionalPercentage,
    crecheDiscountAmount,
    postMonthlyValue,
    minutesPerWorkDay,
    expectedBusinessDays,
    totalEmployees: input.employees.length,
    indicator1Occurrences,
    indicator1Score,
    indicator2Occurrences,
    indicator2Score,
    indicator3Occurrences,
    indicator3Score,
    indicator4Occurrences,
    indicator4Score,
    qualityResponses: input.qualityResponses,
    qualityCounts: quality.counts,
    indicator5Score: quality.score,
    totalScore,
    serviceLevelFactor,
    valueAfterImr,
    journeyGlosaTotal,
    finalAmount,
    overallScore: totalScore,
    estimatedDiscount,
    items,
  } satisfies CalculatedMonthlyAssessment;
}
