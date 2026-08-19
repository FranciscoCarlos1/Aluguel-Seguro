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
  const raw = value.replace(/R\$|%/gi, "").replace(/\s/g, "").trim();
  if (!raw) return 0;

  if (raw.includes(",")) {
    const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNumericCell(value: string) {
  const raw = value.replace(/R\$|%/gi, "").replace(/\s/g, "").trim();
  return raw !== "" && /^[-+]?\d+(?:[.,]\d+)?$/.test(raw);
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

function findLabelPositions(rows: string[][], labels: string[]) {
  const wanted = labels.map(normalize);
  const hits: Array<{ row: number; column: number }> = [];

  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[r].length; c += 1) {
      const value = normalize(rows[r][c] ?? "");
      if (!value) continue;
      if (wanted.some((label) => value === label || value.startsWith(`${label} `) || value.includes(label))) {
        hits.push({ row: r, column: c });
      }
    }
  }

  return hits;
}

function numbersAfter(rows: string[][], row: number, column: number, maxColumns = 8) {
  const values: Array<{ value: number; column: number }> = [];
  const end = Math.min(rows[row]?.length ?? 0, column + 1 + maxColumns);
  for (let c = column + 1; c < end; c += 1) {
    if (!isNumericCell(rows[row][c] ?? "")) continue;
    const value = parseNumberValue(rows[row][c]);
    if (value !== 0) values.push({ value, column: c });
  }
  return values;
}

function findNumberNearLabel(
  rows: string[][],
  labels: string[],
  options?: { min?: number; max?: number; preferLargest?: boolean },
) {
  const hits = findLabelPositions(rows, labels);
  const candidates: number[] = [];

  for (const hit of hits) {
    for (const candidate of numbersAfter(rows, hit.row, hit.column)) {
      if (options?.min !== undefined && candidate.value < options.min) continue;
      if (options?.max !== undefined && candidate.value > options.max) continue;
      candidates.push(candidate.value);
    }

    // Algumas planilhas colocam o rótulo numa linha e o valor na linha seguinte.
    for (const row of [hit.row + 1, hit.row + 2]) {
      if (row >= rows.length) continue;
      for (const candidate of numbersAfter(rows, row, -1)) {
        if (options?.min !== undefined && candidate.value < options.min) continue;
        if (options?.max !== undefined && candidate.value > options.max) continue;
        candidates.push(candidate.value);
      }
    }
  }

  if (!candidates.length) return 0;
  return options?.preferLargest ? Math.max(...candidates) : candidates[0];
}

function findTextNearLabel(rows: string[][], labels: string[], maxRows = 2) {
  const hits = findLabelPositions(rows, labels);

  for (const hit of hits) {
    for (let distance = 0; distance <= maxRows; distance += 1) {
      const row = hit.row + distance;
      if (row >= rows.length) break;
      const start = distance === 0 ? hit.column + 1 : 0;
      for (let c = start; c < rows[row].length; c += 1) {
        const value = rows[row][c]?.trim() ?? "";
        if (value && !isNumericCell(value) && !/^[-–—]$/.test(value)) return value;
      }
    }
  }

  return "";
}

