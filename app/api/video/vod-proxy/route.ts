import { NextResponse } from "next/server";
import { buildSignedVodProxyUrl, verifySignedVodProxyTarget } from "@/lib/video/vod-proxy-sign";

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

function optimizeMasterPlaylist(body: string) {
  if (!body.includes("#EXT-X-STREAM-INF:")) return body;

  // Drop 1080p variants to speed up first paint through proxy.
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes("#EXT-X-STREAM-INF:") &&
      /RESOLUTION=17\d{2}x10\d{2}/i.test(line)
    ) {
      i += 1; // skip this variant + uri line
      continue;
    }
    out.push(line);
  }

  const header: string[] = [];
  const variants: Array<{ info: string; uri: string }> = [];
  for (let i = 0; i < out.length; i++) {
    if (out[i].includes("#EXT-X-STREAM-INF:") && out[i + 1]) {
      variants.push({ info: out[i], uri: out[i + 1] });
      i += 1;
    } else if (variants.length === 0) {
      header.push(out[i]);
    }
  }
  if (variants.length <= 1) return out.join("\n");

  const score = (info: string) => {
    const m = info.match(/RESOLUTION=(\d+)x(\d+)/i);
    if (!m) return 99999;
    const h = Number(m[2]);
    if (h >= 450 && h <= 520) return 1;
    if (h >= 700 && h <= 780) return 2;
    if (h < 450) return 3;
    return 4 + h;
  };
  variants.sort((a, b) => score(a.info) - score(b.info));
  return [...header, ...variants.flatMap((v) => [v.info, v.uri])].join("\n");
}

function rewritePlaylist(body: string, baseUrl: string) {
  const optimized = optimizeMasterPlaylist(body);
  return optimized
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/gi, (_m, uri: string) => {
          try {
            const abs = new URL(uri, baseUrl).toString();
            return `URI="${buildSignedVodProxyUrl(abs)}"`;
          } catch {
            return `URI="${uri}"`;
          }
        });
      }

      try {
        const abs = new URL(trimmed, baseUrl).toString();
        return buildSignedVodProxyUrl(abs);
      } catch {
        return line;
      }
    })
    .join("\n");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("u");
  const exp = searchParams.get("exp");
  const sig = searchParams.get("sig");

  if (!target || !isAllowedVodUrl(target)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (!verifySignedVodProxyTarget(target, exp, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
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

  const upstreamHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "*/*",
  };
  const range = req.headers.get("range");
  if (range) upstreamHeaders.Range = range;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream.toString(), {
      cache: "no-store",
      headers: upstreamHeaders,
    });
  } catch {
    return NextResponse.json({ error: "upstream fetch failed" }, { status: 502 });
  }

  if (!upstreamRes.ok && upstreamRes.status !== 206) {
    return NextResponse.json(
      { error: "upstream status", status: upstreamRes.status },
      { status: 502 }
    );
  }

  const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
  const isPlaylist =
    /\.m3u8($|\?)/i.test(upstream.pathname) ||
    contentType.includes("application/vnd.apple.mpegurl") ||
    contentType.includes("application/x-mpegURL") ||
    contentType.includes("audio/mpegurl");

  if (isPlaylist) {
    const text = await upstreamRes.text();
    const rewritten = rewritePlaylist(text, upstream.toString());
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        "Cache-Control": "public, max-age=15",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const buf = Buffer.from(await upstreamRes.arrayBuffer());
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    "Access-Control-Allow-Origin": "*",
  };
  const contentRange = upstreamRes.headers.get("content-range");
  if (contentRange) headers["Content-Range"] = contentRange;
  if (upstreamRes.status === 206) headers["Accept-Ranges"] = "bytes";

  return new NextResponse(buf, {
    status: upstreamRes.status,
    headers,
  });
}
