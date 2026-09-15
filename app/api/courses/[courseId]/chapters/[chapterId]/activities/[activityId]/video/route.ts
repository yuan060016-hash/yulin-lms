import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { mainActivityService } from "@/core/business/activity";
import { routeErrorHandler } from "@/core/error/error-hander";
import { NextResponse } from "next/server";
import { z } from "zod";

export const POST = routeErrorHandler(async (req: Request, { params }: {
  params: { courseId: string; chapterId: string; activityId: string };
}) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "请先登录" }, { status: 401 });
  if (!(await isTeacher(userId))) return NextResponse.json({ message: "仅管理员可以绑定视频" }, { status: 403 });
  const input = z.object({ videoUrl: z.string().url().max(4096), provider: z.enum(["external-url", "mux"]).default("mux") })
    .safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "请输入有效的视频地址" }, { status: 400 });
  const url = new URL(input.data.videoUrl);
  const localTest = process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !localTest) || url.username || url.password) {
    return NextResponse.json({ message: "请使用 HTTPS 视频地址（本地开发可使用 localhost）" }, { status: 400 });
  }
  const activity = await db.chapterActivity.findFirst({ where: {
    id: params.activityId, type: "video", chapterId: params.chapterId,
    chapter: { courseId: params.courseId, course: { userId } },
  } });
  if (!activity) return NextResponse.json({ message: "视频课时不存在或无管理权限" }, { status: 404 });
  if (input.data.provider === "mux") {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return NextResponse.json({ message: "尚未配置 Mux，请使用测试视频地址" }, { status: 400 });
    }
    await mainActivityService.updateActivityVideo({ ...params, userId, videoUrl: input.data.videoUrl });
  }
  await db.chapterActivity.update({ where: { id: activity.id }, data: { videoUrl: input.data.videoUrl, videoProvider: input.data.provider } });
  return NextResponse.json({ ok: true });
});
