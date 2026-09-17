import { SignJWT } from "jose";

export type TencentContentInfo = {
  audioVideoType: "Original" | "RawAdaptive" | "Transcode" | "ProtectedAdaptive";
  rawAdaptiveDefinition?: number;
  transcodeDefinition?: number;
  imageSpriteDefinition?: number;
};

export async function createTencentVodPsign(input: {
  appId: string;
  fileId: string;
  playKey: string;
  expireSeconds?: number;
  contentInfo?: TencentContentInfo;
  playDomain?: string;
  scheme?: "HTTP" | "HTTPS" | "Default";
}) {
  const now = Math.floor(Date.now() / 1000);
  const expire = now + (input.expireSeconds ?? 60 * 60 * 6);
  const secret = new TextEncoder().encode(input.playKey);

  const contentInfo: TencentContentInfo = input.contentInfo ?? {
    audioVideoType: "Original",
  };

  const payload: Record<string, unknown> = {
    appId: Number(input.appId),
    fileId: input.fileId,
    contentInfo,
    currentTimeStamp: now,
    expireTimeStamp: expire,
  };

  const urlAccessInfo: Record<string, string> = {};
  if (input.scheme) urlAccessInfo.scheme = input.scheme;
  if (input.playDomain) urlAccessInfo.domain = input.playDomain;
  if (Object.keys(urlAccessInfo).length > 0) {
    payload.urlAccessInfo = urlAccessInfo;
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
}

/** Prefer working HTTP custom-domain origin after arrears recovery. */
export function toHttpCustomVodUrl(playUrl: string | null | undefined) {
  if (!playUrl) return null;
  try {
    const url = new URL(playUrl);
    if (
      url.hostname === "vod.yfxshowers.com" ||
      url.hostname.endsWith(".vod-qcloud.com") ||
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      url.protocol = "http:";
      url.hostname = "vod.yfxshowers.com";
    }
    return url.toString();
  } catch {
    return playUrl.replace(/^https:\/\//i, "http://");
  }
}

/**
 * Rewrite VOD hosts for browser playback.
 * - proxy: same-origin HTTPS proxy (works while custom-domain cert is broken / default HTTPS down)
 * - direct: attempt HTTPS custom/default host
 */
export function toHttpsVodPlayUrl(
  playUrl: string | null | undefined,
  appId: string,
  options?: { mode?: "proxy" | "direct"; proxyBase?: string }
) {
  if (!playUrl) return null;
  const mode = options?.mode || (process.env.TENCENT_VOD_PLAY_MODE as "proxy" | "direct") || "proxy";
  const httpUrl = toHttpCustomVodUrl(playUrl);
  if (!httpUrl) return null;

  if (mode === "proxy") {
    const proxyBase = options?.proxyBase || "/api/video/vod-proxy";
    return `${proxyBase}?u=${encodeURIComponent(httpUrl)}`;
  }

  try {
    const url = new URL(httpUrl);
    url.protocol = "https:";
    // Keep custom domain once certificate is fixed.
    if (process.env.NEXT_PUBLIC_TENCENT_VOD_PLAY_DOMAIN) {
      url.hostname = process.env.NEXT_PUBLIC_TENCENT_VOD_PLAY_DOMAIN;
    } else {
      url.hostname = `${appId}.vod-qcloud.com`;
    }
    return url.toString();
  } catch {
    return httpUrl.replace(/^http:\/\//i, "https://");
  }
}
