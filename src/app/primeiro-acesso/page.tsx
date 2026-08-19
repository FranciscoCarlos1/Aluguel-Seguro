import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { FirstLoginForm } from "@/components/auth/first-login-form";
import { requireUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";

export default async function PrimeiroAcessoPage() {
  const user = await requireUser(undefined, { allowForcedPasswordChange: true });

  if (!user.forcePasswordChange) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="panel flex flex-col justify-between gap-8 p-8 sm:p-10 lg:p-14">
          <div className="flex items-center gap-3 text-accent-strong">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Primeiro acesso</p>
              <h1 className="text-2xl font-bold sm:text-3xl">{APP_NAME}</h1>
            </div>
          </div>

          <div className="space-y-5">
            <span className="badge bg-accent-soft text-accent-strong">TROCA OBRIGATÓRIA DE SENHA</span>
            <div>
              <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Defina sua senha pessoal antes de continuar</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                Sua conta foi criada com senha inicial. Para liberar o acesso ao painel, substitua essa senha agora.
              </p>
            </div>
          </div>

          <div className="panel-muted rounded-3xl p-4 text-sm text-muted">
            Depois da alteração, o sistema libera automaticamente as áreas de jornadas, avaliações e usuários conforme o seu perfil.
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full space-y-4">
            <div className="px-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Conta autenticada</p>
              <h2 className="mt-2 text-2xl font-bold">{user.name}</h2>
              <p className="mt-2 text-sm text-muted">Digite uma nova senha forte para concluir o primeiro acesso.</p>
            </div>
            <FirstLoginForm />
          </div>
        </section>
      </div>
      <p className="text-center text-sm text-muted">
          Sistema desenvolvido por Francisco Carlos na CTI do IFC Campus São Bento do Sul.
        </p>
    </main>
  );
}