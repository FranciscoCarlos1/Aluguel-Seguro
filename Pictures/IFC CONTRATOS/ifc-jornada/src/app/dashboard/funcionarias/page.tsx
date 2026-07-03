import Link from "next/link";
import { Role } from "@prisma/client";
import { startOfMonth } from "date-fns";

import { toggleEmployeeStatusAction } from "@/actions/employees";
import { EmployeeForm } from "@/components/dashboard/employee-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatWorkDate } from "@/lib/utils";

export default async function FuncionariasPage() {
  const currentUser = await requireUser([Role.ADMIN, Role.OPERATOR, Role.AUDITOR]);

  const monthStart = startOfMonth(new Date());

  const [employees, monthPunches] = await Promise.all([
    db.employee.findMany({
      orderBy: { name: "asc" },
      include: {
        punches: {
          take: 1,
          orderBy: [{ workDate: "desc" }, { time: "desc" }],
        },
      },
    }),
    db.timePunch.findMany({
      where: { workDate: { gte: monthStart } },
      select: { employeeId: true },
    }),
  ]);

  const totals = monthPunches.reduce<Record<string, number>>((acc, punch) => {
    acc[punch.employeeId] = (acc[punch.employeeId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="flex flex-col gap-6">
      <section className="panel p-8">
        <span className="badge bg-accent-soft text-accent-strong">Base operacional</span>
        <h2 className="mt-4 text-3xl font-bold">Cadastro e acompanhamento das funcionárias</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          As funcionárias do contrato já foram pré-cadastradas e podem ser expandidas conforme a operação.
        </p>
      </section>

      <EmployeeForm />

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Quadro atual</h3>
            <p className="mt-1 text-sm text-muted">Situação cadastral e última movimentação encontrada.</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-3">Funcionária</th>
                <th className="pb-3">Situação</th>
                <th className="pb-3">Batidas no mês</th>
                <th className="pb-3">Último registro</th>
                <th className="pb-3">Jornada</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-line/70">
                  <td className="py-3 font-semibold">{employee.name}</td>
                  <td className="py-3">
                    <span className={`badge ${employee.active ? "bg-accent-soft text-accent-strong" : "bg-red-100 text-red-700"}`}>
                      {employee.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="py-3">{totals[employee.id] ?? 0}</td>
                  <td className="py-3 text-muted">
                    {employee.punches[0]
                      ? `${formatWorkDate(employee.punches[0].workDate)} às ${employee.punches[0].time}`
                      : "Sem registros"}
                  </td>
                  <td className="py-3">
                    <Link className="secondary-button px-4 py-2 text-xs" href={`/dashboard/jornadas?employeeId=${employee.id}`}>
                      Ver jornada
                    </Link>
                  </td>
                  <td className="py-3 text-right">
                    {currentUser.role === Role.ADMIN ? (
                      <form action={toggleEmployeeStatusAction}>
                        <input name="employeeId" type="hidden" value={employee.id} />
                        <button className="secondary-button px-4 py-2 text-xs" type="submit">
                          {employee.active ? "Inativar" : "Reativar"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Somente admin</span>
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
