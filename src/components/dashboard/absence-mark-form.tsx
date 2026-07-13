"use client";

import { useRef } from "react";
import { useActionState } from "react";

import { toggleAbsenceAction } from "@/actions/punches";

type AbsenceMarkFormProps = {
  employeeId: string;
  workDate: string;
  isAbsent?: boolean;
};

export function AbsenceMarkForm({ employeeId, workDate, isAbsent = false }: AbsenceMarkFormProps) {
  const [state, action] = useActionState(toggleAbsenceAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-3">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="workDate" value={workDate} />
      <input type="hidden" name="action" value={isAbsent ? "remove" : "add"} />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
        <input
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
          type="checkbox"
          name="absence"
          checked={isAbsent}
          readOnly
          onChange={() => formRef.current?.requestSubmit()}
        />
        {isAbsent ? "Falta marcada" : "Marcar falta"}
      </label>

      <button type="submit" className="secondary-button px-3 py-2" disabled={state?.success === false && !state?.message}>
        {isAbsent ? "Desmarcar" : "Salvar"}
      </button>

      {state?.message ? (
        <span className={`text-xs ${state.success ? "text-accent-strong" : "text-red-700"}`}>{state.message}</span>
      ) : null}
    </form>
  );
}
