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

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function text(rows: string[][], row: number, column: number) {
  return rows[row - 1]?.[column - 1]?.trim() ?? "";
}

function parseNumberValue(value: string) {
  const raw = value
    .replace(/R\$|%/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!raw) return 0;

  // Excel em pt-BR: 30.210,45 -> 30210.45.
  if (raw.includes(",")) {
    const normalized = raw.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function number(rows: string[][], row: number, column: number) {
  return parseNumberValue(text(rows, row, column));
}

function requireSheet(sheets: Record<string, string[][]>, name: string) {
  const exact = sheets[name];
  if (exact) return exact;

  const key = normalize(name);
  const found = Object.entries(sheets).find(([sheetName]) => normalize(sheetName) === key);
  if (found) return found[1];

  throw new Error(`A aba obrigatória '${name}' não foi encontrada na planilha.`);
}

function findLabel(rows: string[][], labels: string[]) {
  const wanted = labels.map(normalize);

  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[r].length; c += 1) {
      const value = normalize(rows[r][c] ?? "");
      if (!value) continue;

      if (wanted.some((label) => value === label || value.startsWith(`${label} `) || value.includes(label))) {
        return { row: r, column: c };
      }
    }
  }

  return null;
}

function numbersInRow(rows: string[][], row: number, fromColumn: number) {
  const result: number[] = [];
  for (let c = fromColumn + 1; c < (rows[row]?.length ?? 0); c += 1) {
    const value = parseNumberValue(rows[row][c] ?? "");
    if (value !== 0) result.push(value);
  }
  return result;
}

function findNumberNearLabel(rows: string[][], labels: string[], options?: { preferLast?: boolean; maxRows?: number }) {
  const hit = findLabel(rows, labels);
  if (!hit) return 0;

  const maxRows = options?.maxRows ?? 3;
  const candidates: number[] = [];

  // Primeiro procura na mesma linha, depois nas linhas imediatamente abaixo.
  for (let distance = 0; distance <= maxRows; distance += 1) {
    const row = hit.row + distance;
    if (row >= rows.length) break;
    candidates.push(...numbersInRow(rows, row, distance === 0 ? hit.column : -1));
  }

  if (!candidates.length) return 0;
  return options?.preferLast ? candidates[candidates.length - 1] : candidates[0];
}

function findTextNearLabel(rows: string[][], labels: string[], maxRows = 2) {
  const hit = findLabel(rows, labels);
  if (!hit) return "";

  for (let distance = 0; distance <= maxRows; distance += 1) {
    const row = hit.row + distance;
    if (row >= rows.length) break;
    for (let c = distance === 0 ? hit.column + 1 : 0; c < rows[row].length; c += 1) {
      const value = rows[row][c]?.trim() ?? "";
      if (value && !/^[-–—]$/.test(value) && !Number.isFinite(parseNumberValue(value))) return value;
    }
  }

  return "";
}

