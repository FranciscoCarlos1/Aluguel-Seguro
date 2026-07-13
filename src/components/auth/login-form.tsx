'use client';

import { useActionState } from "react";

import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="panel flex flex-col gap-5 p-8 sm:p-10">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="email">
          E-mail
        </label>
        <input className="field" id="email" name="email" type="email" placeholder="admin@ifcfiscaliza.local" />
        {state?.errors?.email ? <p className="text-sm text-red-700">{state.errors.email[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="password">
          Senha
        </label>
        <input className="field" id="password" name="password" type="password" placeholder="Digite sua senha" />
        {state?.errors?.password ? (
          <p className="text-sm text-red-700">{state.errors.password[0]}</p>
        ) : null}
      </div>

      {state?.message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <button className="primary-button mt-2" disabled={pending} type="submit">
        {pending ? "Entrando..." : "Acessar sistema"}
      </button>
    </form>
  );
}
