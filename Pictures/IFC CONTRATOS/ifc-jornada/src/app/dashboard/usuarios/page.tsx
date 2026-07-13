import { Role } from "@prisma/client";

import { toggleUserStatusAction } from "@/actions/users";
import { UserForm } from "@/components/dashboard/user-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function UsuariosPage() {
  const currentUser = await requireUser([Role.ADMIN]);
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <main className="flex flex-col gap-6">
      <section className="panel p-8">
        <span className="badge bg-accent-soft text-accent-strong">Governança de acesso</span>
        <h2 className="mt-4 text-3xl font-bold">Controle completo de usuários</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Crie contas, distribua perfis e bloqueie acessos conforme a separação de funções do contrato.
        </p>
      </section>

      <UserForm />

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Usuários cadastrados</h3>
            <p className="mt-1 text-sm text-muted">A conta logada não pode ser desativada pela própria sessão.</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-3">Nome</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">Perfil</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-line/70">
                  <td className="py-3 font-semibold">{user.name}</td>
                  <td className="py-3 text-muted">{user.email}</td>
                  <td className="py-3">{user.role}</td>
                  <td className="py-3">
                    <span className={`badge ${user.isActive ? "bg-accent-soft text-accent-strong" : "bg-red-100 text-red-700"}`}>
                      {user.isActive ? "Ativo" : "Bloqueado"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {user.id === currentUser.id ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Sessão atual</span>
                    ) : (
                      <form action={toggleUserStatusAction}>
                        <input name="userId" type="hidden" value={user.id} />
                        <button className="secondary-button px-4 py-2 text-xs" type="submit">
                          {user.isActive ? "Bloquear" : "Reativar"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
