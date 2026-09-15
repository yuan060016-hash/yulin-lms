"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  error?: Error & { digest?: string };
  reset: () => void;
  title?: string;
  fullScreen?: boolean;
};

export function RecoverableError({
  error,
  reset,
  title = "页面加载异常",
  fullScreen = false,
}: Props) {
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const autoTried = useRef(false);

  const hardReload = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(Date.now()));
    window.location.replace(url.toString());
  };

  const softOrHardRetry = () => {
    setRetrying(true);
    setAttempt((n) => n + 1);
    try {
      reset();
    } catch {
      hardReload();
      return;
    }
    window.setTimeout(() => {
      const text = document.body?.innerText || "";
      if (text.includes("页面加载异常") || text.includes("网站暂时异常")) {
        hardReload();
      } else {
        setRetrying(false);
      }
    }, 1800);
  };

  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const key = "yulin_error_auto_retry";
    const last = Number(sessionStorage.getItem(key) || "0");
    const now = Date.now();
    if (now - last < 12000) return;
    sessionStorage.setItem(key, String(now));
    const timer = window.setTimeout(() => softOrHardRetry(), 500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={
        fullScreen
          ? "mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center"
          : "mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 p-8 text-center"
      }
    >
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="text-sm leading-6 text-slate-600">
        手机网络波动时可能暂时打不开。系统正在自动重试，你也可以手动刷新。
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          disabled={retrying}
          onClick={softOrHardRetry}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {retrying ? "重试中…" : "重试"}
        </button>
        <button
          type="button"
          onClick={hardReload}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          刷新页面
        </button>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          返回首页
        </button>
      </div>
      {attempt > 0 ? <p className="text-xs text-slate-400">已自动尝试 {attempt} 次</p> : null}
      {process.env.NODE_ENV === "development" && error?.message ? (
        <p className="mt-2 break-all text-xs text-slate-400">{error.message}</p>
      ) : null}
    </div>
  );
}
