import { requireUser } from "@/lib/auth";
import { formatCostNumber } from "@/lib/contract-costs";
import { db } from "@/lib/db";
import { CostWorkbookImportForm } from "@/components/dashboard/cost-workbook-import-form";

const money = (value: number) => `R$ ${formatCostNumber(value)}`;

const EMPTY_COST = {
  contractCode: "—",
  procurement: "—",
  process: "—",
  municipality: "—",
  contractor: "—",
  cnpj: "",
  calculatedEmployees: 0,
  executionMonths: 0,
  monthlyProposed: 0,
  annualProposed: 0,
  thirtyMonthProposed: 0,
  costPerEmployee: 0,
  costPerEmployeeAlt: 0,
  locationsArea: 0,
  locationsDailyArea: 0,
  laborBase: 0,
  module2: 0,
  module3: 0,
  module4: 0,
  module5: 0,
  module6: 0,
  materialsAnnual: 0,
  materialsMonthly: 0,
  equipmentMonthly: 0,
  equipmentPerEmployeeMonthly: 0,
  uniformsAnnual: 0,
  uniformsMonthly: 0,
  epiAnnual: 0,
  epiMonthly: 0,
  utensilsAnnual: 0,
  utensilsMonthly: 0,
  sourceSheets: [] as string[],
  importedFileName: "Nenhuma planilha importada",
  importedAt: null as Date | null,
};

