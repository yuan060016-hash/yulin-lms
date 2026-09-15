export type VideoProviderName = "mux" | "tencent-vod" | "external-url";

export type PlaybackSource = {
  provider: VideoProviderName;
  /** Mux playback id */
  playbackId?: string | null;
  /** Tencent VOD file id (for later) */
  fileId?: string | null;
  /** Temporary signed/external URL (never expose long-lived raw MP4 in UI) */
  signedUrl?: string | null;
  posterUrl?: string | null;
};

/**
 * Video adapter boundary.
 * Phase 1: Mux / placeholder.
 * Phase 2: replace with Tencent Cloud VOD + official web player.
 */
export function resolvePlaybackSource(input: {
  provider?: string | null;
  muxPlaybackId?: string | null;
  tencentFileId?: string | null;
  externalUrl?: string | null;
}): PlaybackSource | null {
  const preferred = (input.provider || process.env.NEXT_PUBLIC_VIDEO_PROVIDER || "mux") as VideoProviderName;

  if (preferred === "external-url" && input.externalUrl) {
    return { provider: "external-url", signedUrl: input.externalUrl };
  }

  if (preferred === "tencent-vod" && input.tencentFileId) {
    return {
      provider: "tencent-vod",
      fileId: input.tencentFileId,
    };
  }

  if (input.muxPlaybackId) {
    return {
      provider: "mux",
      playbackId: input.muxPlaybackId,
    };
  }

  if (input.externalUrl) {
    return {
      provider: "external-url",
      signedUrl: input.externalUrl,
    };
  }

  return null;
}
