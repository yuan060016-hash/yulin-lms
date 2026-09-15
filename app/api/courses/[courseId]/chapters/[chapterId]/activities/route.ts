import Mux from "@mux/mux-node";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { authMainService } from "@/core/business/auth";
import { ApiError } from "@/core/error/api-error";
import { mainActivityService } from "@/core/business/activity";
import { routeErrorHandler } from "@/core/error/error-hander";
import { z } from "zod";


export const POST = routeErrorHandler(
  async (
    req: Request,
    { params }: { params: { courseId: string; chapterId: string; } }
  ) => {
    const { userId } = await authMainService.getAuthContext({});
    const parsed = z.object({ name: z.string().trim().min(1).max(200), type: z.enum(["video", "text", "quiz"]) }).strict()
      .safeParse(await req.json().catch(() => null));

    if (!userId) {
      throw new ApiError({
        statusCode: 401,
        message: "Unauthorized",
      })
    }

    if (!parsed.success) return NextResponse.json({ message: "课时信息格式不正确" }, { status: 400 });
    const res = await mainActivityService.createActivity({
      ...parsed.data,
      userId,
      courseId: params.courseId,
      chapterId: params.chapterId,
    })
    
    return NextResponse.json(res);
  }
)
