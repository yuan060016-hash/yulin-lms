import crypto from "crypto";

function getProxySecret() {
  return (
    process.env.VOD_PROXY_SIGNING_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.TENCENT_VOD_PLAY_KEY ||
    ""
  );
}

export function signVodProxyTarget(targetUrl: string, ttlSeconds = 60 * 60 * 6) {
  const secret = getProxySecret();
  if (!secret) {
    throw new Error("missing proxy signing secret");
  }
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${exp}.${targetUrl}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return { exp, sig };
}

export function buildSignedVodProxyUrl(targetUrl: string, proxyBase = "/api/video/vod-proxy") {
  const { exp, sig } = signVodProxyTarget(targetUrl);
  return `${proxyBase}?u=${encodeURIComponent(targetUrl)}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
}

export function verifySignedVodProxyTarget(targetUrl: string, expRaw: string | null, sigRaw: string | null) {
  const secret = getProxySecret();
  if (!secret || !expRaw || !sigRaw) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000) - 30) return false;
  const payload = `${exp}.${targetUrl}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const got = decodeURIComponent(sigRaw);
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
