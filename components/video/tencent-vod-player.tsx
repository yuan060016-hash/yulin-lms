"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  fileId: string;
  appId: string;
  activityId?: string;
  onEnded?: () => void;
  onError?: () => void;
};

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];

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
  const [rate, setRate] = useState(1);
  const [showRates, setShowRates] = useState(false);

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
              maxBufferLength: 30,
            });
            hlsRef.current = hls;
            hls.loadSource(playUrl!);
            hls.attachMedia(video!);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!disposed) {
                video!.playbackRate = rate;
                setStatus("");
              }
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
            video!.playbackRate = rate;
            return;
          }

          setStatus("当前浏览器不支持该视频格式");
          onError?.();
          return;
        }

        video!.src = playUrl!;
        video!.playbackRate = rate;
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
  }, [rate]);

  const changeRate = (value: number) => {
    setRate(value);
    setShowRates(false);
    if (videoRef.current) videoRef.current.playbackRate = value;
  };

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
        controlsList="nodownload"
        disablePictureInPicture
        playsInline
        preload="metadata"
        onLoadedData={() => {
          if (videoRef.current) videoRef.current.playbackRate = rate;
          setStatus("");
        }}
        onCanPlay={() => setStatus("")}
        onWaiting={() => setStatus("缓冲中...")}
        onPlaying={() => setStatus("")}
        onRateChange={() => {
          if (videoRef.current) setRate(videoRef.current.playbackRate);
        }}
        onEnded={() => onEnded?.()}
        onError={() => {
          if (!isHlsUrl(playUrl || "")) {
            setStatus("播放失败，请刷新重试");
            onError?.();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {ready ? (
        <div className="absolute right-3 top-12 z-[3] hidden md:block">
          <div className="relative">
            <button
              type="button"
              className="rounded bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/70"
              onClick={() => setShowRates((v) => !v)}
            >
              倍速 {rate === 1 ? "1.0x" : `${rate}x`}
            </button>
            {showRates ? (
              <div className="absolute right-0 mt-1 min-w-[88px] overflow-hidden rounded-md border border-white/10 bg-black/80 py-1 shadow-lg backdrop-blur-sm">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`block w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/10 ${
                      rate === option ? "bg-white/15 font-semibold" : ""
                    }`}
                    onClick={() => changeRate(option)}
                  >
                    {option === 1 ? "1.0x 正常" : `${option}x`}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {ready && status ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 z-[2] flex justify-center">
          <span className="rounded bg-black/60 px-3 py-1 text-xs text-white">{status}</span>
        </div>
      ) : null}
    </div>
  );
}
