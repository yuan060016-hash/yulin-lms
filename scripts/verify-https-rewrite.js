require("dotenv").config();
const { SignJWT } = require("jose");

function toHttpsVodPlayUrl(playUrl, appId) {
  if (!playUrl) return null;
  const url = new URL(playUrl);
  if (
    url.hostname === "vod.yfxshowers.com" ||
    url.hostname.endsWith(".vod-qcloud.com") ||
    url.protocol === "http:"
  ) {
    url.protocol = "https:";
    url.hostname = `${appId}.vod-qcloud.com`;
  }
  return url.toString();
}

(async () => {
  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID;
  const playKey = process.env.TENCENT_VOD_PLAY_KEY;
  const fileId = "5001834820125101240";
  const now = Math.floor(Date.now() / 1000);
  const psign = await new SignJWT({
    appId: Number(appId),
    fileId,
    contentInfo: { audioVideoType: "Original" },
    currentTimeStamp: now,
    expireTimeStamp: now + 3600,
    urlAccessInfo: { scheme: "HTTPS" },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(new TextEncoder().encode(playKey));
  const info = await fetch(
    `https://playvideo.qcloud.com/getplayinfo/v4/${appId}/${fileId}?psign=${encodeURIComponent(psign)}`
  ).then((r) => r.json());
  const raw = info?.media?.originalInfo?.url;
  const fixed = toHttpsVodPlayUrl(raw, appId);
  console.log({ raw, fixed });
  const head = await fetch(fixed, { method: "HEAD" });
  console.log("HEAD", head.status, head.headers.get("content-type"), head.headers.get("content-length"));
})();
