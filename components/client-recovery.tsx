"use client";

import { useEffect } from "react";

export function ClientRecovery() {
  useEffect(() => {
    let reloading = false;
    const key = "yulin_recovery_ts";

    const maybeReload = (reason: string) => {
      if (reloading) return;
      const now = Date.now();
      const last = Number(sessionStorage.getItem(key) || "0");
      if (now - last < 15000) return;
      sessionStorage.setItem(key, String(now));
      reloading = true;
      const url = new URL(window.location.href);
      url.searchParams.set("_recovery", reason.slice(0, 24));
      window.location.replace(url.toString());
    };

    const onError = (event: ErrorEvent) => {
      const msg = String(event.message || event.error || "");
      if (/Connection closed|Failed to fetch|Load failed|ChunkLoadError|Loading chunk|fetchServerResponse/i.test(msg)) {
        maybeReload("error");
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = typeof reason === "string" ? reason : String(reason?.message || reason || "");
      if (/Connection closed|Failed to fetch|Load failed|ChunkLoadError|Loading chunk|fetchServerResponse/i.test(msg)) {
        maybeReload("unhandled");
      }
    };

    const onOnline = () => {
      const text = document.body?.innerText || "";
      if (text.includes("页面加载异常") || text.includes("网站暂时异常")) {
        maybeReload("online");
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
