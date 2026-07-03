import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    force?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const forceLogin = resolvedSearchParams.force === "1";

  if (user && !forceLogin) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-6xl space-y-6">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="panel flex flex-col justify-between gap-10 overflow-hidden p-8 sm:p-10 lg:p-14">
          <div className="flex items-center gap-3 text-accent-strong">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Plataforma oficial</p>
              <h1 className="text-2xl font-bold sm:text-3xl">{APP_NAME}</h1>
            </div>
          </div>

          <div className="space-y-6">
            <span className="badge bg-accent-soft text-accent-strong">FISCALIZAÇÃO DE CONTRATO DE LIMPEZA</span>
            <div>
              <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
                Controle de Avaliação de Contrato de Serviço
              </h2>
            </div>
            <div className="max-w-xl overflow-hidden rounded-3xl border border-line bg-white/70 p-2 sm:p-3">
              <Image
                src="/ifc-sbs-mark.svg"
                alt="Identidade IFC SBS"
                width={720}
                height={240}
                className="h-auto w-full rounded-2xl"
                priority
              />
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full space-y-4">
            <div className="px-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Acesso protegido</p>
              <h2 className="mt-2 text-2xl font-bold">Entrar no sistema</h2>
              <p className="mt-2 text-sm text-muted">Use o usuário administrador semeado para iniciar a operação.</p>
              {user ? (
                <div className="mt-4 rounded-2xl border border-line bg-white/80 p-4 text-sm text-muted">
                  <p className="font-semibold text-foreground">Sessão atual: {user.name}</p>
                  <p className="mt-1">Você abriu o login em modo de troca de usuário.</p>
                  <Link href="/dashboard" className="mt-3 inline-flex text-sm font-semibold text-accent-strong">
                    Voltar ao painel
                  </Link>
                </div>
              ) : null}
            </div>
            <LoginForm />
          </div>
        </section>
        </div>

        <p className="text-center text-sm text-muted">
          Sistema desenvolvido na CTI do IFC Campus São Bento do Sul.
        </p>
      </div>
    </main>
  );
}
