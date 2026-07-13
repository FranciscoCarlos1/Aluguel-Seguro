'use client';

import { PunchType } from "@prisma/client";
import { useActionState } from "react";

import { createPunchAction } from "@/actions/punches";

type PunchFormProps = {
  employees: Array<{
    id: string;
    name: string;
  }>;
  defaultEmployeeId?: string;
};

export function PunchForm({ employees, defaultEmployeeId }: PunchFormProps) {
  const [state, action, pending] = useActionState(createPunchAction, undefined);

  return (
    <form action={action} className="panel grid gap-4 p-6 xl:grid-cols-2">
      <div className="space-y-2 xl:col-span-2">
        <label className="text-sm font-semibold" htmlFor="employeeId">
          Funcionária
        </label>
        <select className="field" defaultValue={defaultEmployeeId ?? ""} id="employeeId" name="employeeId">
          <option value="" disabled>
            Selecione a funcionária
          </option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
        {state?.errors?.employeeId ? <p className="text-sm text-red-700">{state.errors.employeeId[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="workDate">
          Data
        </label>
        <input className="field" id="workDate" name="workDate" type="date" />
        {state?.errors?.workDate ? <p className="text-sm text-red-700">{state.errors.workDate[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="time">
          Horário
        </label>
        <input className="field" id="time" name="time" type="time" />
        {state?.errors?.time ? <p className="text-sm text-red-700">{state.errors.time[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="type">
          Tipo
        </label>
        <select className="field" defaultValue={PunchType.ENTRY} id="type" name="type">
          <option value={PunchType.ENTRY}>Entrada</option>
          <option value={PunchType.EXIT}>Saída</option>
        </select>
        {state?.errors?.type ? <p className="text-sm text-red-700">{state.errors.type[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="notes">
          Observação
        </label>
        <input className="field" id="notes" name="notes" placeholder="Opcional" />
        {state?.errors?.notes ? <p className="text-sm text-red-700">{state.errors.notes[0]}</p> : null}
      </div>

      <div className="xl:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">O sistema considera apenas batidas de entrada e saída, sem cálculo contratual adicional.</p>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Registrando..." : "Registrar horário"}
        </button>
      </div>

      {state?.message ? (
        <p className={`xl:col-span-2 text-sm ${state.success ? "text-accent-strong" : "text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
