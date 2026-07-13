'use client';

import { useActionState } from "react";

import { createEmployeeAction } from "@/actions/employees";

export function EmployeeForm() {
  const [state, action, pending] = useActionState(createEmployeeAction, undefined);

  return (
    <form action={action} className="panel-muted flex flex-col gap-4 p-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="employee-name">
          Nome da funcionária
        </label>
        <input className="field" id="employee-name" name="name" placeholder="Ex.: Maria da Silva" />
        {state?.errors?.name ? <p className="text-sm text-red-700">{state.errors.name[0]}</p> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">O cadastro de funcionárias alimenta o registro de entrada e saída.</p>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Salvando..." : "Cadastrar funcionária"}
        </button>
      </div>

      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-accent-strong" : "text-red-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
