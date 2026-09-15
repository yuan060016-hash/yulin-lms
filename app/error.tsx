"use client";

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-slate-800">页面加载异常</h2>
      <p className="text-sm text-slate-600">
        网络波动或服务暂时不可用，请重试。如果反复出现，请刷新整个页面。
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          重试
        </button>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          返回首页
        </button>
      </div>
      {process.env.NODE_ENV === "development" && error?.message ? (
        <p className="mt-2 break-all text-xs text-slate-400">{error.message}</p>
      ) : null}
    </div>
  );
}
