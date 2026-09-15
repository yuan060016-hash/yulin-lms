require("dotenv").config();
const { SignJWT } = require("jose");

async function psign(fileId, contentInfo) {
  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID;
  const playKey = process.env.TENCENT_VOD_PLAY_KEY;
  const now = Math.floor(Date.now() / 1000);
  const expire = now + 3600;
  const secret = new TextEncoder().encode(playKey);
  return new SignJWT({
    appId: Number(appId),
    fileId,
    contentInfo,
    currentTimeStamp: now,
    expireTimeStamp: expire,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
}

async function probe(fileId, contentInfo, label) {
  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID;
  const sign = await psign(fileId, contentInfo);
  const url = `https://playvideo.qcloud.com/getplayinfo/v4/${appId}/${fileId}?psign=${encodeURIComponent(sign)}`;
  const res = await fetch(url);
  const info = await res.json();
  const summary = {
    label,
    code: info.code ?? info.errCode ?? info.codeDesc,
    message: info.message || info.errorMsg || info.codeDesc,
    original: info?.media?.originalInfo?.url ? info.media.originalInfo.url.slice(0, 120) : null,
    adaptive: info?.media?.adaptiveDynamicStreamingInfo || info?.adaptiveStreamingInfo || null,
    transcodeCount: Array.isArray(info?.media?.transcodeInfo?.transcodeList)
      ? info.media.transcodeInfo.transcodeList.length
      : 0,
    transcodeSample: Array.isArray(info?.media?.transcodeInfo?.transcodeList)
      ? info.media.transcodeInfo.transcodeList.slice(0, 2).map((t) => ({
          definition: t.definition,
          height: t.height,
          width: t.width,
          size: t.size,
          url: (t.url || "").slice(0, 100),
        }))
      : null,
    keys: info?.media ? Object.keys(info.media) : Object.keys(info || {}),
  };
  console.log(JSON.stringify(summary, null, 2));
}

(async () => {
  const fileId = "5001834820125101240";
  await probe(fileId, { audioVideoType: "Original" }, "Original");
  await probe(fileId, { audioVideoType: "RawAdaptive", rawAdaptiveDefinition: 10 }, "RawAdaptive-10");
  await probe(fileId, { audioVideoType: "Transcode", transcodeDefinition: 100010 }, "Transcode-100010");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
