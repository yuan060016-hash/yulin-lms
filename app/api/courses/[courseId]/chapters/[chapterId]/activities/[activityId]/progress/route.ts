import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLessonAccess } from "@/lib/lesson-access";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request, { params }: {
  params: { courseId: string; chapterId: string; activityId: string };
}) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "请先登录" }, { status: 401 });
  const access = await getLessonAccess(userId, params);
  if (!access || !access.available) return NextResponse.json({ message: "课时不存在或已下架" }, { status: 404 });
  if (!access.allowed) return NextResponse.json({ message: "课程尚未开通" }, { status: 403 });
  const input = z.object({ isCompleted: z.boolean() }).strict().safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "学习进度格式不正确" }, { status: 400 });
  const completedAt = input.data.isCompleted ? new Date() : null;
  const progress = await db.userProgress.upsert({
    where: { userId_activityId: { userId, activityId: params.activityId } },
    create: { userId, activityId: params.activityId, completedAt },
    update: { completedAt },
  });
  return NextResponse.json({ isCompleted: !!progress.completedAt });
}
