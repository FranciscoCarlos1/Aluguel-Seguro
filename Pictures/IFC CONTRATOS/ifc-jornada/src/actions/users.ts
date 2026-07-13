'use server';

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";
import { toFieldErrors, userSchema, type FormState } from "@/lib/validations";

export async function createUserAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireUser([Role.ADMIN]);
  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    forcePasswordChange: formData.get("forcePasswordChange") === "on",
  });

  if (!parsed.success) {
    return {
      errors: toFieldErrors(parsed.error),
      message: "Corrija os campos destacados.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    return {
      message: "Já existe um usuário com este e-mail.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role: parsed.data.role,
      isActive: true,
      forcePasswordChange: parsed.data.forcePasswordChange,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: currentUser.id,
      action: "USER_CREATED",
      entity: "user",
      entityId: user.id,
      payload: {
        forcePasswordChange: user.forcePasswordChange,
      },
    },
  });

  revalidatePath("/dashboard/usuarios");

  return {
    success: true,
    message: "Usuário criado com sucesso.",
  };
}

export async function toggleUserStatusAction(formData: FormData) {
  const currentUser = await requireUser([Role.ADMIN]);
  const userId = String(formData.get("userId") || "");

  if (!userId || userId === currentUser.id) {
    return;
  }

  const target = await db.user.findUnique({ where: { id: userId } });

  if (!target) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: { isActive: !target.isActive },
  });

  await db.auditLog.create({
    data: {
      actorId: currentUser.id,
      action: target.isActive ? "USER_DISABLED" : "USER_ENABLED",
      entity: "user",
      entityId: target.id,
    },
  });

  revalidatePath("/dashboard/usuarios");
}
