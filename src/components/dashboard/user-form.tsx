'use client';

import { Role } from "@prisma/client";
import { useActionState } from "react";

import { createUserAction } from "@/actions/users";

const roles = [
  { value: Role.ADMIN, label: "Administrador" },
  { value: Role.OPERATOR, label: "Operação" },
  { value: Role.AUDITOR, label: "Auditoria" },
];

export function UserForm() {
  const [state, action, pending] = useActionState(createUserAction, undefined);

  return (
    <form action={action} className="panel-muted grid gap-4 p-6 lg:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="name">
          Nome
        </label>
        <input className="field" id="name" name="name" placeholder="Nome do usuário" />
        {state?.errors?.name ? <p className="text-sm text-red-700">{state.errors.name[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="email">
          E-mail
        </label>
        <input className="field" id="email" name="email" type="email" placeholder="usuario@ifc.local" />
        {state?.errors?.email ? <p className="text-sm text-red-700">{state.errors.email[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="password">
          Senha inicial
        </label>
        <input className="field" id="password" name="password" type="password" placeholder="Senha forte" />
        {state?.errors?.password ? <p className="text-sm text-red-700">{state.errors.password[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="role">
          Perfil
        </label>
        <select className="field" defaultValue={Role.OPERATOR} id="role" name="role">
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        {state?.errors?.role ? <p className="text-sm text-red-700">{state.errors.role[0]}</p> : null}
      </div>

      <label className="panel-muted lg:col-span-2 flex items-start gap-3 p-4">
        <input className="mt-1 h-4 w-4" id="forcePasswordChange" name="forcePasswordChange" type="checkbox" />
        <span className="space-y-1">
          <span className="block text-sm font-semibold text-foreground">Exigir troca de senha no primeiro login</span>
          <span className="block text-sm text-muted">
            O usuário entra com a senha inicial e é direcionado imediatamente para definir uma nova senha.
          </span>
        </span>
      </label>

      <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Perfis administram acessos, operação registra horários e auditoria visualiza.</p>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Salvando..." : "Criar usuário"}
        </button>
      </div>

      {state?.message ? (
        <p className={`lg:col-span-2 text-sm ${state.success ? "text-accent-strong" : "text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
