import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTencentVodPsign, toHttpsVodPlayUrl } from "@/lib/video/tencent-psign";

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

  const adaptiveDefinition = Number(process.env.TENCENT_VOD_ADAPTIVE_DEFINITION || "10");

  // Prefer adaptive if available; fall back to original.
  let psign = await createTencentVodPsign({
    appId,
    fileId,
    playKey,
    scheme: "HTTPS",
    contentInfo: {
      audioVideoType: "RawAdaptive",
      rawAdaptiveDefinition: adaptiveDefinition,
    },
  });

  let playUrl: string | null = null;
  let coverUrl: string | null = null;
  let mode: "adaptive" | "original" = "adaptive";

  try {
    const infoRes = await fetch(
      `https://playvideo.qcloud.com/getplayinfo/v4/${appId}/${fileId}?psign=${encodeURIComponent(psign)}`,
      { cache: "no-store" }
    );
    const info = await infoRes.json();
    const adaptiveUrl =
      info?.media?.adaptiveDynamicStreamingInfo?.adaptiveDynamicStreamingList?.[0]?.url ||
      info?.media?.streamingInfo?.plainOutput?.url ||
      null;
    if (info?.code === 0 && adaptiveUrl) {
      playUrl = toHttpsVodPlayUrl(adaptiveUrl, appId);
      coverUrl = info?.media?.basicInfo?.coverUrl || null;
    } else {
      mode = "original";
      psign = await createTencentVodPsign({
        appId,
        fileId,
        playKey,
        scheme: "HTTPS",
        contentInfo: { audioVideoType: "Original" },
      });
      const originalRes = await fetch(
        `https://playvideo.qcloud.com/getplayinfo/v4/${appId}/${fileId}?psign=${encodeURIComponent(psign)}`,
        { cache: "no-store" }
      );
      const originalInfo = await originalRes.json();
      playUrl = toHttpsVodPlayUrl(originalInfo?.media?.originalInfo?.url || null, appId);
      coverUrl = originalInfo?.media?.basicInfo?.coverUrl || null;
    }
  } catch {
    mode = "original";
    psign = await createTencentVodPsign({
      appId,
      fileId,
      playKey,
      scheme: "HTTPS",
      contentInfo: { audioVideoType: "Original" },
    });
  }

  return NextResponse.json({ psign, appId, fileId, playUrl, coverUrl, mode });
}
