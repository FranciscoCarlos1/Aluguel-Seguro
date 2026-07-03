'use server';

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { employeeSchema, toFieldErrors, type FormState } from "@/lib/validations";

export async function createEmployeeAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireUser([Role.ADMIN, Role.OPERATOR]);
  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      errors: toFieldErrors(parsed.error),
      message: "Corrija os campos destacados.",
    };
  }

  const name = parsed.data.name.trim();
  const existing = await db.employee.findUnique({ where: { name } });

  if (existing) {
    return {
      message: "Funcionária já cadastrada.",
    };
  }

  const employee = await db.employee.create({
    data: {
      name,
      active: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: currentUser.id,
      action: "EMPLOYEE_CREATED",
      entity: "employee",
      entityId: employee.id,
    },
  });

  revalidatePath("/dashboard/funcionarias");
  revalidatePath("/dashboard/jornadas");

  return {
    success: true,
    message: "Funcionária cadastrada com sucesso.",
  };
}

export async function toggleEmployeeStatusAction(formData: FormData) {
  const currentUser = await requireUser([Role.ADMIN]);
  const employeeId = String(formData.get("employeeId") || "");

  if (!employeeId) {
    return;
  }

  const employee = await db.employee.findUnique({ where: { id: employeeId } });

  if (!employee) {
    return;
  }

  await db.employee.update({
    where: { id: employeeId },
    data: { active: !employee.active },
  });

  await db.auditLog.create({
    data: {
      actorId: currentUser.id,
      action: employee.active ? "EMPLOYEE_DISABLED" : "EMPLOYEE_ENABLED",
      entity: "employee",
      entityId: employee.id,
    },
  });

  revalidatePath("/dashboard/funcionarias");
  revalidatePath("/dashboard/jornadas");
}
