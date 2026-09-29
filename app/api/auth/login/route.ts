import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  findUserByEmail,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ message: "请输入邮箱和密码" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    if (!process.env.AUTH_SECRET) {
      return NextResponse.json({ message: "服务配置缺失 AUTH_SECRET" }, { status: 500 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: (user.role as "TEACHER" | "STUDENT") || "STUDENT",
      name: user.name,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    console.log("[LOGIN]", error);
    return NextResponse.json({
      message: "登录失败",
      detail: String(error?.message || error),
    }, { status: 500 });
  }
}
