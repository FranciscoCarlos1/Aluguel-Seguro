import Image from "next/image";
import Link from "next/link";
import { Role } from "@prisma/client";
import { AlertTriangle, ArrowRightLeft, Calculator, Fingerprint, FileBarChart2, FileText, Users, Wallet } from "lucide-react";
import { startOfMonth } from "date-fns";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCurrencyBRL, formatLongDate, formatMonthLabel, formatWorkDate } from "@/lib/utils";

export default async function DashboardPage() {
  await requireUser();
  const monthStart = startOfMonth(new Date());

  const [employeeCount, userCount, monthlyPunches, recentPunches, monthlyPunchList, latestAssessment] = await Promise.all([
    db.employee.count({ where: { active: true } }),
    db.user.count({ where: { isActive: true } }),
    db.timePunch.count({ where: { workDate: { gte: monthStart } } }),
    db.timePunch.findMany({ take: 8, orderBy: [{ workDate: "desc" }, { time: "desc" }], include: { employee: true, createdBy: { select: { name: true } } } }),
    db.timePunch.findMany({ where: { workDate: { gte: monthStart } }, include: { employee: true } }),
    db.monthlyAssessment.findFirst({ orderBy: { referenceDate: "desc" }, select: { monthKey: true, overallScore: true, estimatedDiscount: true, finalAmount: true, totalScore: true, valueAfterImr: true, journeyGlosaTotal: true } }),
  ]);

  const volumeByEmployee = Object.values(monthlyPunchList.reduce<Record<string, { name: string; total: number }>>((acc, punch) => {
    const current = acc[punch.employeeId] ?? { name: punch.employee.name, total: 0 };
    current.total += 1;
    acc[punch.employeeId] = current;
    return acc;
  }, {})).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <main className="flex flex-col gap-6">
      <section className="panel overflow-hidden p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Plataforma oficial</p>
            <h2 className="text-3xl font-bold sm:text-4xl">IFC FISCALIZA</h2>
            <span className="badge bg-accent-soft text-accent-strong">FISCALIZAÇÃO DE CONTRATO DE LIMPEZA</span>
            <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">Painel integrado de jornada, custos, IMR, glosas e medição mensal do contrato.</p>
            <div className="max-w-3xl overflow-hidden rounded-3xl border border-line bg-white/70 p-3"><Image src="/ifc-sbs-mark.svg" alt="Identidade IFC SBS" width={960} height={320} className="h-auto w-full rounded-2xl" priority /></div>
          </div>
          <div className="rounded-3xl border border-line bg-white/70 px-5 py-4 text-sm text-muted">Referência do painel: {formatLongDate(new Date())}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel-muted p-6"><div className="flex items-center justify-between"><p className="text-sm text-muted">Funcionárias ativas</p><Users size={18} className="text-accent-strong" /></div><p className="mt-4 text-4xl font-bold">{employeeCount}</p></article>
        <article className="panel-muted p-6"><div className="flex items-center justify-between"><p className="text-sm text-muted">Batidas no mês</p><ArrowRightLeft size={18} className="text-accent-strong" /></div><p className="mt-4 text-4xl font-bold">{monthlyPunches}</p></article>
        <article className="panel-muted p-6"><div className="flex items-center justify-between"><p className="text-sm text-muted">Usuários ativos</p><Fingerprint size={18} className="text-accent-strong" /></div><p className="mt-4 text-4xl font-bold">{userCount}</p></article>
        <article className="panel-muted p-6"><div className="flex items-center justify-between"><p className="text-sm text-muted">Último IMR</p><Calculator size={18} className="text-accent-strong" /></div>{latestAssessment ? <><p className="mt-4 text-3xl font-bold">{Number(latestAssessment.totalScore).toFixed(2)}/100</p><p className="mt-1 text-sm text-muted">{formatMonthLabel(latestAssessment.monthKey)}</p></> : <p className="mt-4 text-sm text-muted">Nenhuma avaliação gerada.</p>}</article>
      </section>

      {latestAssessment ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="panel p-6"><p className="text-sm text-muted">Valor após IMR</p><p className="mt-3 text-3xl font-bold">{formatCurrencyBRL(Number(latestAssessment.valueAfterImr))}</p></article>
          <article className="panel p-6"><p className="text-sm text-muted">Glosa de jornada</p><p className="mt-3 text-3xl font-bold">{formatCurrencyBRL(Number(latestAssessment.journeyGlosaTotal))}</p></article>
          <article className="panel p-6"><p className="text-sm text-muted">Desconto estimado</p><p className="mt-3 text-3xl font-bold text-red-700">{formatCurrencyBRL(Number(latestAssessment.estimatedDiscount))}</p></article>
          <article className="panel p-6"><p className="text-sm text-muted">Valor final</p><p className="mt-3 text-3xl font-bold text-accent-strong">{formatCurrencyBRL(Number(latestAssessment.finalAmount))}</p></article>
        </section>
      ) : null}

      <section className="panel p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-xl font-bold">Fluxo mensal integrado</h3><p className="mt-1 text-sm text-muted">Uma competência, uma sequência de apuração, um resultado auditável.</p></div><div className="flex flex-wrap gap-2"><Link href="/dashboard/avaliacoes" className="primary-button gap-2"><Calculator size={16} />Apurar IMR</Link><Link href="/dashboard/custos" className="secondary-button gap-2"><FileText size={16} />Ver custos</Link></div></div>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {["1. Jornada", "2. VT / Creche", "3. Indicadores", "4. IMR", "5. Valor final"].map((step, i) => <div key={step} className="panel-muted p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Etapa {i + 1}</p><p className="mt-2 font-semibold">{step.slice(3)}</p></div>)}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel p-6"><h3 className="text-xl font-bold">Últimos registros</h3><p className="mt-1 text-sm text-muted">Fluxo recente de horários lançados.</p><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-muted"><tr><th className="pb-3">Funcionária</th><th className="pb-3">Data</th><th className="pb-3">Tipo</th><th className="pb-3">Hora</th><th className="pb-3">Lançado por</th></tr></thead><tbody>{recentPunches.map((punch) => <tr key={punch.id} className="border-t border-line/70"><td className="py-3 font-semibold">{punch.employee.name}</td><td className="py-3">{formatWorkDate(punch.workDate)}</td><td className="py-3"><span className={`badge ${punch.type === "ENTRY" ? "bg-accent-soft text-accent-strong" : "bg-amber-100 text-amber-800"}`}>{punch.type === "ENTRY" ? "Entrada" : "Saída"}</span></td><td className="py-3 font-mono">{punch.time}</td><td className="py-3 text-muted">{punch.createdBy?.name ?? "Importação"}</td></tr>)}</tbody></table></div></article>
        <article className="panel p-6"><h3 className="text-xl font-bold">Volume por funcionária</h3><p className="mt-1 text-sm text-muted">Batidas registradas no mês corrente.</p><div className="mt-5 grid gap-3">{volumeByEmployee.map((item) => <div key={item.name} className="panel-muted flex items-center justify-between p-4"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted">Entradas e saídas</p></div><span className="text-2xl font-bold text-accent-strong">{item.total}</span></div>)}</div></article>
      </section>

      <section className="panel p-6"><h3 className="text-xl font-bold">Perfis de acesso</h3><div className="mt-4 grid gap-4 md:grid-cols-3">{[{ role: Role.ADMIN, description: "Gerencia usuários, acessos e visão completa." }, { role: Role.OPERATOR, description: "Opera lançamentos e cadastro operacional." }, { role: Role.AUDITOR, description: "Consulta registros e acompanha auditoria." }].map((item) => <div key={item.role} className="panel-muted p-5"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{item.role}</p><p className="mt-3 text-sm leading-7">{item.description}</p></div>)}</div></section>
    </main>
  );
}
