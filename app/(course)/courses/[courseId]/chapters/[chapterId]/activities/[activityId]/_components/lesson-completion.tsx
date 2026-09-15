"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function LessonCompletion({ progressUrl, initialCompleted, ended = 0, disabled = false }: {
  progressUrl: string; initialCompleted: boolean; ended?: number; disabled?: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const lastEnded = useRef(0);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted, progressUrl]);

  const save = useCallback(async (isCompleted: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(progressUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "进度保存失败，请重试");
      setCompleted(!!result.isCompleted);
      // Avoid router.refresh() here: it triggers a full RSC reload on Netlify
      // and frequently causes "Connection closed" / Application error.
    } catch (error) {
      setError(error instanceof Error ? error.message : "进度保存失败，请重试");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, [progressUrl]);

  useEffect(() => {
    if (ended > lastEnded.current) {
      lastEnded.current = ended;
      if (!completed) void save(true);
    }
  }, [ended, completed, save]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button variant={completed ? "outline" : "default"} disabled={disabled || saving} onClick={() => save(!completed)}>
        {saving ? "保存中…" : completed ? "已完成 · 取消标记" : "标记为已完成"}
      </Button>
      <span className="text-xs text-slate-500" aria-live="polite">
        {completed ? "学习进度已保存" : disabled ? "视频上线后即可记录学习进度" : "看完视频后自动记录，也可手动标记"}
      </span>
      {error ? <p role="alert" className="w-full text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
