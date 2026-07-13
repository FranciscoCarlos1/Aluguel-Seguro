import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { DEFAULT_MINUTES_PER_WORKDAY, JOURNEY_MISSING_TOLERANCE_MINUTES } from "@/lib/constants";
import { db } from "@/lib/db";
import { calculateWorkedMinutesForPunches, formatMinutesAsHours } from "@/lib/journey";
import { formatWorkDate, getCurrentMonthKey, parseIsoDateToUtcDate } from "@/lib/utils";
import { CsvImportForm } from "@/components/dashboard/csv-import-form";
import { PunchForm } from "@/components/dashboard/punch-form";
import { AbsenceMarkForm } from "@/components/dashboard/absence-mark-form";

type JornadasPageProps = {
  searchParams?: Promise<{
    employeeId?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

type PunchRecord = {
  workDate: Date;
  type: "ENTRY" | "EXIT";
  time: string;
};

type JourneyDay = {
  workDate: string;
  dateLabel: string;
  entryTimes: string[];
  exitTimes: string[];
  workedHoursLabel: string;
  missingHoursLabel: string;
  statusLabel: string;
  hasAbsence: boolean;
};

type SelectedEmployee = {
  id: string;
  name: string;
  punches: PunchRecord[];
  absences: Array<{ workDate: Date }>;
};

function buildJourneyDays(punches: PunchRecord[], absenceDates: Set<string>, startDate: Date, endDate: Date) {
  const punchesByDay = new Map<string, PunchRecord[]>();

  for (const punch of punches) {
    const key = punch.workDate.toISOString().slice(0, 10);
    const current = punchesByDay.get(key) ?? [];
    current.push(punch);
    punchesByDay.set(key, current);
  }

  const days: JourneyDay[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const workDate = currentDate.toISOString().slice(0, 10);
    const dayPunches = [...(punchesByDay.get(workDate) ?? [])].sort((left, right) => left.time.localeCompare(right.time));
    const entryTimes = dayPunches.filter((punch) => punch.type === "ENTRY").map((punch) => punch.time);
    const exitTimes = dayPunches.filter((punch) => punch.type === "EXIT").map((punch) => punch.time);
    const calculation = dayPunches.length > 0 ? calculateWorkedMinutesForPunches(dayPunches) : { workedMinutes: 0, incomplete: false };
    const consideredWorkedMinutes = Math.min(calculation.workedMinutes, DEFAULT_MINUTES_PER_WORKDAY);
    const rawMissingMinutes = dayPunches.length > 0 ? Math.max(DEFAULT_MINUTES_PER_WORKDAY - consideredWorkedMinutes, 0) : 0;
    const missingMinutes = rawMissingMinutes <= JOURNEY_MISSING_TOLERANCE_MINUTES ? 0 : rawMissingMinutes;
    const hasAbsence = absenceDates.has(workDate);

    const statusLabel = hasAbsence
      ? "Falta"
      : dayPunches.length > 0
      ? missingMinutes > 0 || calculation.incomplete
        ? "Incompleta"
        : "Completa"
      : "Sem registro";

    days.push({
      workDate,
      dateLabel: formatWorkDate(new Date(`${workDate}T00:00:00.000Z`)),
      entryTimes,
      exitTimes,
      workedHoursLabel: dayPunches.length > 0 ? formatMinutesAsHours(consideredWorkedMinutes) : "-",
      missingHoursLabel: dayPunches.length > 0 ? formatMinutesAsHours(missingMinutes) : "-",
      statusLabel,
      hasAbsence,
    });

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return days.sort((left, right) => right.workDate.localeCompare(left.workDate));
}

function isValidMonthKey(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function isValidIsoDate(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const startDate = `${monthKey}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = `${monthKey}-${String(lastDay).padStart(2, "0")}`;

  return { startDate, endDate };
}

export default async function JornadasPage({ searchParams }: JornadasPageProps) {
  await requireUser();

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedEmployeeId = typeof resolvedSearchParams.employeeId === "string" ? resolvedSearchParams.employeeId : undefined;
  const monthParam = typeof resolvedSearchParams.month === "string" ? resolvedSearchParams.month : undefined;
  const selectedMonthKey = isValidMonthKey(monthParam) ? monthParam : getCurrentMonthKey();
  const monthRange = getMonthRange(selectedMonthKey);
  const selectedStartDate = isValidIsoDate(resolvedSearchParams.startDate)
    ? resolvedSearchParams.startDate
    : monthRange.startDate;
  const selectedEndDate = isValidIsoDate(resolvedSearchParams.endDate)
    ? resolvedSearchParams.endDate
    : monthRange.endDate;
  const selectedStartUtcDate = parseIsoDateToUtcDate(selectedStartDate);
  const selectedEndUtcDate = parseIsoDateToUtcDate(selectedEndDate);

  const [employees, punches, selectedEmployee] = await Promise.all([
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
    selectedEmployeeId
      ? (db.employee.findFirst({
          where: { id: selectedEmployeeId, active: true },
          select: {
            id: true,
            name: true,
            punches: {
              where: {
                workDate: {
                  gte: selectedStartUtcDate,
                  lte: selectedEndUtcDate,
                },
              },
              orderBy: [{ workDate: "asc" }, { time: "asc" }],
              select: {
                workDate: true,
                type: true,
                time: true,
              },
            },
            absences: {
              where: {
                workDate: {
                  gte: selectedStartUtcDate,
                  lte: selectedEndUtcDate,
                },
              },
              orderBy: { workDate: "asc" },
              select: {
                workDate: true,
              },
            },
          },
        }) as Promise<SelectedEmployee | null>)
      : Promise.resolve(null),
  ]);

  const absenceDates = new Set(
    selectedEmployee?.absences.map((absence) => absence.workDate.toISOString().slice(0, 10)) ?? [],
  );

  const selectedEmployeeJourney = selectedEmployee
    ? buildJourneyDays(selectedEmployee.punches, absenceDates, selectedStartUtcDate, selectedEndUtcDate)
    : [];

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

      <section className="panel p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-xl font-bold">Consulta individual de jornada</h3>
            <p className="mt-1 text-sm text-muted">Selecione a funcionária e o período para ver as batidas diárias e lançar novas entradas e saídas.</p>
          </div>

          <form className="grid w-full gap-3 lg:grid-cols-2 xl:max-w-5xl xl:grid-cols-[minmax(0,2fr)_180px_170px_170px_auto] overflow-visible" method="get">
            <div className="grid gap-2 w-full">
              <label className="text-sm font-semibold" htmlFor="employeeId">
                Funcionária
              </label>
              <select
                className="field w-full"
                defaultValue={selectedEmployee?.id ?? ""}
                id="employeeId"
                name="employeeId"
                aria-label="Selecione a funcionária"
              >
                <option value="">- Selecione a funcionária -</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="month">
                Mês
              </label>
              <input className="field" defaultValue={selectedMonthKey} id="month" name="month" type="month" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="startDate">
                Início
              </label>
              <input className="field" defaultValue={selectedStartDate} id="startDate" name="startDate" type="date" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="endDate">
                Fim
              </label>
              <input className="field" defaultValue={selectedEndDate} id="endDate" name="endDate" type="date" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2 xl:col-span-1 xl:justify-end">
              <button className="secondary-button px-5 py-3" type="submit">Visualizar jornada</button>
              {selectedEmployee ? (
                <Link className="secondary-button px-5 py-3 text-center" href="/dashboard/jornadas">
                  Limpar filtro
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <PunchForm defaultEmployeeId={selectedEmployee?.id} employees={employees} />

      <CsvImportForm />

      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Jornada individual</h3>
            <p className="mt-1 text-sm text-muted">
              {selectedEmployee
                ? `Espelho diário de ${selectedEmployee.name} entre ${formatWorkDate(selectedStartUtcDate)} e ${formatWorkDate(selectedEndUtcDate)}.`
                : "Escolha uma funcionária na consulta acima para ver o espelho individual."}
            </p>
          </div>
          {selectedEmployee ? (
            <span className="badge bg-accent-soft text-accent-strong">{selectedEmployeeJourney.length} dia(s) com registro</span>
          ) : null}
        </div>

        {selectedEmployee ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Entradas</th>
                  <th className="pb-3">Saídas</th>
                  <th className="pb-3">Horas consideradas</th>
                  <th className="pb-3">Horas faltantes</th>
                  <th className="pb-3">Falta</th>
                  <th className="pb-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {selectedEmployeeJourney.length > 0 ? (
                  selectedEmployeeJourney.map((day) => (
                    <tr key={day.workDate} className="border-t border-line/70">
                      <td className="py-3 font-medium">{day.dateLabel}</td>
                      <td className="py-3">{day.entryTimes.join(", ") || "-"}</td>
                      <td className="py-3">{day.exitTimes.join(", ") || "-"}</td>
                      <td className="py-3">{day.workedHoursLabel}</td>
                      <td className="py-3">{day.missingHoursLabel}</td>
                      <td className="py-3">
                        {day.entryTimes.length === 0 ? (
                          <AbsenceMarkForm
                            employeeId={selectedEmployee!.id}
                            workDate={day.workDate}
                            isAbsent={day.hasAbsence}
                          />
                        ) : (
                          day.hasAbsence ? "Sim" : "-"
                        )}
                      </td>
                      <td className="py-3">{day.statusLabel}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-line/70">
                    <td className="py-3 text-muted" colSpan={6}>Nenhuma batida encontrada para a funcionária selecionada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            Use a consulta individual para abrir a jornada da funcionária e, em seguida, registrar manualmente entrada ou saída com ela já selecionada no formulário.
          </div>
        )}
      </section>

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
                  <td className="py-3 font-semibold">
                    <Link className="hover:underline" href={`/dashboard/jornadas?employeeId=${punch.employee.id}`}>
                      {punch.employee.name}
                    </Link>
                  </td>
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
