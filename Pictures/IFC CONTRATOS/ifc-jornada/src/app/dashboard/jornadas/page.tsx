import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatWorkDate } from "@/lib/utils";
import { CsvImportForm } from "@/components/dashboard/csv-import-form";
import { PunchForm } from "@/components/dashboard/punch-form";

export default async function JornadasPage() {
  await requireUser();

  const [employees, punches] = await Promise.all([
    db.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.timePunch.findMany({
      take: 60,
      orderBy: [{ workDate: "desc" }, { time: "desc" }],
      include: {
        employee: true,
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <section className="panel p-8">
        <span className="badge bg-accent-soft text-accent-strong">Jornadas</span>
        <h2 className="mt-4 text-3xl font-bold">Registro operacional de entrada e saída</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Cadastre somente os horários de entrada e saída. O sistema preserva cada batida como evento individual,
          permitindo múltiplos registros na mesma data quando a operação exigir.
        </p>
      </section>

      <PunchForm employees={employees} />

  <CsvImportForm />

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Histórico recente</h3>
            <p className="mt-1 text-sm text-muted">Últimos 60 registros lançados ou importados.</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-3">Funcionária</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Tipo</th>
                <th className="pb-3">Hora</th>
                <th className="pb-3">Origem</th>
                <th className="pb-3">Lançado por</th>
              </tr>
            </thead>
            <tbody>
              {punches.map((punch) => (
                <tr key={punch.id} className="border-t border-line/70">
                  <td className="py-3 font-semibold">{punch.employee.name}</td>
                  <td className="py-3">{formatWorkDate(punch.workDate)}</td>
                  <td className="py-3">{punch.type === "ENTRY" ? "Entrada" : "Saída"}</td>
                  <td className="py-3 font-mono">{punch.time}</td>
                  <td className="py-3">{punch.source === "IMPORT" ? "Importação" : "Manual"}</td>
                  <td className="py-3 text-muted">{punch.createdBy?.name ?? "Sistema"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