export default async function CustosPage() {
  await requireUser();

  const latest = await db.contractCostSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const c = latest
    ? {
        contractCode: latest.contractCode,
        procurement: latest.procurement,
        process: latest.process,
        municipality: latest.municipality,
        contractor: latest.contractor,
        cnpj: latest.cnpj,
        calculatedEmployees: latest.calculatedEmployees,
        executionMonths: latest.executionMonths,
        monthlyProposed: Number(latest.monthlyProposed),
        annualProposed: Number(latest.annualProposed),
        thirtyMonthProposed: Number(latest.thirtyMonthProposed),
        costPerEmployee: Number(latest.costPerEmployee),
        costPerEmployeeAlt: Number(latest.costPerEmployeeAlt),
        locationsArea: Number(latest.locationsArea),
        locationsDailyArea: Number(latest.locationsDailyArea),
        laborBase: Number(latest.laborBase),
        module2: Number(latest.module2),
        module3: Number(latest.module3),
        module4: Number(latest.module4),
        module5: Number(latest.module5),
        module6: Number(latest.module6),
        materialsAnnual: Number(latest.materialsAnnual),
        materialsMonthly: Number(latest.materialsMonthly),
        equipmentMonthly: Number(latest.equipmentMonthly),
        equipmentPerEmployeeMonthly: Number(latest.equipmentPerEmployeeMonthly),
        uniformsAnnual: Number(latest.uniformsAnnual),
        uniformsMonthly: Number(latest.uniformsMonthly),
        epiAnnual: Number(latest.epiAnnual),
        epiMonthly: Number(latest.epiMonthly),
        utensilsAnnual: Number(latest.utensilsAnnual),
        utensilsMonthly: Number(latest.utensilsMonthly),
        sourceSheets: Array.isArray(latest.sourceSheets) ? latest.sourceSheets.map(String) : [],
        importedFileName: latest.importedFileName,
        importedAt: latest.createdAt,
      }
    : EMPTY_COST;

  const modules = [
    ["Mão de obra / Módulo 1", c.laborBase],
    ["Módulo 2 — Encargos e benefícios", c.module2],
    ["Módulo 3 — Provisão para rescisão", c.module3],
    ["Módulo 4 — Reposição de ausências", c.module4],
    ["Módulo 5 — Insumos diversos", c.module5],
    ["Módulo 6 — Indiretos, tributos e lucro", c.module6],
  ] as const;

  const supplies = [
    ["Materiais", c.materialsAnnual, c.materialsMonthly],
    ["Equipamentos", c.equipmentMonthly * 12, c.equipmentMonthly],
    ["Uniformes", c.uniformsAnnual, c.uniformsMonthly],
    ["EPIs", c.epiAnnual, c.epiMonthly],
    ["Utensílios", c.utensilsAnnual, c.utensilsMonthly],
  ] as const;

  return (
    <main className="flex flex-col gap-6">
      <section className="panel p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Base contratual integrada</p>
            <h1 className="mt-3 text-3xl font-bold">Custos do Contrato</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
              Os valores desta tela vêm exclusivamente da última planilha de custos importada. O sistema não cria, completa ou substitui valores automaticamente.
            </p>
          </div>
          <div className="badge bg-accent-soft text-accent-strong">
            {latest ? "Planilha importada do sistema" : "Aguardando importação"}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="panel-muted p-4"><span className="text-muted">Licitação</span><strong className="mt-1 block">{c.procurement}</strong></div>
          <div className="panel-muted p-4"><span className="text-muted">Processo</span><strong className="mt-1 block">{c.process}</strong></div>
          <div className="panel-muted p-4"><span className="text-muted">Contratada</span><strong className="mt-1 block">{c.contractor}</strong></div>
          <div className="panel-muted p-4"><span className="text-muted">CNPJ</span><strong className="mt-1 block">{c.cnpj || "—"}</strong></div>
          <div className="panel-muted p-4"><span className="text-muted">Postos</span><strong className="mt-1 block">{c.calculatedEmployees}</strong></div>
        </div>
      </section>

      <CostWorkbookImportForm />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="panel-muted p-6"><p className="text-sm text-muted">Valor mensal da proposta</p><p className="mt-3 text-3xl font-bold">{money(c.monthlyProposed)}</p></article>
        <article className="panel-muted p-6"><p className="text-sm text-muted">Valor anual</p><p className="mt-3 text-3xl font-bold">{money(c.annualProposed)}</p></article>
        <article className="panel-muted p-6"><p className="text-sm text-muted">Valor por posto</p><p className="mt-3 text-3xl font-bold">{money(c.costPerEmployee)}</p></article>
        <article className="panel-muted p-6"><p className="text-sm text-muted">Área total</p><p className="mt-3 text-3xl font-bold">{formatCostNumber(c.locationsArea)} m²</p></article>
        <article className="panel-muted p-6"><p className="text-sm text-muted">Área média diária</p><p className="mt-3 text-3xl font-bold">{formatCostNumber(c.locationsDailyArea)} m²</p></article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Composição do custo por posto</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted"><tr><th className="pb-3">Componente</th><th className="pb-3 text-right">Valor</th></tr></thead>
              <tbody>{modules.map(([label, value]) => <tr key={label} className="border-t border-line/70"><td className="py-3">{label}</td><td className="py-3 text-right font-semibold">{money(value)}</td></tr>)}</tbody>
            </table>
          </div>
        </article>

        <article className="panel p-6">
          <h2 className="text-xl font-bold">Insumos e infraestrutura</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted"><tr><th className="pb-3">Grupo</th><th className="pb-3 text-right">Anual</th><th className="pb-3 text-right">Mensal</th></tr></thead>
              <tbody>{supplies.map(([label, annual, monthly]) => <tr key={label} className="border-t border-line/70"><td className="py-3">{label}</td><td className="py-3 text-right">{money(annual)}</td><td className="py-3 text-right font-semibold">{money(monthly)}</td></tr>)}</tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Integração com a medição</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="panel-muted p-4"><p className="text-sm text-muted">Valor-base mensal</p><p className="mt-2 text-2xl font-bold">{money(c.monthlyProposed)}</p></div>
            <div className="panel-muted p-4"><p className="text-sm text-muted">Valor-base 30 meses</p><p className="mt-2 text-2xl font-bold">{money(c.thirtyMonthProposed)}</p></div>
            <div className="panel-muted p-4"><p className="text-sm text-muted">Custo por posto — cenário A</p><p className="mt-2 text-xl font-bold">{money(c.costPerEmployee)}</p></div>
            <div className="panel-muted p-4"><p className="text-sm text-muted">Custo por posto — cenário B</p><p className="mt-2 text-xl font-bold">{money(c.costPerEmployeeAlt)}</p></div>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">Ao gerar uma avaliação mensal, o sistema pode usar o valor mensal da última planilha importada como valor contratual de referência. A jornada gera a glosa e o IMR aplica o fator de nível de serviço antes do valor final.</p>
        </article>

        <article className="panel p-6">
          <h2 className="text-xl font-bold">Abas armazenadas</h2>
          <div className="mt-4 flex flex-wrap gap-2">{c.sourceSheets.map((sheet) => <span key={sheet} className="badge bg-accent-soft text-accent-strong">{sheet}</span>)}</div>
          <div className="mt-5 text-sm text-muted">
            <p>Arquivo: <strong className="text-foreground">{c.importedFileName}</strong></p>
            <p className="mt-2">Última importação: <strong className="text-foreground">{c.importedAt ? c.importedAt.toLocaleString("pt-BR") : "nenhuma"}</strong></p>
          </div>
        </article>
      </section>
    </main>
  );
}
