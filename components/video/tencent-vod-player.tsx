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

const CSS_HREF =
  "https://web.sdk.qcloud.com/player/tcplayer/release/v4.9.1/tcplayer.min.css";
const JS_SRC =
  "https://web.sdk.qcloud.com/player/tcplayer/release/v4.9.1/tcplayer.v4.9.1.min.js";

function loadCss(href: string) {
  if (document.querySelector(`link[data-tcplayer="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-tcplayer", href);
  document.head.appendChild(link);
}

function loadScript(src: string) {
  const existing = document.querySelector(`script[data-tcplayer="${src}"]`) as
    | HTMLScriptElement
    | null;
  if (existing) {
    if (window.TCPlayer) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("TCPlayer load failed")));
    });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-tcplayer", src);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TCPlayer load failed"));
    document.body.appendChild(script);
  });
}

export function TencentVodPlayer({ fileId, appId, activityId, onEnded, onError }: Props) {
  const reactId = useId().replace(/:/g, "");
  const videoId = `tcplayer-${reactId}`;
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"loading" | "html5" | "tcplayer">("loading");
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let player: any = null;

    async function setup() {
      try {
        let psign: string | undefined;
        let url: string | null = null;

        if (activityId) {
          const res = await fetch(
            `/api/video/tencent-psign?fileId=${encodeURIComponent(fileId)}&activityId=${encodeURIComponent(activityId)}`
          );
          if (!res.ok) throw new Error("psign failed");
          const data = await res.json();
          psign = data.psign;
          url = data.playUrl || null;
        }

        if (disposed) return;

        // Prefer HTTPS play URL for stable browser playback on Netlify.
        if (url && /^https:/i.test(url)) {
          setPlayUrl(url);
          setMode("html5");
          setReady(true);
          return;
        }

        loadCss(CSS_HREF);
        await loadScript(JS_SRC);
        if (disposed || !window.TCPlayer) return;

        setMode("tcplayer");
        player = window.TCPlayer(videoId, {
          fileID: fileId,
          appID: appId,
          psign,
          autoplay: false,
          controls: true,
          preload: "auto",
          languages: "zh-CN",
        });
        player.on("loadedmetadata", () => {
          if (!disposed) setReady(true);
        });
        player.on("ended", () => onEnded?.());
        player.on("error", () => onError?.());
        setTimeout(() => {
          if (!disposed) setReady(true);
        }, 1200);
        playerRef.current = player;
      } catch {
        onError?.();
      }
    }

    setup();

    return () => {
      disposed = true;
      try {
        player?.dispose?.();
      } catch {}
      playerRef.current = null;
    };
  }, [fileId, appId, activityId, videoId, onEnded, onError]);

  if (mode === "html5" && playUrl) {
    return (
      <div className="relative h-full w-full">
        <video
          className="h-full w-full"
          src={playUrl}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          preload="auto"
          onEnded={() => onEnded?.()}
          onError={() => onError?.()}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!ready ? (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-slate-900 text-sm text-slate-300">
          视频加载中...
        </div>
      ) : null}
      <video
        id={videoId}
        className="h-full w-full"
        playsInline
        webkit-playsinline="true"
        preload="auto"
      />
    </div>
  );
}
