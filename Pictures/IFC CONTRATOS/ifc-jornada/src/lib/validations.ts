import { Role, PunchType } from "@prisma/client";
import { z } from "zod";

export type FormState =
  | {
      success?: boolean;
      message?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "Informe a senha."),
});

export const userSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto."),
  email: z.email("Informe um e-mail válido."),
  password: z
    .string()
    .min(10, "A senha deve ter ao menos 10 caracteres.")
    .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
    .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula.")
    .regex(/[0-9]/, "A senha deve conter ao menos um número."),
  role: z.nativeEnum(Role),
  forcePasswordChange: z.boolean(),
});

export const firstLoginSchema = z
  .object({
    password: z
      .string()
      .min(10, "A senha deve ter ao menos 10 caracteres.")
      .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
      .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula.")
      .regex(/[0-9]/, "A senha deve conter ao menos um número."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const employeeSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
});

export const punchSchema = z.object({
  employeeId: z.string().min(1, "Selecione a funcionária."),
  workDate: z.iso.date("Informe uma data válida."),
  type: z.nativeEnum(PunchType),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use o formato HH:mm."),
  notes: z.string().trim().max(160, "Máximo de 160 caracteres.").optional(),
});

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
