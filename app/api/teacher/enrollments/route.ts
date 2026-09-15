import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !(await isTeacher(userId))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courses = await db.course.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, price: true, isPublished: true },
    });

    const enrollments = await db.purchase.findMany({
      where: {
        courseId: { in: courses.map((c) => c.id) },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const students = await db.localUser.findMany({ where: { role: "STUDENT" }, select: { id: true, email: true, name: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ courses, enrollments, students });
  } catch (error) {
    console.log("[TEACHER_ENROLLMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isTeacher(userId))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const studentUserId = String(body.studentUserId || "").trim();
    const courseId = String(body.courseId || "").trim();

    if (!studentUserId || !courseId) {
      return new NextResponse("学员用户ID和课程ID必填", { status: 400 });
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId },
    });
    if (!course) {
      return new NextResponse("课程不存在或无权限", { status: 404 });
    }

    const student = await db.localUser.findUnique({ where: { id: studentUserId }, select: { role: true } });
    if (!student || student.role !== "STUDENT") return new NextResponse("请选择有效的学员账号", { status: 400 });
    const purchase = await db.purchase.upsert({
      where: {
        userId_courseId: {
          userId: studentUserId,
          courseId,
        },
      },
      update: {
        amount: course.price ?? 2980,
      },
      create: {
        userId: studentUserId,
        courseId,
        amount: course.price ?? 2980,
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.log("[TEACHER_ENROLLMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}