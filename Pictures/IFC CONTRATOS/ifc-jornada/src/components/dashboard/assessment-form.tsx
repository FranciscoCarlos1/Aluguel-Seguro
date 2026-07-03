'use client';

import { useActionState } from "react";

import { generateMonthlyAssessmentAction } from "@/actions/assessments";
import {
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
  DEFAULT_VT_MONTHLY_DIFFERENCE,
} from "@/lib/constants";

type AssessmentFormProps = {
  defaultMonthKey: string;
  isReadOnly?: boolean;
  defaults?: {
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
    qualityResponses?: Record<string, QualityRating>;
  };
};

const ratingOptions: Array<{ value: QualityRating; label: string }> = [
  { value: "O", label: "Ótimo" },
  { value: "B", label: "Bom" },
  { value: "R", label: "Regular" },
  { value: "I", label: "Insatisfatório" },
  { value: "N", label: "Não se aplica" },
];

export function AssessmentForm({ defaultMonthKey, defaults, isReadOnly = false }: AssessmentFormProps) {
  const [state, action, pending] = useActionState(generateMonthlyAssessmentAction, undefined);

  return (
    <form action={action} className="panel grid gap-6 p-6">
      {isReadOnly ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Somente administradores podem alterar ou regerar avaliações. Seu perfil possui acesso apenas para consulta.
        </div>
      ) : null}

      <fieldset disabled={isReadOnly || pending} className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="monthKey">
            Mês de referência
          </label>
          <input className="field" id="monthKey" name="monthKey" type="month" defaultValue={defaultMonthKey} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="contractMonthlyWithVt">
            Valor mensal com VT
          </label>
          <input className="field" id="contractMonthlyWithVt" name="contractMonthlyWithVt" type="number" min="0" step="0.01" defaultValue={defaults?.contractMonthlyWithVt ?? DEFAULT_CONTRACT_MONTHLY_VALUE} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="expectedBusinessDays">
            Dias úteis de referência
          </label>
          <input className="field" id="expectedBusinessDays" name="expectedBusinessDays" type="number" min="1" step="1" defaultValue={defaults?.expectedBusinessDays ?? DEFAULT_EXPECTED_BUSINESS_DAYS} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="contractPosts">
            Postos considerados
          </label>
          <input className="field" id="contractPosts" name="contractPosts" type="number" min="1" step="1" defaultValue={defaults?.contractPosts ?? DEFAULT_CONTRACT_POSTS} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel-muted grid gap-4 p-5">
          <h3 className="text-base font-bold">Apuração VT</h3>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="vtMonthlyDifference">Diferença VT mensal</label>
            <input className="field" id="vtMonthlyDifference" name="vtMonthlyDifference" type="number" min="0" step="0.01" defaultValue={defaults?.vtMonthlyDifference ?? DEFAULT_VT_MONTHLY_DIFFERENCE} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="vtDaysNotPaid">Dias proporcionais sem VT</label>
            <input className="field" id="vtDaysNotPaid" name="vtDaysNotPaid" type="number" min="0" step="1" defaultValue={defaults?.vtDaysNotPaid ?? 0} />
          </div>
        </div>

        <div className="panel-muted grid gap-4 p-5">
          <h3 className="text-base font-bold">Reembolso Creche</h3>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="crecheMonthlyDifference">Diferença mensal creche</label>
            <input className="field" id="crecheMonthlyDifference" name="crecheMonthlyDifference" type="number" min="0" step="0.01" defaultValue={defaults?.crecheMonthlyDifference ?? DEFAULT_CRECHE_MONTHLY_DIFFERENCE} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="crechePaidAmount">Valor comprovado pago</label>
            <input className="field" id="crechePaidAmount" name="crechePaidAmount" type="number" min="0" step="0.01" defaultValue={defaults?.crechePaidAmount ?? 0} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="crecheAdditionalPercentage">Percentual adicional</label>
            <input className="field" id="crecheAdditionalPercentage" name="crecheAdditionalPercentage" type="number" min="0" step="0.0001" defaultValue={defaults?.crecheAdditionalPercentage ?? DEFAULT_CRECHE_ADDITIONAL_PERCENTAGE} />
          </div>
        </div>

        <div className="panel-muted grid gap-4 p-5">
          <h3 className="text-base font-bold">Glosa de Jornada</h3>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="postMonthlyValue">Valor posto de trabalho</label>
            <input className="field" id="postMonthlyValue" name="postMonthlyValue" type="number" min="0" step="0.01" defaultValue={defaults?.postMonthlyValue ?? DEFAULT_POST_MONTHLY_VALUE} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="minutesPerWorkDay">Minutos por dia</label>
            <input className="field" id="minutesPerWorkDay" name="minutesPerWorkDay" type="number" min="1" step="1" defaultValue={defaults?.minutesPerWorkDay ?? DEFAULT_MINUTES_PER_WORKDAY} />
          </div>
        </div>
      </section>

      <section className="panel-muted grid gap-4 p-5 xl:grid-cols-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="indicator1Occurrences">Indicador 1: ocorrências de EPI/uniforme</label>
          <input className="field" id="indicator1Occurrences" name="indicator1Occurrences" type="number" min="0" step="1" defaultValue={defaults?.indicator1Occurrences ?? 0} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="indicator2Occurrences">Indicador 2: respostas tardias ou dias de atraso</label>
          <input className="field" id="indicator2Occurrences" name="indicator2Occurrences" type="number" min="0" step="1" defaultValue={defaults?.indicator2Occurrences ?? 0} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="indicator3Occurrences">Indicador 3: atrasos salariais e benefícios</label>
          <input className="field" id="indicator3Occurrences" name="indicator3Occurrences" type="number" min="0" step="1" defaultValue={defaults?.indicator3Occurrences ?? 0} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="indicator4Occurrences">Indicador 4: faltas de materiais previstos</label>
          <input className="field" id="indicator4Occurrences" name="indicator4Occurrences" type="number" min="0" step="1" defaultValue={defaults?.indicator4Occurrences ?? 0} />
        </div>
        <div className="rounded-3xl border border-line bg-white/70 p-4">
          <p className="text-sm font-semibold text-foreground">Indicador 5: qualidade dos serviços prestados</p>
          <p className="mt-2 text-sm text-muted">
            Calculado automaticamente pela pesquisa de qualidade logo abaixo, com base nos quesitos aplicáveis.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
            Métrica explícita: média aritmética das avaliações válidas
          </p>
        </div>
      </section>

      <section className="panel-muted grid gap-4 p-5">
        <div>
          <h3 className="text-base font-bold">Pesquisa de Qualidade dos Serviços</h3>
          <p className="mt-1 text-sm text-muted">Selecione O, B, R, I ou N para cada quesito da planilha de avaliação.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {QUALITY_QUESTIONS.map((question) => (
            <div key={question.key} className="rounded-3xl border border-line bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{question.section}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{question.label}</p>
              <select className="field mt-3" name={question.key} defaultValue={defaults?.qualityResponses?.[question.key] ?? "N"}>
                {ratingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">O relatório gerado considera IMR oficial, apuração VT, reembolso creche e glosa de jornada.</p>
        <button className="primary-button" disabled={isReadOnly || pending} type="submit">
          {pending ? "Processando..." : "Gerar avaliação oficial"}
        </button>
      </div>
      </fieldset>

      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-accent-strong" : "text-red-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
