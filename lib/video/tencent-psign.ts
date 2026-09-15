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

/** Rewrite custom/http VOD hosts to the stable HTTPS default host. */
export function toHttpsVodPlayUrl(playUrl: string | null | undefined, appId: string) {
  if (!playUrl) return null;
  try {
    const url = new URL(playUrl);
    // Custom domain currently has no working HTTPS certificate.
    if (
      url.hostname === "vod.yfxshowers.com" ||
      url.hostname.endsWith(".vod-qcloud.com") ||
      url.protocol === "http:"
    ) {
      url.protocol = "https:";
      url.hostname = `${appId}.vod-qcloud.com`;
    }
    return url.toString();
  } catch {
    return playUrl.replace(/^http:\/\//i, "https://");
  }
}
