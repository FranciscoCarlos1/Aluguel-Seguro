'use server';

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";
import { loginSchema, toFieldErrors, type FormState } from "@/lib/validations";

export async function loginAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: toFieldErrors(parsed.error),
      message: "Corrija os campos destacados.",
    };
  }

  const email = normalizeEmail(parsed.data.email);

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return {
      message: "Credenciais inválidas.",
    };
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "LOGIN_FAILED",
        entity: "auth",
      },
    });

    return {
      message: "Credenciais inválidas.",
    };
  }

  await createSession(user.id);

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "auth",
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
