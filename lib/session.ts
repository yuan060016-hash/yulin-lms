import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "yulin_session";

export type SessionPayload = {
  userId: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  name?: string | null;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("缺少 AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    const userId = String(payload.userId || "");
    const email = String(payload.email || "");
    const role = (String(payload.role || "STUDENT") as "TEACHER" | "STUDENT");
    const name = payload.name ? String(payload.name) : null;
    if (!userId || !email || (role !== "TEACHER" && role !== "STUDENT")) return null;
    return { userId, email, role, name };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
