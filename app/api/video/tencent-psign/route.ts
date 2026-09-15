import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTencentVodPsign, toHttpsVodPlayUrl } from "@/lib/video/tencent-psign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedPlay = {
  expiresAt: number;
  payload: {
    psign: string;
    appId: string;
    fileId: string;
    playUrl: string | null;
    coverUrl: string | null;
    mode: "adaptive" | "original";
  };
};

const playCache = new Map<string, CachedPlay>();
const CACHE_TTL_MS = 45_000;

async function fetchPlayInfo(appId: string, fileId: string, psign: string) {
  const infoRes = await fetch(
    `https://playvideo.qcloud.com/getplayinfo/v4/${appId}/${fileId}?psign=${encodeURIComponent(psign)}`,
    { cache: "no-store" }
  );
  return infoRes.json();
}

function pickAdaptiveUrl(info: any): string | null {
  return (
    info?.media?.streamingInfo?.plainOutput?.url ||
    info?.media?.adaptiveDynamicStreamingInfo?.adaptiveDynamicStreamingList?.[0]?.url ||
    null
  );
}

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

  const cacheKey = `${userId}:${fileId}:${activityId}`;
  const cached = playCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  }

  const activity = await db.chapterActivity.findUnique({
    where: { id: activityId },
    select: {
      videoUrl: true,
      videoProvider: true,
      chapter: {
        select: {
          course: {
            select: {
              userId: true,
              purchases: { where: { userId }, select: { id: true }, take: 1 },
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

  const preferAdaptive = process.env.TENCENT_VOD_USE_ADAPTIVE !== "false";
  const adaptiveDefinition = Number(process.env.TENCENT_VOD_ADAPTIVE_DEFINITION || "10");

  let playUrl: string | null = null;
  let coverUrl: string | null = null;
  let mode: "adaptive" | "original" = "original";
  let psign = "";

  try {
    if (preferAdaptive) {
      psign = await createTencentVodPsign({
        appId,
        fileId,
        playKey,
        scheme: "HTTPS",
        contentInfo: {
          audioVideoType: "RawAdaptive",
          rawAdaptiveDefinition: adaptiveDefinition,
        },
      });
      const info = await fetchPlayInfo(appId, fileId, psign);
      const adaptiveUrl = pickAdaptiveUrl(info);
      if (info?.code === 0 && adaptiveUrl) {
        playUrl = toHttpsVodPlayUrl(adaptiveUrl, appId);
        coverUrl = info?.media?.basicInfo?.coverUrl || null;
        mode = "adaptive";
      }
    }

    if (!playUrl) {
      mode = "original";
      psign = await createTencentVodPsign({
        appId,
        fileId,
        playKey,
        scheme: "HTTPS",
        contentInfo: { audioVideoType: "Original" },
      });
      const originalInfo = await fetchPlayInfo(appId, fileId, psign);
      playUrl = toHttpsVodPlayUrl(originalInfo?.media?.originalInfo?.url || null, appId);
      coverUrl = originalInfo?.media?.basicInfo?.coverUrl || coverUrl;
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

  const payload = { psign, appId, fileId, playUrl, coverUrl, mode };
  playCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });

  // Prevent unbounded growth in long-lived isolates.
  if (playCache.size > 200) {
    const now = Date.now();
    Array.from(playCache.entries()).forEach(([key, value]) => {
      if (value.expiresAt <= now) playCache.delete(key);
    });
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
