import { authMainService } from "@/core/business/auth";
import { ApiError } from "@/core/error/api-error";
import { routeErrorHandler } from "@/core/error/error-hander";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getLessonAccess } from "@/lib/lesson-access";


export const POST = routeErrorHandler(
  async (
    req: Request,
    { params }: { params: { courseId: string; chapterId: string; activityId: string; } }
  ) => {
    const { userId } = await authMainService.getAuthContext({});

    if (!userId) {
      throw new ApiError({
        statusCode: 401,
        message: "Unauthorized",
      })
    }

    const access = await getLessonAccess(userId, params);
    if (!access || !access.available) return NextResponse.json({ message: "课时不存在或已下架" }, { status: 404 });
    if (!access.allowed) return NextResponse.json({ message: "课程尚未开通" }, { status: 403 });
    if (access.activity.type !== "quiz") return NextResponse.json({ message: "此课时不是测验" }, { status: 400 });
    const { isCompleted, quizData } = await req.json();
    if (typeof isCompleted !== "boolean") return NextResponse.json({ message: "完成状态格式不正确" }, { status: 400 });

    const updatedData = await db.userProgress.upsert({
      where: {
        userId_activityId: {
          userId,
          activityId: params.activityId
        }
      },
      create: {
        userId,
        activityId: params.activityId,
        completedAt: isCompleted ? new Date() : null,
        quizAttemptData: JSON.stringify(quizData ?? null)
      },
      update: {
        completedAt: isCompleted ? new Date() : null,
        quizAttemptData: JSON.stringify(quizData ?? null)
      }
    })
    
    return NextResponse.json(updatedData);
  }
)
