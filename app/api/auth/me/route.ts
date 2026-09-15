import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const { userId, session } = await auth();
  if (!userId || !session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await db.localUser.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ user });
}
