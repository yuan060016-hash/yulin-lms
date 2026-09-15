import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTencentVodPsign } from "@/lib/video/tencent-psign";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  const activityId = searchParams.get("activityId");
  if (!fileId || !activityId) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const activity = await db.chapterActivity.findUnique({
    where: { id: activityId },
    include: {
      chapter: {
        include: {
          course: {
            include: {
              purchases: { where: { userId }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!activity || activity.videoUrl !== fileId || activity.videoProvider !== "tencent-vod") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const course = activity.chapter.course;
  const allowed = course.userId === userId || course.purchases.length > 0;
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID;
  const playKey = process.env.TENCENT_VOD_PLAY_KEY;
  if (!appId || !playKey) {
    return NextResponse.json({ error: "vod not configured" }, { status: 500 });
  }

  const psign = await createTencentVodPsign({ appId, fileId, playKey });

  let playUrl: string | null = null;
  let coverUrl: string | null = null;
  try {
    const infoRes = await fetch(
      `https://playvideo.qcloud.com/getplayinfo/v4/${appId}/${fileId}?psign=${encodeURIComponent(psign)}`,
      { cache: "no-store" }
    );
    const info = await infoRes.json();
    playUrl = info?.media?.originalInfo?.url || null;
    coverUrl = info?.media?.basicInfo?.coverUrl || null;
  } catch {
    // keep psign-only fallback
  }

  return NextResponse.json({ psign, appId, fileId, playUrl, coverUrl });
}
