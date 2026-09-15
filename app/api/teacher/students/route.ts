import { NextResponse } from "next/server";
import { auth, createLocalUser, findUserByEmail } from "@/lib/auth";
import { isTeacher } from "@/lib/teacher";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isTeacher(userId))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || password.length < 8) {
      return new NextResponse("邮箱和密码（至少8位）必填", { status: 400 });
    }

    const exists = await findUserByEmail(email);
    if (exists) {
      return new NextResponse("该邮箱已存在", { status: 400 });
    }

    const user = await createLocalUser({
      email,
      password,
      name,
      role: "STUDENT",
    });

    return NextResponse.json({
      id: user.id,
      email,
      message: "学员账号已创建",
    });
  } catch (error: any) {
    console.log("[TEACHER_CREATE_STUDENT]", error);
    return new NextResponse(error?.message || "创建学员失败", { status: 500 });
  }
}
