"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-800">网站暂时异常</h2>
          <p className="text-sm text-slate-600">请点击重试。如果仍然失败，请关闭页面后重新打开。</p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
