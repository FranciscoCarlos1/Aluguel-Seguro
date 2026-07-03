'use server';

import { Prisma, PunchType, RecordSource, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  normalizePersonName,
  parseBrazilianDateToUtcDate,
  parseIsoDateToUtcDate,
} from "@/lib/utils";
import { punchSchema, toFieldErrors, type FormState } from "@/lib/validations";

type CsvImportResult =
  | {
      success?: boolean;
      message?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

export async function createPunchAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireUser([Role.ADMIN, Role.OPERATOR]);
  const parsed = punchSchema.safeParse({
    employeeId: formData.get("employeeId"),
    workDate: formData.get("workDate"),
    type: formData.get("type"),
    time: formData.get("time"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      errors: toFieldErrors(parsed.error),
      message: "Corrija os campos destacados.",
    };
  }

  const employee = await db.employee.findUnique({
    where: { id: parsed.data.employeeId },
  });

  if (!employee || !employee.active) {
    return {
      message: "Funcionária inválida ou inativa.",
    };
  }

  const duplicate = await db.timePunch.findFirst({
    where: {
      employeeId: parsed.data.employeeId,
      workDate: parseIsoDateToUtcDate(parsed.data.workDate),
      type: parsed.data.type,
      time: parsed.data.time,
    },
  });

  if (duplicate) {
    return {
      message: "Este registro já existe para a funcionária na data informada.",
    };
  }

  const punch = await db.timePunch.create({
    data: {
      employeeId: parsed.data.employeeId,
      workDate: parseIsoDateToUtcDate(parsed.data.workDate),
      type: parsed.data.type,
      time: parsed.data.time,
      notes: parsed.data.notes,
      createdById: currentUser.id,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: currentUser.id,
      action: "PUNCH_CREATED",
      entity: "time_punch",
      entityId: punch.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jornadas");
  revalidatePath("/dashboard/funcionarias");

  return {
    success: true,
    message: "Horário registrado com sucesso.",
  };
}

function inferPunchTypeByOffset(offset: number) {
  return offset % 2 === 0 ? PunchType.ENTRY : PunchType.EXIT;
}

function parseControlCsv(csvText: string) {
  const rows = csvText
    .split(/\r?\n/)
    .map((line) => line.split(","));

  if (rows.length < 4) {
    throw new Error("Arquivo CSV incompleto.");
  }

  const employeeHeader = rows[2] ?? [];
  const employeeSlots = employeeHeader
    .map((value, index) => ({
      index,
      name: value.trim(),
    }))
    .filter((item) => item.index > 0 && item.name);

  if (employeeSlots.length === 0) {
    throw new Error("Não foi possível identificar as funcionárias no cabeçalho do CSV.");
  }

  return rows.slice(3).flatMap((row) => {
    const dateCell = row[0]?.trim();

    if (!dateCell || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateCell)) {
      return [];
    }

    return employeeSlots.flatMap((slot, slotIndex) => {
      const nextStart = employeeSlots[slotIndex + 1]?.index ?? row.length;
      const rawPunches = row.slice(slot.index, nextStart);

      return rawPunches.flatMap((time, offset) => {
        const normalizedTime = time.trim();

        if (!normalizedTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(normalizedTime)) {
          return [];
        }

        return {
          employeeName: slot.name,
          workDate: parseBrazilianDateToUtcDate(dateCell),
          type: inferPunchTypeByOffset(offset),
          time: normalizedTime,
        };
      });
    });
  });
}

export async function importPunchesFromCsvAction(
  _state: CsvImportResult,
  formData: FormData,
): Promise<CsvImportResult> {
  const currentUser = await requireUser([Role.ADMIN, Role.OPERATOR]);
  const csvFile = formData.get("csvFile");

  if (!(csvFile instanceof File) || csvFile.size === 0) {
    return {
      message: "Selecione um arquivo CSV válido para importar.",
    };
  }

  const csvText = await csvFile.text();
  const parsedPunches = parseControlCsv(csvText);

  if (parsedPunches.length === 0) {
    return {
      message: "Nenhuma batida válida foi encontrada no arquivo enviado.",
    };
  }

  const employees = await db.employee.findMany({
    select: { id: true, name: true },
  });

  const employeeMap = new Map(
    employees.map((employee) => [normalizePersonName(employee.name), employee]),
  );

  const missingEmployees = Array.from(
    new Set(
      parsedPunches
        .map((punch) => punch.employeeName)
        .filter((name) => !employeeMap.has(normalizePersonName(name))),
    ),
  );

  if (missingEmployees.length > 0) {
    return {
      message: `Funcionárias não cadastradas no sistema: ${missingEmployees.join(", ")}.`,
    };
  }

  const existingPunches = await db.timePunch.findMany({
    where: {
      source: RecordSource.IMPORT,
    },
    select: {
      employeeId: true,
      workDate: true,
      type: true,
      time: true,
    },
  });

  const existingKeys = new Set(
    existingPunches.map(
      (punch) => `${punch.employeeId}|${punch.workDate.toISOString().slice(0, 10)}|${punch.type}|${punch.time}`,
    ),
  );

  const recordsToCreate = parsedPunches.flatMap((punch) => {
    const employee = employeeMap.get(normalizePersonName(punch.employeeName));

    if (!employee) {
      return [];
    }

    const key = `${employee.id}|${punch.workDate.toISOString().slice(0, 10)}|${punch.type}|${punch.time}`;

    if (existingKeys.has(key)) {
      return [];
    }

    existingKeys.add(key);

    return {
      employeeId: employee.id,
      workDate: punch.workDate,
      type: punch.type,
      time: punch.time,
      source: RecordSource.IMPORT,
      createdById: currentUser.id,
      notes: `Importado de CSV: ${csvFile.name}`,
    } satisfies Prisma.TimePunchCreateManyInput;
  });

  if (recordsToCreate.length === 0) {
    return {
      success: true,
      message: "O arquivo foi processado, mas não havia novos registros para importar.",
    };
  }

  await db.timePunch.createMany({
    data: recordsToCreate,
  });

  await db.auditLog.create({
    data: {
      actorId: currentUser.id,
      action: "PUNCHES_IMPORTED_FROM_CSV",
      entity: "time_punch",
      payload: {
        fileName: csvFile.name,
        importedCount: recordsToCreate.length,
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jornadas");
  revalidatePath("/dashboard/funcionarias");

  return {
    success: true,
    message: `${recordsToCreate.length} registros importados com sucesso do arquivo CSV.`,
  };
}
