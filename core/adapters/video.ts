export type { PlaybackSource, VideoProviderName } from "@/lib/video/provider";
export { resolvePlaybackSource } from "@/lib/video/provider";

// Upload / delete / signed playback helpers will be implemented per provider.
// Keep Mux-specific logic out of page components when migrating to Tencent VOD.