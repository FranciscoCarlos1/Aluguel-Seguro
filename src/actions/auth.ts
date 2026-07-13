'use server';

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSession, destroySession, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";
import { firstLoginSchema, loginSchema, toFieldErrors, type FormState } from "@/lib/validations";

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
    select: {
      id: true,
      passwordHash: true,
      isActive: true,
      forcePasswordChange: true,
    },
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

  if (user.forcePasswordChange) {
    revalidatePath("/primeiro-acesso");
    redirect("/primeiro-acesso");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function completeFirstLoginAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(undefined, { allowForcedPasswordChange: true });
  const parsed = firstLoginSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      errors: toFieldErrors(parsed.error),
      message: "Corrija os campos destacados.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      forcePasswordChange: false,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "PASSWORD_CHANGED_FIRST_LOGIN",
      entity: "auth",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/primeiro-acesso");
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
