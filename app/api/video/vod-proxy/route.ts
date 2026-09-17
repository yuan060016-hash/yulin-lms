import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "vod.yfxshowers.com",
  "1395361200.vod-qcloud.com",
]);

function isAllowedVodUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (ALLOWED_HOSTS.has(url.hostname)) return true;
    if (url.hostname.endsWith(".vod-qcloud.com")) return true;
    if (url.hostname.endsWith(".myqcloud.com")) return true;
    return false;
  } catch {
    return false;
  }
}

function toHttpOrigin(url: URL) {
  if (
    url.hostname === "vod.yfxshowers.com" ||
    url.hostname.endsWith(".vod-qcloud.com")
  ) {
    url.protocol = "http:";
    url.hostname = "vod.yfxshowers.com";
  }
  return url;
}

function rewritePlaylist(body: string, baseUrl: string, proxyPath: string) {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/gi, (_m, uri: string) => {
          try {
            const abs = new URL(uri, baseUrl).toString();
            return `URI="${proxyPath}?u=${encodeURIComponent(abs)}"`;
          } catch {
            return `URI="${uri}"`;
          }
        });
      }

      try {
        const abs = new URL(trimmed, baseUrl).toString();
        return `${proxyPath}?u=${encodeURIComponent(abs)}`;
      } catch {
        return line;
      }
    })
    .join("\n");
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("u");
  if (!target || !isAllowedVodUrl(target)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  let upstream: URL;
  try {
    upstream = toHttpOrigin(new URL(target));
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!isAllowedVodUrl(upstream.toString())) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
    });
  } catch {
    return NextResponse.json({ error: "upstream fetch failed" }, { status: 502 });
  }

  if (!upstreamRes.ok) {
    return NextResponse.json(
      { error: "upstream status", status: upstreamRes.status },
      { status: 502 }
    );
  }

  const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
  const proxyPath = "/api/video/vod-proxy";
  const isPlaylist =
    /\.m3u8($|\?)/i.test(upstream.pathname) ||
    contentType.includes("application/vnd.apple.mpegurl") ||
    contentType.includes("application/x-mpegURL") ||
    contentType.includes("audio/mpegurl");

  if (isPlaylist) {
    const text = await upstreamRes.text();
    const rewritten = rewritePlaylist(text, upstream.toString(), proxyPath);
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        "Cache-Control": "private, max-age=10",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const buf = Buffer.from(await upstreamRes.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
