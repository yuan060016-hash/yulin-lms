import { SignJWT } from "jose";

export async function createTencentVodPsign(input: {
  appId: string;
  fileId: string;
  playKey: string;
  expireSeconds?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const expire = now + (input.expireSeconds ?? 60 * 60 * 6);
  const secret = new TextEncoder().encode(input.playKey);

  return new SignJWT({
    appId: Number(input.appId),
    fileId: input.fileId,
    contentInfo: {
      audioVideoType: "Original",
    },
    currentTimeStamp: now,
    expireTimeStamp: expire,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
}
