'use client';

import { useActionState } from "react";
import { importContractCostWorkbookAction } from "@/actions/contract-costs";

export function CostWorkbookImportForm() {
  const [state, action, pending] = useActionState(importContractCostWorkbookAction, undefined);

  return (
    <form action={action} className="panel-muted grid gap-4 p-5">
      <div>
        <p className="font-semibold">Importar Planilha de Custos</p>
        <p className="mt-1 text-sm text-muted">
          Aceita a estrutura real do orçamento: RESUMO, Custos por posto, Cálculo custoM², MAT.UTEN, EQU, UNI.EPI, UTE e Locais.
          A importação fica armazenada e passa a ser a base do contrato.
        </p>
      </div>
      <input
        className="field file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        name="costWorkbook"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        required
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted">O sistema preserva as abas e os dados importados para auditoria.</span>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Processando planilha..." : "Importar custos"}
        </button>
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-accent-strong" : "text-red-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
