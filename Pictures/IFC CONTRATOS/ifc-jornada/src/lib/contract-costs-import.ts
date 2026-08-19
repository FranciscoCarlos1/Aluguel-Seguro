import { readXlsx } from "@/lib/xlsx-lite";

export type ImportedContractCost = {
  contractCode: string;
  procurement: string;
  process: string;
  municipality: string;
  contractor: string;
  cnpj: string;
  executionMonths: number;
  calculatedEmployees: number;
  monthlyProposed: number;
  annualProposed: number;
  thirtyMonthProposed: number;
  costPerEmployee: number;
  costPerEmployeeAlt: number;
  costPerM2Total: number;
  locationsArea: number;
  locationsDailyArea: number;
  laborBase: number;
  module2: number;
  module3: number;
  module4: number;
  module5: number;
  module6: number;
  materialsAnnual: number;
  materialsMonthly: number;
  equipmentMonthly: number;
  equipmentPerEmployeeMonthly: number;
  uniformsAnnual: number;
  uniformsMonthly: number;
  epiAnnual: number;
  epiMonthly: number;
  utensilsAnnual: number;
  utensilsMonthly: number;
  sourceSheets: string[];
  workbookData: Record<string, string[][]>;
};

function text(rows: string[][], row: number, column: number) {
  return rows[row - 1]?.[column - 1]?.trim() ?? "";
}

function number(rows: string[][], row: number, column: number) {
  const value = text(rows, row, column).replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function requireSheet(sheets: Record<string, string[][]>, name: string) {
  const sheet = sheets[name];
  if (!sheet) throw new Error(`A aba obrigatória '${name}' não foi encontrada na planilha.`);
  return sheet;
}

export function parseContractCostWorkbook(buffer: ArrayBuffer): ImportedContractCost {
  const sheets = readXlsx(buffer);
  const resumo = requireSheet(sheets, "RESUMO");
  const postos = requireSheet(sheets, "Custos por posto");
  const locais = requireSheet(sheets, "Locais");
  const materiais = requireSheet(sheets, "MAT.UTEN");
  const equipamentos = requireSheet(sheets, "EQU");
  const uniformes = requireSheet(sheets, "UNI.EPI");
  const utensilios = requireSheet(sheets, "UTE");

  const monthlyProposed = number(resumo, 26, 8);
  const annualProposed = number(resumo, 26, 9);
  const executionMonths = number(resumo, 26, 7);

  return {
    contractCode: "73/2026",
    procurement: text(postos, 6, 1) || "Licitação nº 181/2026",
    process: text(postos, 7, 1),
    municipality: text(postos, 11, 3),
    contractor: text(resumo, 11, 3),
    cnpj: text(resumo, 12, 3),
    executionMonths,
    calculatedEmployees: number(postos, 58, 5),
    monthlyProposed,
    annualProposed,
    thirtyMonthProposed: executionMonths > 0 ? monthlyProposed * executionMonths : annualProposed,
    costPerEmployee: number(postos, 126, 4),
    costPerEmployeeAlt: number(postos, 126, 5),
    costPerM2Total: monthlyProposed,
    locationsArea: number(locais, 15, 7),
    locationsDailyArea: number(locais, 15, 9),
    laborBase: number(postos, 35, 4),
    module2: number(postos, 70, 4),
    module3: number(postos, 79, 4),
    module4: number(postos, 98, 4),
    module5: number(postos, 106, 4),
    module6: number(postos, 115, 4),
    materialsAnnual: number(materiais, 56, 7),
    materialsMonthly: number(materiais, 57, 9),
    equipmentMonthly: number(equipamentos, 12, 8),
    equipmentPerEmployeeMonthly: number(equipamentos, 13, 8),
    uniformsAnnual: number(uniformes, 12, 7),
    uniformsMonthly: number(uniformes, 13, 7),
    epiAnnual: number(uniformes, 26, 7),
    epiMonthly: number(uniformes, 27, 7),
    utensilsAnnual: number(utensilios, 34, 7),
    utensilsMonthly: number(utensilios, 35, 7),
    sourceSheets: Object.keys(sheets),
    workbookData: sheets,
  };
}
