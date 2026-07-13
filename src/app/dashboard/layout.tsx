import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, Shield, UserCog } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { NavLink } from "@/components/dashboard/nav-link";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8 lg:py-6">
      <aside className="panel w-full p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:max-w-xs lg:p-6">
        <div className="flex h-full flex-col gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white">
                <Shield size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Sistema</p>
                <h1 className="text-xl font-bold">{APP_NAME}</h1>
              </div>
            </div>

            <div className="panel-muted flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
                <UserCog size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{user.role}</p>
              </div>
            </div>
          </div>

          <nav className="grid gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="mt-auto rounded-[24px] border border-line bg-[linear-gradient(135deg,rgba(15,118,110,0.10),rgba(245,158,11,0.12))] p-4">
            <p className="text-sm font-semibold">Segurança aplicada</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Sessões HTTP-only, trilha de auditoria e separação de perfis administrativos e operacionais.
            </p>
          </div>

          <Link className="secondary-button w-full justify-center" href="/login?force=1">
            Trocar usuário
          </Link>

          <form action={logoutAction}>
            <button className="secondary-button w-full gap-2" type="submit">
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1">{children}</div>
    </div>
  );
}
