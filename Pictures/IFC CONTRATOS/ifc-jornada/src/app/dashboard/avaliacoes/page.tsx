import { Role } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Calculator, ClipboardList, FileBarChart2, FileDown, Wallet } from "lucide-react";

import { AssessmentForm } from "@/components/dashboard/assessment-form";
import { getMonthlyAssessmentReport } from "@/lib/assessment-report";
import { getQualityApplicableCount, getQualityIndexes, IMR_INDICATORS } from "@/lib/assessments";
import { requireUser } from "@/lib/auth";
import {
  DEFAULT_CONTRACT_POSTS,
  REPORT_CONTRACT_CODE,
  REPORT_CONTRACTOR_NAME,
  REPORT_DEFAULT_COMMENT,
  REPORT_MANAGER_NAME,
  REPORT_ORGANIZATION_UNIT,
} from "@/lib/constants";
import { formatCurrencyBRL } from "@/lib/utils";

type AvaliacoesPageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

export default async function AvaliacoesPage({ searchParams }: AvaliacoesPageProps) {
  const currentUser = await requireUser([Role.ADMIN, Role.OPERATOR, Role.AUDITOR]);

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedMonthKey =
    typeof resolvedSearchParams.month === "string" && /^\d{4}-\d{2}$/.test(resolvedSearchParams.month)
      ? resolvedSearchParams.month
      : undefined;

  const { activeAssessment } = await getMonthlyAssessmentReport(selectedMonthKey);
  const qualityApplicableCount = getQualityApplicableCount(activeAssessment.qualityCounts);
  const qualityIndexes = getQualityIndexes(activeAssessment.qualityCounts);

  const indicatorCards = [
    {
      title: "Indicador 1",
      subtitle: "EPI, uniforme e apresentação",
      occurrences: activeAssessment.indicator1Occurrences,
      score: activeAssessment.indicator1Score,
    },
    {
      title: "Indicador 2",
      subtitle: "Resposta e solução de demandas",
      occurrences: activeAssessment.indicator2Occurrences,
      score: activeAssessment.indicator2Score,
    },
    {
      title: "Indicador 3",
      subtitle: "Regularidade salarial",
      occurrences: activeAssessment.indicator3Occurrences,
      score: activeAssessment.indicator3Score,
    },
    {
      title: "Indicador 4",
      subtitle: "Disponibilidade de materiais",
      occurrences: activeAssessment.indicator4Occurrences,
      score: activeAssessment.indicator4Score,
    },
    {
      title: "Indicador 5",
      subtitle: "Pesquisa de qualidade",
      occurrences: qualityApplicableCount,
      score: activeAssessment.qualityDisplayScore,
    },
  ];

  const indicatorRows = [
    {
      definition: IMR_INDICATORS[0],
      metricValue: `${activeAssessment.indicator1Occurrences} ocorrência(s)`,
      score: activeAssessment.indicator1Score,
      notes: IMR_INDICATORS[0].scoreBands.join(" | "),
    },
    {
      definition: IMR_INDICATORS[1],
      metricValue: `${activeAssessment.indicator2Occurrences} ocorrência(s)`,
      score: activeAssessment.indicator2Score,
      notes: IMR_INDICATORS[1].scoreBands.join(" | "),
    },
    {
      definition: IMR_INDICATORS[2],
      metricValue: `${activeAssessment.indicator3Occurrences} ocorrência(s)`,
      score: activeAssessment.indicator3Score,
      notes: IMR_INDICATORS[2].scoreBands.join(" | "),
    },
    {
      definition: IMR_INDICATORS[3],
      metricValue: `${activeAssessment.indicator4Occurrences} ocorrência(s)`,
      score: activeAssessment.indicator4Score,
      notes: IMR_INDICATORS[3].scoreBands.join(" | "),
    },
    {
      definition: IMR_INDICATORS[4],
      metricValue: `${qualityApplicableCount} quesito(s) aplicável(is)`,
      score: activeAssessment.qualityDisplayScore,
      notes: `O=${qualityIndexes.O.toFixed(2)} | B=${qualityIndexes.B.toFixed(2)} | R=${qualityIndexes.R.toFixed(2)} | I=${qualityIndexes.I.toFixed(2)}`,
    },
  ];

  return (
    <main className="flex flex-col gap-6">
      <section className="panel p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Plataforma oficial</p>
            <h1 className="mt-3 text-3xl font-bold">IFC FISCALIZA</h1>
            <span className="mt-4 inline-flex badge bg-accent-soft text-accent-strong">FISCALIZAÇÃO DE CONTRATO DE LIMPEZA</span>
            <h2 className="mt-4 text-2xl font-bold">IMR, apuração financeira e glosa de jornada</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
              O relatório consolida as ocorrências dos indicadores oficiais, a pesquisa de qualidade, os ajustes de VT e
              creche, a glosa calculada a partir das batidas e o espelho de jornada diário de cada funcionária.
            </p>
            <div className="mt-5 max-w-2xl overflow-hidden rounded-3xl border border-line bg-white/70 p-3">
              <Image
                src="/ifc-sbs-mark.svg"
                alt="Instituto Federal Catarinense Campus São Bento do Sul"
                width={720}
                height={720}
                className="mx-auto h-auto w-full max-w-sm rounded-2xl"
                priority
              />
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3 xl:items-end">
            <form action="/dashboard/avaliacoes" className="flex w-full flex-col gap-2 rounded-3xl border border-line bg-white/80 p-4">
              <label className="text-sm font-semibold text-foreground" htmlFor="report-month">
                Selecionar mês do relatório
              </label>
              <div className="flex gap-2">
                <input
                  id="report-month"
                  name="month"
                  type="month"
                  defaultValue={activeAssessment.monthKey}
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button className="primary-button whitespace-nowrap" type="submit">
                  Abrir
                </button>
              </div>
            </form>
            <a
              className="secondary-button inline-flex items-center gap-2"
              href={`/api/reports/assessments/${activeAssessment.monthKey}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <FileDown size={16} />
              Baixar relatório em PDF
            </a>
          </div>
        </div>
        <div className="mt-6 grid gap-3 text-sm text-muted md:grid-cols-2 xl:grid-cols-3">
          <p><span className="font-semibold text-foreground">Competência:</span> {activeAssessment.monthKey}</p>
          <p><span className="font-semibold text-foreground">Órgão/Unidade:</span> {REPORT_ORGANIZATION_UNIT}</p>
          <p><span className="font-semibold text-foreground">Contrato:</span> {REPORT_CONTRACT_CODE}</p>
          <p><span className="font-semibold text-foreground">Gestor/Responsável:</span> {REPORT_MANAGER_NAME}</p>
          <p><span className="font-semibold text-foreground">Contratada:</span> {REPORT_CONTRACTOR_NAME}</p>
          <p><span className="font-semibold text-foreground">Comentário:</span> {REPORT_DEFAULT_COMMENT}</p>
        </div>
      </section>

      <AssessmentForm
        defaultMonthKey={activeAssessment.monthKey}
        isReadOnly={currentUser.role !== Role.ADMIN}
        defaults={{
          contractMonthlyWithVt: activeAssessment.contractMonthlyWithVt,
          vtMonthlyDifference: activeAssessment.vtMonthlyDifference,
          vtDaysNotPaid: activeAssessment.vtDaysNotPaid,
          crecheMonthlyDifference: activeAssessment.crecheMonthlyDifference,
          crechePaidAmount: activeAssessment.crechePaidAmount,
          crecheAdditionalPercentage: activeAssessment.crecheAdditionalPercentage,
          postMonthlyValue: activeAssessment.postMonthlyValue,
          expectedBusinessDays: activeAssessment.expectedBusinessDays,
          minutesPerWorkDay: activeAssessment.minutesPerWorkDay,
          contractPosts: DEFAULT_CONTRACT_POSTS,
          indicator1Occurrences: activeAssessment.indicator1Occurrences,
          indicator2Occurrences: activeAssessment.indicator2Occurrences,
          indicator3Occurrences: activeAssessment.indicator3Occurrences,
          indicator4Occurrences: activeAssessment.indicator4Occurrences,
          qualityResponses: activeAssessment.qualityResponses,
        }}
      />

      <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-5">
        <article className="panel-muted p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Mês avaliado</p>
            <FileBarChart2 size={18} className="text-accent-strong" />
          </div>
          <p className="mt-4 text-2xl font-bold capitalize">{activeAssessment.displayMonthLabel}</p>
        </article>
        <article className="panel-muted p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Nota total IMR</p>
            <Calculator size={18} className="text-accent-strong" />
          </div>
          <p className="mt-4 text-4xl font-bold">{activeAssessment.totalScore.toFixed(2)}</p>
        </article>
        <article className="panel-muted p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Fator de serviço</p>
            <ClipboardList size={18} className="text-accent-strong" />
          </div>
          <p className="mt-4 text-4xl font-bold">{activeAssessment.serviceLevelFactor.toFixed(2)}</p>
        </article>
        <article className="panel-muted p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Valor após IMR</p>
            <Wallet size={18} className="text-accent-strong" />
          </div>
          <p className="mt-4 text-2xl font-bold">{formatCurrencyBRL(activeAssessment.valueAfterImr)}</p>
        </article>
        <article className="panel-muted p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Valor final a faturar</p>
            <AlertTriangle size={18} className="text-accent-strong" />
          </div>
          <p className="mt-4 text-2xl font-bold text-accent-strong">{formatCurrencyBRL(activeAssessment.finalAmount)}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="panel p-6">
          <h3 className="text-xl font-bold">Indicadores</h3>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Indicador</th>
                  <th className="pb-3">Métrica apurada</th>
                  <th className="pb-3">Pontuação</th>
                  <th className="pb-3">Critério explícito</th>
                </tr>
              </thead>
              <tbody>
                {indicatorRows.map(({ definition, metricValue, score, notes }) => (
                  <tr key={definition.code} className="border-t border-line/70 align-top">
                    <td className="py-3 font-semibold">{definition.code}</td>
                    <td className="py-3">
                      <p className="font-semibold">{definition.title}</p>
                      <p className="mt-1 text-xs text-muted">{definition.reportMetric}</p>
                    </td>
                    <td className="py-3">{metricValue}</td>
                    <td className="py-3">{score.toFixed(2)}/{definition.maxPoints.toFixed(2)}</td>
                    <td className="py-3 text-xs text-muted">{notes}</td>
                  </tr>
                ))}
                <tr className="border-t border-line/70 font-semibold">
                  <td className="py-3">Total</td>
                  <td className="py-3" colSpan={2}></td>
                  <td className="py-3">{activeAssessment.totalScore.toFixed(2)}/100.00</td>
                  <td className="py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel p-6">
          <h3 className="text-xl font-bold">Pesquisa de qualidade</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="panel-muted p-4">
              <p className="text-sm text-muted">Ótimo</p>
              <p className="mt-2 text-3xl font-bold">{activeAssessment.qualityCounts.O}</p>
            </div>
            <div className="panel-muted p-4">
              <p className="text-sm text-muted">Bom</p>
              <p className="mt-2 text-3xl font-bold">{activeAssessment.qualityCounts.B}</p>
            </div>
            <div className="panel-muted p-4">
              <p className="text-sm text-muted">Regular</p>
              <p className="mt-2 text-3xl font-bold">{activeAssessment.qualityCounts.R}</p>
            </div>
            <div className="panel-muted p-4">
              <p className="text-sm text-muted">Insatisfatório</p>
              <p className="mt-2 text-3xl font-bold">{activeAssessment.qualityCounts.I}</p>
            </div>
            <div className="panel-muted p-4">
              <p className="text-sm text-muted">Não se aplica</p>
              <p className="mt-2 text-3xl font-bold">{activeAssessment.qualityCounts.N}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-muted">
            <p>Quesitos avaliados: <span className="font-semibold text-foreground">{qualityApplicableCount}</span></p>
            <p>Índice Ótimo: <span className="font-semibold text-foreground">{qualityIndexes.O.toFixed(2)}</span></p>
            <p>Índice Bom: <span className="font-semibold text-foreground">{qualityIndexes.B.toFixed(2)}</span></p>
            <p>Índice Regular: <span className="font-semibold text-foreground">{qualityIndexes.R.toFixed(2)}</span></p>
            <p>Índice Insatisfatório: <span className="font-semibold text-foreground">{qualityIndexes.I.toFixed(2)}</span></p>
            <p>Pontuação de qualidade: <span className="font-semibold text-foreground">{activeAssessment.qualityDisplayScore.toFixed(2)}/25.00</span></p>
          </div>
        </article>
      </section>

      <section className="panel p-6">
        <h3 className="text-xl font-bold">Métricas oficiais do IMR</h3>
        <p className="mt-2 text-sm text-muted">
          Cada indicador abaixo está ligado diretamente à planilha do IMR e mostra explicitamente a finalidade, a meta, o instrumento, a periodicidade e a faixa de pontuação usada no relatório.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {IMR_INDICATORS.map((indicator) => (
            <article key={indicator.code} className="panel-muted rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{indicator.code}</p>
                  <h4 className="mt-1 text-base font-bold">{indicator.title}</h4>
                </div>
                <span className="badge bg-accent-soft text-accent-strong">Até {indicator.maxPoints} pts</span>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <p><span className="font-semibold text-foreground">Finalidade:</span> {indicator.finalidade}</p>
                <p><span className="font-semibold text-foreground">Meta a cumprir:</span> {indicator.target}</p>
                <p><span className="font-semibold text-foreground">Instrumento de medição:</span> {indicator.measurementInstrument}</p>
                <p><span className="font-semibold text-foreground">Periodicidade:</span> {indicator.periodicity}</p>
                <p><span className="font-semibold text-foreground">Métrica no relatório:</span> {indicator.reportMetric}</p>
                <p><span className="font-semibold text-foreground">Faixa de pontuação:</span> {indicator.scoreBands.join(" | ")}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="panel p-6">
          <h3 className="text-xl font-bold">Apuração VT</h3>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted">Contrato com VT</span><span>{formatCurrencyBRL(activeAssessment.contractMonthlyWithVt)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Diferença mensal VT</span><span>{formatCurrencyBRL(activeAssessment.vtMonthlyDifference)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Diferença diária VT</span><span>{formatCurrencyBRL(activeAssessment.vtDailyDifference)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Dias sem VT</span><span>{activeAssessment.vtDaysNotPaid}</span></div>
            <div className="flex items-center justify-between font-semibold"><span>Desconto VT</span><span>{formatCurrencyBRL(activeAssessment.vtDiscountAmount)}</span></div>
          </div>
        </article>

        <article className="panel p-6">
          <h3 className="text-xl font-bold">Reembolso Creche</h3>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted">Diferença mensal</span><span>{formatCurrencyBRL(activeAssessment.crecheMonthlyDifference)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Valor pago</span><span>{formatCurrencyBRL(activeAssessment.crechePaidAmount)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Percentual adicional</span><span>{(activeAssessment.crecheAdditionalPercentage * 100).toFixed(2)}%</span></div>
            <div className="flex items-center justify-between font-semibold"><span>Desconto creche</span><span>{formatCurrencyBRL(activeAssessment.crecheDiscountAmount)}</span></div>
          </div>
        </article>

        <article className="panel p-6">
          <h3 className="text-xl font-bold">Fechamento Financeiro</h3>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted">Contrato sem VT</span><span>{formatCurrencyBRL(activeAssessment.contractMonthlyWithoutVt)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Base líquida p/ IMR</span><span>{formatCurrencyBRL(activeAssessment.contractMonthlyValue)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Glosa total de jornada</span><span>{formatCurrencyBRL(activeAssessment.journeyGlosaTotal)}</span></div>
            <div className="flex items-center justify-between font-semibold"><span>Desconto total estimado</span><span>{formatCurrencyBRL(activeAssessment.estimatedDiscount)}</span></div>
          </div>
        </article>
      </section>

      <section className="panel p-6">
        <div>
          <h3 className="text-xl font-bold">Relatório mensal de jornada por funcionária</h3>
          <p className="mt-1 text-sm text-muted">Resumo da glosa e conformidade mensal por funcionária.</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-3">Funcionária</th>
                <th className="pb-3">Dias úteis</th>
                <th className="pb-3">Dias com registro</th>
                <th className="pb-3">Completo</th>
                <th className="pb-3">Incompleto</th>
                <th className="pb-3">Min. trabalhados</th>
                <th className="pb-3">Min. faltantes</th>
                <th className="pb-3">Conformidade</th>
                <th className="pb-3">Glosa</th>
              </tr>
            </thead>
            <tbody>
              {activeAssessment.items.map((item) => (
                <tr key={item.employeeId} className="border-t border-line/70">
                  <td className="py-3 font-semibold">{item.employeeName}</td>
                  <td className="py-3">{item.expectedDays}</td>
                  <td className="py-3">{item.workedDays}</td>
                  <td className="py-3">{item.completeDays}</td>
                  <td className="py-3">{item.incompleteDays}</td>
                  <td className="py-3">{item.workedMinutes}</td>
                  <td className="py-3">{item.missingMinutes}</td>
                  <td className="py-3 font-semibold">{item.complianceScore.toFixed(2)}%</td>
                  <td className="py-3 text-red-700">{formatCurrencyBRL(item.journeyGlosaAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-6">
        <div>
          <h3 className="text-xl font-bold">Espelho diário de jornada</h3>
          <p className="mt-1 text-sm text-muted">Cada funcionária mostra as batidas do mês, horas apuradas e situação diária.</p>
        </div>
        <div className="mt-5 grid gap-5">
          {activeAssessment.items.map((item) => (
            <article key={item.employeeId} className="panel-muted p-5">
              <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="text-lg font-bold">{item.employeeName}</h4>
                  <p className="text-sm text-muted">
                    {item.workedDays} dia(s) com registro, {item.completeDays} completo(s), {item.incompleteDays} incompleto(s)
                  </p>
                </div>
                <div className="text-sm">
                  <p>Conformidade: <span className="font-semibold">{item.complianceScore.toFixed(2)}%</span></p>
                  <p>Glosa: <span className="font-semibold text-red-700">{formatCurrencyBRL(item.journeyGlosaAmount)}</span></p>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-muted">
                    <tr>
                      <th className="pb-3">Data</th>
                      <th className="pb-3">Entradas</th>
                      <th className="pb-3">Saídas</th>
                      <th className="pb-3">Horas trabalhadas</th>
                      <th className="pb-3">Saldo diário</th>
                      <th className="pb-3">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.days.length > 0 ? (
                      item.days.map((day) => (
                        <tr key={day.workDate} className="border-t border-line/70">
                          <td className="py-3 font-medium">{day.dateLabel}</td>
                          <td className="py-3">{day.entryTimes.join(", ") || "-"}</td>
                          <td className="py-3">{day.exitTimes.join(", ") || "-"}</td>
                          <td className="py-3">{day.workedHoursLabel}</td>
                          <td className="py-3">{day.missingHoursLabel}</td>
                          <td className="py-3">{day.statusLabel}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-line/70">
                        <td className="py-3 text-muted" colSpan={6}>Nenhuma batida registrada no período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
