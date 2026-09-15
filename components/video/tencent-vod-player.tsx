"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    TCPlayer?: any;
  }
}

type Props = {
  fileId: string;
  appId: string;
  activityId?: string;
  onEnded?: () => void;
  onError?: () => void;
};

export function TencentVodPlayer({ fileId, appId, activityId, onEnded, onError }: Props) {
  const reactId = useId().replace(/:/g, "");
  const videoId = `tcplayer-${reactId}`;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("正在获取播放地址...");
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

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
          { cache: "no-store" }
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
      } catch {
        if (!disposed) {
          setStatus("视频加载失败，请刷新重试");
          onError?.();
        }
      }
    }

    setup();
    return () => {
      disposed = true;
    };
  }, [fileId, appId, activityId, onError]);

  return (
    <div className="relative h-full w-full bg-slate-900">
      {!ready || !playUrl ? (
        <div className="absolute inset-0 z-[1] flex items-center justify-center px-4 text-center text-sm text-slate-300">
          {status}
        </div>
      ) : null}
      {playUrl ? (
        <video
          ref={videoRef}
          id={videoId}
          className="h-full w-full"
          src={playUrl}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          preload="metadata"
          onLoadedData={() => setStatus("")}
          onWaiting={() => setStatus("缓冲中...")}
          onPlaying={() => setStatus("")}
          onEnded={() => onEnded?.()}
          onError={() => {
            setStatus("播放失败，请刷新重试");
            onError?.();
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : null}
      {ready && status ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 z-[2] flex justify-center">
          <span className="rounded bg-black/60 px-3 py-1 text-xs text-white">{status}</span>
        </div>
      ) : null}
    </div>
  );
}
