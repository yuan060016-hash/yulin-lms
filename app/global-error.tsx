"use client";

import { RecoverableError } from "@/components/recoverable-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50">
        <RecoverableError error={error} reset={reset} title="网站暂时异常" fullScreen />
      </body>
    </html>
  );
}
