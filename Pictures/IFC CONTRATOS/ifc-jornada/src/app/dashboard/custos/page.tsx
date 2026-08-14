import { requireUser } from "@/lib/auth";
import { CONTRACT_COST_SNAPSHOT as c, formatCostNumber } from "@/lib/contract-costs";

const money = (value: number) => `R$ ${formatCostNumber(value)}`;

export default async function CustosPage() {
  await requireUser();

  const modules = [
    ["Mão de obra / posto", c.laborBase],
    ["Módulo 2", c.module2],
    ["Módulo 3", c.module3],
    ["Módulo 4", c.module4],
    ["Módulo 5", c.module5],
    ["Módulo 6", c.module6],
  ] as const;

  const supplies = [
    ["Materiais de limpeza/uso", c.materialsAnnual, c.materialsPerEmployeeMonthly],
    ["Equipamentos", c.equipmentMonthly * 12, c.equipmentPerEmployeeMonthly],
    ["Uniformes", c.uniformsAnnual, c.uniformsMonthly],
    ["EPIs", c.epiAnnual, c.epiMonthly],
    ["Utensílios", c.utensilsAnnual, c.utensilsMonthly],
  ] as const;

  return (
    <main className="flex flex-col gap-6">
      <section className="panel p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Planilhas integradas</p>
        <h1 className="mt-3 text-3xl font-bold">Custos do Contrato</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
          Os valores desta tela são derivados da lógica das planilhas fornecidas, organizadas em custos por posto,
          custo por m², materiais, equipamentos, uniformes/EPI, utensílios e locais. A mesma base alimenta a apuração mensal.
        </p>
        <div className="mt-6 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div className="panel-muted p-4"><span className="text-muted">Contrato</span><strong className="mt-1 block">{c.contractCode}</strong></div>
          <div className="panel-muted p-4"><span className="text-muted">Contratada</span><strong className="mt-1 block">{c.contractor}</strong></div>
          <div className="panel-muted p-4"><span className="text-muted">Postos</span><strong className="mt-1 block">{c.calculatedEmployees}</strong></div>
          <div className="panel-muted p-4"><span className="text-muted">Execução</span><strong className="mt-1 block">{c.executionMonths} meses</strong></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel-muted p-6"><p className="text-sm text-muted">Valor mensal da planilha</p><p className="mt-3 text-3xl font-bold">{money(c.monthlyProposed)}</p></article>
        <article className="panel-muted p-6"><p className="text-sm text-muted">Valor por posto</p><p className="mt-3 text-3xl font-bold">{money(c.costPerEmployee)}</p></article>
        <article className="panel-muted p-6"><p className="text-sm text-muted">Área total</p><p className="mt-3 text-3xl font-bold">{formatCostNumber(c.locationsArea)} m²</p></article>
        <article className="panel-muted p-6"><p className="text-sm text-muted">Área média diária</p><p className="mt-3 text-3xl font-bold">{formatCostNumber(c.locationsDailyArea)} m²</p></article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Composição do custo por posto</h2>
          <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-muted"><tr><th className="pb-3">Componente</th><th className="pb-3 text-right">Valor</th></tr></thead><tbody>{modules.map(([label, value]) => <tr key={label} className="border-t border-line/70"><td className="py-3">{label}</td><td className="py-3 text-right font-semibold">{money(value)}</td></tr>)}</tbody></table></div>
        </article>
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Insumos e infraestrutura</h2>
          <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-muted"><tr><th className="pb-3">Grupo</th><th className="pb-3 text-right">Anual</th><th className="pb-3 text-right">Por funcionário/mês</th></tr></thead><tbody>{supplies.map(([label, annual, perEmployee]) => <tr key={label} className="border-t border-line/70"><td className="py-3">{label}</td><td className="py-3 text-right">{money(annual)}</td><td className="py-3 text-right font-semibold">{money(perEmployee)}</td></tr>)}</tbody></table></div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Locais e produtividade</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="panel-muted p-5"><p className="text-sm text-muted">Metragem consolidada</p><p className="mt-2 text-2xl font-bold">{formatCostNumber(c.locationsArea)} m²</p></div><div className="panel-muted p-5"><p className="text-sm text-muted">Média diária</p><p className="mt-2 text-2xl font-bold">{formatCostNumber(c.locationsDailyArea)} m²</p></div></div>
          <p className="mt-4 text-sm leading-7 text-muted">A aba Locais aplica a frequência de limpeza sobre a metragem dos ambientes e consolida a área diária utilizada na composição do custo por m².</p>
        </article>
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Origem dos dados</h2>
          <p className="mt-2 text-sm text-muted">A base foi estruturada a partir das abas:</p>
          <div className="mt-4 flex flex-wrap gap-2">{c.sourceSheets.map((sheet) => <span key={sheet} className="badge bg-accent-soft text-accent-strong">{sheet}</span>)}</div>
        </article>
      </section>
    </main>
  );
}
