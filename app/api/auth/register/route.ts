import { NextResponse } from "next/server";
import { createLocalUser, findUserByEmail } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || password.length < 8) {
      return NextResponse.json({ message: "邮箱必填，密码至少8位" }, { status: 400 });
    }

    const exists = await findUserByEmail(email);
    if (exists) {
      return NextResponse.json({ message: "该邮箱已注册" }, { status: 400 });
    }

    const user = await createLocalUser({
      email,
      password,
      name,
      role: "STUDENT",
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      message: "注册成功，请等待管理员开通课程",
    });
  } catch (error) {
    console.log("[REGISTER]", error);
    return NextResponse.json({ message: "注册失败" }, { status: 500 });
  }
}
