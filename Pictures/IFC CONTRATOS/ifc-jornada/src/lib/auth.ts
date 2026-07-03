import { Role } from "@prisma/client";
import { addDays, isBefore } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";

import { SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/lib/constants";
import { db } from "@/lib/db";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const sessionToken = hashToken(rawToken);
  const expires = addDays(new Date(), SESSION_DURATION_DAYS);

  await db.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    await db.session.deleteMany({
      where: {
        sessionToken: hashToken(rawToken),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await db.session.findUnique({
    where: {
      sessionToken: hashToken(rawToken),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || isBefore(session.expires, new Date()) || !session.user.isActive) {
    if (session) {
      await db.session.delete({
        where: {
          sessionToken: session.sessionToken,
        },
      });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session.user;
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (roles && !roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
