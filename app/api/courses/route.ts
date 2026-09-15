import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export async function POST(
  req: Request,
) {
  try {
    const { userId } = await auth();
    const { title } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!(await isTeacher(userId))) {
      return new NextResponse("仅管理员可以创建课程", { status: 403 });
    }
    if (typeof title !== "string" || !title.trim() || title.length > 200) {
      return new NextResponse("请输入课程名称（最多200字）", { status: 400 });
    }

    const course = await db.course.create({
      data: {
        userId,
        title,
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
