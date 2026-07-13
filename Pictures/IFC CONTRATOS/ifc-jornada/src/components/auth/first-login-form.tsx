'use client';

import { useActionState } from "react";

import { completeFirstLoginAction } from "@/actions/auth";

export function FirstLoginForm() {
  const [state, action, pending] = useActionState(completeFirstLoginAction, undefined);

  return (
    <form action={action} className="panel flex flex-col gap-5 p-8 sm:p-10">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="password">
          Nova senha
        </label>
        <input className="field" id="password" name="password" type="password" placeholder="Defina uma nova senha" />
        {state?.errors?.password ? <p className="text-sm text-red-700">{state.errors.password[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="confirmPassword">
          Confirmar nova senha
        </label>
        <input
          className="field"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repita a nova senha"
        />
        {state?.errors?.confirmPassword ? (
          <p className="text-sm text-red-700">{state.errors.confirmPassword[0]}</p>
        ) : null}
      </div>

      {state?.message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</div>
      ) : null}

      <button className="primary-button mt-2" disabled={pending} type="submit">
        {pending ? "Atualizando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}