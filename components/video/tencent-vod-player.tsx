"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  fileId: string;
  appId: string;
  activityId?: string;
  onEnded?: () => void;
  onError?: () => void;
};

function isHlsUrl(url: string) {
  return /\.m3u8($|\?)/i.test(url);
}

export function TencentVodPlayer({ fileId, appId, activityId, onEnded, onError }: Props) {
  const reactId = useId().replace(/:/g, "");
  const videoId = `tcplayer-${reactId}`;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("正在获取播放地址...");
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();

    async function setup() {
      try {
        if (!activityId) {
          setStatus("缺少课程权限参数");
          onError?.();
          return;
        }

        setStatus("正在获取播放地址...");
        const res = await fetch(
          `/api/video/tencent-psign?fileId=${encodeURIComponent(fileId)}&activityId=${encodeURIComponent(activityId)}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!res.ok) throw new Error("psign failed");
        const data = await res.json();
        if (disposed) return;

        const url = data.playUrl as string | null;
        if (!url) {
          setStatus("暂未拿到可播放地址");
          onError?.();
          return;
        }

        setPlayUrl(url);
        setStatus("视频缓冲中，请稍候...");
        setReady(true);
      } catch (error) {
        if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
        setStatus("视频加载失败，请刷新重试");
        onError?.();
      }
    }

    setup();
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [fileId, appId, activityId, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playUrl) return;

    let disposed = false;
    setStatus("视频缓冲中，请稍候...");

    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }

    async function attach() {
      try {
        if (isHlsUrl(playUrl!)) {
          const HlsModule = await import("hls.js");
          const Hls: any = (HlsModule as any).default || HlsModule;
          if (disposed) return;

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 30,
              maxBufferLength: 18,
              maxMaxBufferLength: 36,
              abrEwmaDefaultEstimate: 600000,
              manifestLoadingTimeOut: 20000,
              levelLoadingTimeOut: 20000,
              fragLoadingTimeOut: 20000,
              fragLoadingMaxRetry: 4,
            });
            hlsRef.current = hls;
            hls.loadSource(playUrl!);
            hls.attachMedia(video!);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!disposed) setStatus("");
            });
            hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
              if (disposed) return;
              if (data?.fatal) {
                setStatus("播放失败，请刷新重试");
                onError?.();
              }
            });
            return;
          }

          if (video!.canPlayType("application/vnd.apple.mpegurl")) {
            video!.src = playUrl!;
            return;
          }

          setStatus("当前浏览器不支持该视频格式");
          onError?.();
          return;
        }

        video!.src = playUrl!;
      } catch {
        if (!disposed) {
          setStatus("播放器初始化失败，请刷新重试");
          onError?.();
        }
      }
    }

    attach();

    return () => {
      disposed = true;
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      if (video) {
        try {
          video.removeAttribute("src");
          video.load();
        } catch {}
      }
    };
  }, [playUrl, onError]);

  return (
    <div className="relative h-full w-full bg-slate-900">
      {!ready || !playUrl ? (
        <div className="absolute inset-0 z-[1] flex items-center justify-center px-4 text-center text-sm text-slate-300">
          {status}
        </div>
      ) : null}
      <video
        ref={videoRef}
        id={videoId}
        className="h-full w-full"
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        playsInline
        preload="metadata"
        onLoadedData={() => setStatus("")}
        onCanPlay={() => setStatus("")}
        onWaiting={() => setStatus("缓冲中...")}
        onPlaying={() => setStatus("")}
        onEnded={() => onEnded?.()}
        onError={() => {
          if (!isHlsUrl(playUrl || "")) {
            setStatus("播放失败，请刷新重试");
            onError?.();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      {ready && status ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 z-[2] flex justify-center">
          <span className="rounded bg-black/60 px-3 py-1 text-xs text-white">{status}</span>
        </div>
      ) : null}
    </div>
  );
}
