'use server';

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseContractCostWorkbook } from "@/lib/contract-costs-import";

type CostImportState =
  | { success?: boolean; message?: string }
  | undefined;

export async function importContractCostWorkbookAction(
  _state: CostImportState,
  formData: FormData,
): Promise<CostImportState> {
  const currentUser = await requireUser([Role.ADMIN]);
  const file = formData.get("costWorkbook");

  if (!(file instanceof File) || file.size === 0) {
    return { message: "Selecione a planilha XLSX de custos." };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { message: "O importador de custos aceita arquivos .xlsx." };
  }

  try {
    const parsed = parseContractCostWorkbook(await file.arrayBuffer());

    const snapshot = await db.contractCostSnapshot.create({
      data: {
        contractCode: parsed.contractCode,
        procurement: parsed.procurement,
        process: parsed.process,
        municipality: parsed.municipality,
        contractor: parsed.contractor,
        cnpj: parsed.cnpj,
        executionMonths: parsed.executionMonths,
        calculatedEmployees: parsed.calculatedEmployees,
        monthlyProposed: new Prisma.Decimal(parsed.monthlyProposed),
        annualProposed: new Prisma.Decimal(parsed.annualProposed),
        thirtyMonthProposed: new Prisma.Decimal(parsed.thirtyMonthProposed),
        costPerEmployee: new Prisma.Decimal(parsed.costPerEmployee),
        costPerEmployeeAlt: new Prisma.Decimal(parsed.costPerEmployeeAlt),
        costPerM2Total: new Prisma.Decimal(parsed.costPerM2Total),
        locationsArea: new Prisma.Decimal(parsed.locationsArea),
        locationsDailyArea: new Prisma.Decimal(parsed.locationsDailyArea),
        laborBase: new Prisma.Decimal(parsed.laborBase),
        module2: new Prisma.Decimal(parsed.module2),
        module3: new Prisma.Decimal(parsed.module3),
        module4: new Prisma.Decimal(parsed.module4),
        module5: new Prisma.Decimal(parsed.module5),
        module6: new Prisma.Decimal(parsed.module6),
        materialsAnnual: new Prisma.Decimal(parsed.materialsAnnual),
        materialsMonthly: new Prisma.Decimal(parsed.materialsMonthly),
        equipmentMonthly: new Prisma.Decimal(parsed.equipmentMonthly),
        equipmentPerEmployeeMonthly: new Prisma.Decimal(parsed.equipmentPerEmployeeMonthly),
        uniformsAnnual: new Prisma.Decimal(parsed.uniformsAnnual),
        uniformsMonthly: new Prisma.Decimal(parsed.uniformsMonthly),
        epiAnnual: new Prisma.Decimal(parsed.epiAnnual),
        epiMonthly: new Prisma.Decimal(parsed.epiMonthly),
        utensilsAnnual: new Prisma.Decimal(parsed.utensilsAnnual),
        utensilsMonthly: new Prisma.Decimal(parsed.utensilsMonthly),
        sourceSheets: parsed.sourceSheets,
        workbookData: parsed.workbookData,
        importedFileName: file.name,
        importedById: currentUser.id,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "CONTRACT_COST_WORKBOOK_IMPORTED",
        entity: "contract_cost_snapshot",
        entityId: snapshot.id,
        payload: {
          fileName: file.name,
          contractCode: parsed.contractCode,
          monthlyProposed: parsed.monthlyProposed,
          annualProposed: parsed.annualProposed,
          sourceSheets: parsed.sourceSheets,
        },
      },
    });

    revalidatePath("/dashboard/custos");
    revalidatePath("/dashboard/avaliacoes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Planilha importada. Valor mensal identificado: R$ ${parsed.monthlyProposed.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Todas as ${parsed.sourceSheets.length} abas foram armazenadas.`,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Não foi possível processar a planilha de custos.",
    };
  }
}