function findNumericByLabels(rows: string[][], labels: string[], fallbackRow: number, fallbackColumn: number) {
  const found = findNumberNearLabel(rows, labels);
  return found !== 0 ? found : number(rows, fallbackRow, fallbackColumn);
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

  const monthlyProposed = findNumericByLabels(
    resumo,
    ["valor mensal da proposta", "valor mensal proposto", "valor mensal"],
    26,
    8,
  );
  const annualProposed = findNumericByLabels(
    resumo,
    ["valor anual da proposta", "valor anual proposto", "valor anual"],
    26,
    9,
  );
  const executionMonths = findNumericByLabels(
    resumo,
    ["prazo de execução", "execução", "execucao", "meses de execução", "meses"],
    26,
    7,
  );

  const calculatedEmployees = findNumericByLabels(
    postos,
    ["quantidade de empregados", "quantidade de postos", "postos", "empregados calculados", "empregados"],
    58,
    5,
  );

  const costPerEmployee = findNumericByLabels(
    postos,
    ["valor por posto", "custo por posto", "preço por posto", "custo por empregado", "valor por empregado"],
    126,
    4,
  );
  const costPerEmployeeAlt = findNumericByLabels(
    postos,
    ["valor por posto", "custo por posto", "preço por posto", "custo por empregado", "valor por empregado"],
    126,
    5,
  );

  const locationsArea = findNumericByLabels(
    locais,
    ["área total", "area total", "área total m2", "area total m2"],
    15,
    7,
  );
  const locationsDailyArea = findNumericByLabels(
    locais,
    ["área média diária", "area media diaria", "área diária", "area diaria"],
    15,
    9,
  );

  const contractCode = findTextNearLabel(resumo, ["contrato", "número do contrato", "numero do contrato"]) || "73/2026";
  const procurement = findTextNearLabel(resumo, ["licitação", "licitacao", "modalidade"]) || findTextNearLabel(postos, ["licitação", "licitacao"]) || "";
  const process = findTextNearLabel(resumo, ["processo", "processo administrativo"]) || findTextNearLabel(postos, ["processo", "processo administrativo"]);
  const municipality = findTextNearLabel(locais, ["município", "municipio", "cidade"]) || text(postos, 11, 3);
  const contractor = findTextNearLabel(resumo, ["contratada", "empresa contratada", "empresa"]) || text(resumo, 11, 3);
  const cnpj = findTextNearLabel(resumo, ["cnpj"]);

  const laborBase = findNumericByLabels(postos, ["mão de obra", "mao de obra", "módulo 1", "modulo 1"], 35, 4);
  const module2 = findNumericByLabels(postos, ["módulo 2", "modulo 2", "encargos e benefícios", "encargos e beneficios"], 70, 4);
  const module3 = findNumericByLabels(postos, ["módulo 3", "modulo 3", "provisão para rescisão", "provisao para rescisao"], 79, 4);
  const module4 = findNumericByLabels(postos, ["módulo 4", "modulo 4", "reposição de ausências", "reposicao de ausencias"], 98, 4);
  const module5 = findNumericByLabels(postos, ["módulo 5", "modulo 5", "insumos diversos"], 106, 4);
  const module6 = findNumericByLabels(postos, ["módulo 6", "modulo 6", "indiretos", "tributos", "lucro"], 115, 4);

  const materialsAnnual = findNumericByLabels(materiais, ["total anual", "valor anual", "total"], 56, 7);
  const materialsMonthly = findNumericByLabels(materiais, ["total mensal", "valor mensal", "mensal"], 57, 9);
  const equipmentMonthly = findNumericByLabels(equipamentos, ["total mensal", "valor mensal", "mensal"], 12, 8);
  const equipmentPerEmployeeMonthly = findNumericByLabels(equipamentos, ["por empregado", "por posto", "mensal por empregado"], 13, 8);
  const uniformsAnnual = findNumericByLabels(uniformes, ["total anual", "valor anual", "anual"], 12, 7);
  const uniformsMonthly = findNumericByLabels(uniformes, ["total mensal", "valor mensal", "mensal"], 13, 7);
  const epiAnnual = findNumericByLabels(uniformes, ["epi", "total anual", "valor anual", "anual"], 26, 7);
  const epiMonthly = findNumericByLabels(uniformes, ["epi", "total mensal", "valor mensal", "mensal"], 27, 7);
  const utensilsAnnual = findNumericByLabels(utensilios, ["total anual", "valor anual", "anual"], 34, 7);
  const utensilsMonthly = findNumericByLabels(utensilios, ["total mensal", "valor mensal", "mensal"], 35, 7);

  if (monthlyProposed === 0 && annualProposed === 0) {
    throw new Error("Não foi possível localizar os valores da proposta na aba RESUMO. Verifique se a planilha é a planilha de custos esperada.");
  }

  return {
    contractCode,
    procurement,
    process,
    municipality,
    contractor,
    cnpj,
    executionMonths,
    calculatedEmployees,
    monthlyProposed,
    annualProposed,
    thirtyMonthProposed: executionMonths > 0 ? monthlyProposed * executionMonths : annualProposed,
    costPerEmployee,
    costPerEmployeeAlt,
    costPerM2Total: monthlyProposed,
    locationsArea,
    locationsDailyArea,
    laborBase,
    module2,
    module3,
    module4,
    module5,
    module6,
    materialsAnnual,
    materialsMonthly,
    equipmentMonthly,
    equipmentPerEmployeeMonthly,
    uniformsAnnual,
    uniformsMonthly,
    epiAnnual,
    epiMonthly,
    utensilsAnnual,
    utensilsMonthly,
    sourceSheets: Object.keys(sheets),
    workbookData: sheets,
  };
}
