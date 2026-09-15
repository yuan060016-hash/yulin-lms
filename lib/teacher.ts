import { db } from "@/lib/db";

export const isTeacher = async (userId?: string | null) => {
  if (!userId) return false;
  const user = await db.localUser.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "TEACHER";
};
