export type ContractCostSnapshot = {
  contractCode: string;
  procurement: string;
  process: string;
  municipality: string;
  executionMonths: number;
  contractor: string;
  monthlyProposed: number;
  annualProposed: number;
  thirtyMonthProposed: number;
  costPerEmployee: number;
  costPerEmployeeAlt: number;
  costPerM2Total: number;
  calculatedEmployees: number;
  locationsArea: number;
  locationsDailyArea: number;
  laborBase: number;
  module2: number;
  module3: number;
  module4: number;
  module5: number;
  module6: number;
  materialsAnnual: number;
  materialsPerEmployeeMonthly: number;
  equipmentMonthly: number;
  equipmentPerEmployeeMonthly: number;
  uniformsAnnual: number;
  uniformsMonthly: number;
  epiAnnual: number;
  epiMonthly: number;
  utensilsAnnual: number;
  utensilsMonthly: number;
  sourceSheets: string[];
};

/**
 * Base de contingência transcrita da Planilha de Custos - Limpeza.
 * Quando uma nova planilha XLSX é importada, a base persistida no PostgreSQL passa a ter prioridade.
 */
export const CONTRACT_COST_SNAPSHOT: ContractCostSnapshot = {
  contractCode: "73/2026",
  procurement: "Licitação nº 181/2026",
  process: "23821.000303/2026-10",
  municipality: "São Bento do Sul",
  executionMonths: 30,
  contractor: "RGF AMBIENTAL LTDA",
  monthlyProposed: 30210.45,
  annualProposed: 906313.50,
  thirtyMonthProposed: 906313.50,
  costPerEmployee: 5514.53,
  costPerEmployeeAlt: 5848.07,
  costPerM2Total: 30210.45,
  calculatedEmployees: 6,
  locationsArea: 5924.80,
  locationsDailyArea: 3634.69678030303,
  laborBase: 2049.30,
  module2: 2381.23,
  module3: 140.01937125,
  module4: 272.02911132375,
  module5: 110.990833333333,
  module6: 560.962391021197,
  materialsAnnual: 67390.85,
  materialsPerEmployeeMonthly: 87.375,
  equipmentMonthly: 36.01,
  equipmentPerEmployeeMonthly: 6,
  uniformsAnnual: 156.81,
  uniformsMonthly: 13.0675,
  epiAnnual: 54.58,
  epiMonthly: 4.54833333333333,
  utensilsAnnual: 0,
  utensilsMonthly: 0,
  sourceSheets: ["RESUMO", "Custos por posto", "Cálculo custoM²", "MAT.UTEN", "EQU", "UNI.EPI", "UTE", "Locais"],
};

export const IMR_MEASUREMENT_SNAPSHOT = {
  monthKey: "2026-06",
  contractMonthlyWithVt: 34009.08,
  contractMonthlyWithoutVt: 33211.81,
  vtDifference: 797.27,
  vtDaysNotPaid: 132,
  vtDiscount: 797.27,
  crecheDifference: 645,
  crechePaid: 0,
  crecheDiscount: 645,
  monthlyWithoutImr: 32566.81,
  imrFactor: 0.9,
  amountAfterImr: 29310.129,
};

export function formatCostNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