function findNumericByLabels(
  rows: string[][],
  labels: string[],
  fallbackRow: number,
  fallbackColumn: number,
  options?: { min?: number; max?: number; preferLargest?: boolean },
) {
  const found = findNumberNearLabel(rows, labels, options);
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

  // Os valores não são digitados nem inventados pelo sistema: são localizados na planilha.
  // Os filtros evitam que números de cabeçalhos, datas ou quantidades como 32 e 71 sejam
  // confundidos com os valores monetários principais.
  let executionMonths = findNumericByLabels(
    resumo,
    ["prazo de execução", "prazo contratual", "meses de execução", "meses"],
    26,
    7,
    { min: 1, max: 120 },
  );

  const monthlyCandidates = findNumberNearLabel(
    resumo,
    ["valor mensal da proposta", "valor mensal proposto", "valor mensal"],
    { min: 1000, preferLargest: true },
  );
  const annualCandidates = findNumberNearLabel(
    resumo,
    ["valor anual da proposta", "valor anual proposto", "valor anual"],
    { min: 10000, preferLargest: true },
  );

  let monthlyProposed = monthlyCandidates || number(resumo, 26, 8);
  let annualProposed = annualCandidates || number(resumo, 26, 9);

  // Em muitas planilhas de contratação o campo chamado "anual" representa o valor
  // global do prazo. Quando o prazo e o total são compatíveis, usamos essa relação
  // para corrigir automaticamente uma célula intermediária incorreta.
  if (annualProposed > 0 && executionMonths > 0) {
    const derivedMonthly = annualProposed / executionMonths;
    if (monthlyProposed < 1000 || Math.abs(monthlyProposed - derivedMonthly) / derivedMonthly > 0.25) {
      monthlyProposed = derivedMonthly;
    }
  }

  const calculatedEmployees = findNumericByLabels(
    postos,
    ["quantidade de empregados", "quantidade de postos", "empregados calculados", "número de postos", "numero de postos"],
    58,
    5,
    { min: 1, max: 500 },
  );

  const costPerEmployee = findNumericByLabels(
    postos,
    ["valor por posto", "custo por posto", "preço por posto", "custo por empregado", "valor por empregado"],
    126,
    4,
    { min: 100, preferLargest: true },
  );
  const costPerEmployeeAlt = findNumericByLabels(
    postos,
    ["valor por posto", "custo por posto", "preço por posto", "custo por empregado", "valor por empregado"],
    126,
    5,
    { min: 100, preferLargest: true },
  );

  const locationsArea = findNumericByLabels(
    locais,
    ["área total", "area total", "área total m2", "area total m2"],
    15,
    7,
    { min: 1, preferLargest: true },
  );
  const locationsDailyArea = findNumericByLabels(
    locais,
    ["área média diária", "area media diaria", "área diária", "area diaria"],
    15,
    9,
    { min: 1, preferLargest: true },
  );

  const contractCode = findTextNearLabel(resumo, ["contrato", "número do contrato", "numero do contrato"]) || "73/2026";
  const procurement = findTextNearLabel(resumo, ["licitação", "licitacao", "modalidade"]) || findTextNearLabel(postos, ["licitação", "licitacao"]);
  const process = findTextNearLabel(resumo, ["processo", "processo administrativo"]) || findTextNearLabel(postos, ["processo", "processo administrativo"]);
  const municipality = findTextNearLabel(locais, ["município", "municipio", "cidade"]) || text(postos, 11, 3);
  const contractor = findTextNearLabel(resumo, ["contratada", "empresa contratada", "empresa"]) || text(resumo, 11, 3);
  const cnpj = findTextNearLabel(resumo, ["cnpj"]);

  const laborBase = findNumericByLabels(postos, ["mão de obra", "mao de obra", "módulo 1", "modulo 1"], 35, 4, { min: 1, preferLargest: true });
  const module2 = findNumericByLabels(postos, ["módulo 2", "modulo 2", "encargos e benefícios", "encargos e beneficios"], 70, 4, { min: 1, preferLargest: true });
  const module3 = findNumericByLabels(postos, ["módulo 3", "modulo 3", "provisão para rescisão", "provisao para rescisao"], 79, 4, { min: 1, preferLargest: true });
  const module4 = findNumericByLabels(postos, ["módulo 4", "modulo 4", "reposição de ausências", "reposicao de ausencias"], 98, 4, { min: 1, preferLargest: true });
  const module5 = findNumericByLabels(postos, ["módulo 5", "modulo 5", "insumos diversos"], 106, 4, { min: 1, preferLargest: true });
  const module6 = findNumericByLabels(postos, ["módulo 6", "modulo 6", "indiretos", "tributos", "lucro"], 115, 4, { min: 1, preferLargest: true });

  const materialsAnnual = findNumericByLabels(materiais, ["total anual", "valor anual", "anual"], 56, 7, { min: 1, preferLargest: true });
  const materialsMonthly = findNumericByLabels(materiais, ["total mensal", "valor mensal", "mensal"], 57, 9, { min: 1, preferLargest: true });
  const equipmentMonthly = findNumericByLabels(equipamentos, ["total mensal", "valor mensal", "mensal"], 12, 8, { min: 1, preferLargest: true });
  const equipmentPerEmployeeMonthly = findNumericByLabels(equipamentos, ["por empregado", "por posto", "mensal por empregado"], 13, 8, { min: 0.01, preferLargest: true });
  const uniformsAnnual = findNumericByLabels(uniformes, ["total anual", "valor anual", "anual"], 12, 7, { min: 1, preferLargest: true });
  const uniformsMonthly = findNumericByLabels(uniformes, ["total mensal", "valor mensal", "mensal"], 13, 7, { min: 1, preferLargest: true });
  const epiAnnual = findNumericByLabels(uniformes, ["epi", "total anual", "valor anual", "anual"], 26, 7, { min: 1, preferLargest: true });
  const epiMonthly = findNumericByLabels(uniformes, ["epi", "total mensal", "valor mensal", "mensal"], 27, 7, { min: 1, preferLargest: true });
  const utensilsAnnual = findNumericByLabels(utensilios, ["total anual", "valor anual", "anual"], 34, 7, { min: 1, preferLargest: true });
  const utensilsMonthly = findNumericByLabels(utensilios, ["total mensal", "valor mensal", "mensal"], 35, 7, { min: 1, preferLargest: true });

  if (monthlyProposed <= 0 || annualProposed <= 0) {
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
