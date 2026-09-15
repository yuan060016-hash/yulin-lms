import { NextResponse } from "next/server";

export async function POST() {
  return new NextResponse(
    JSON.stringify({
      message: "在线支付暂未开放，请联系管理员开通课程权限。",
    }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}