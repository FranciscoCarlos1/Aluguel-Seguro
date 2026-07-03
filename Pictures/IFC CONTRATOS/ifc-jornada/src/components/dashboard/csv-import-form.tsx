'use client';

import { useActionState } from "react";

import { importPunchesFromCsvAction } from "@/actions/punches";

export function CsvImportForm() {
  const [state, action, pending] = useActionState(importPunchesFromCsvAction, undefined);

  return (
    <form action={action} className="panel-muted grid gap-4 p-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="csvFile">
          Importar CSV de controle de acesso
        </label>
        <input className="field file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" id="csvFile" name="csvFile" type="file" accept=".csv,text/csv" />
        <p className="text-sm text-muted">
          Envie o arquivo oficial com as colunas de entrada e saída. O importador evita duplicidades.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Use este fluxo para carregar em lote os horários de acesso da equipe.</p>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Importando..." : "Importar CSV"}
        </button>
      </div>

      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-accent-strong" : "text-red-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}