require("dotenv").config();
const { SignJWT } = require("jose");

async function psign(fileId, contentInfo, urlAccessInfo) {
  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID;
  const playKey = process.env.TENCENT_VOD_PLAY_KEY;
  const now = Math.floor(Date.now() / 1000);
  const secret = new TextEncoder().encode(playKey);
  const payload = {
    appId: Number(appId),
    fileId,
    contentInfo,
    currentTimeStamp: now,
    expireTimeStamp: now + 3600,
  };
  if (urlAccessInfo) payload.urlAccessInfo = urlAccessInfo;
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256", typ: "JWT" }).sign(secret);
}

async function probe(label, contentInfo, urlAccessInfo) {
  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID;
  const fileId = "5001834820125101240";
  const sign = await psign(fileId, contentInfo, urlAccessInfo);
  const url = `https://playvideo.qcloud.com/getplayinfo/v4/${appId}/${fileId}?psign=${encodeURIComponent(sign)}`;
  const info = await fetch(url).then((r) => r.json());
  const play = info?.media?.originalInfo?.url || null;
  console.log(JSON.stringify({ label, code: info.code ?? 0, message: info.message, play }, null, 2));
  if (play) {
    try {
      const head = await fetch(play, { method: "HEAD" });
      console.log("HEAD", head.status, head.headers.get("content-type"), head.headers.get("content-length"));
    } catch (e) {
      console.log("HEAD ERR", e.message);
    }
  }
}

(async () => {
  await probe("https-default", { audioVideoType: "Original" }, { scheme: "HTTPS", domain: "Default" });
  await probe("https-custom", { audioVideoType: "Original" }, { scheme: "HTTPS", domain: "vod.yfxshowers.com" });
  await probe("http-custom", { audioVideoType: "Original" }, { scheme: "HTTP", domain: "vod.yfxshowers.com" });
})();
