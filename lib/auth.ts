import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "@/lib/session";
export { SESSION_COOKIE, createSessionToken } from "@/lib/session";

export async function hashPassword(password: string) { return bcrypt.hash(password, 10); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export const auth = cache(async () => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return { userId: null as string | null, session: null as SessionPayload | null };
  }
  const session = await verifySessionToken(token);
  if (!session?.userId) {
    return { userId: null as string | null, session: null as SessionPayload | null };
  }
  const user = await db.localUser.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!user || (user.role !== "TEACHER" && user.role !== "STUDENT")) {
    return { userId: null as string | null, session: null as SessionPayload | null };
  }
  return {
    userId: user.id,
    session: { ...session, email: user.email, role: user.role, name: user.name } as SessionPayload,
  };
});

export async function findUserByEmail(email: string) {
  return db.localUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function createLocalUser(input: {
  email: string;
  password: string;
  name?: string;
  role?: "TEACHER" | "STUDENT";
}) {
  const passwordHash = await hashPassword(input.password);
  return db.localUser.create({
    data: {
      email: input.email.trim().toLowerCase(),
      passwordHash,
      name: input.name || null,
      role: input.role || "STUDENT",
      updatedAt: new Date(),
    },
  });
}
