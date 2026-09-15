export default function ActivityLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200" />
      <div className="flex aspect-video w-full items-center justify-center rounded-md bg-slate-900 text-sm text-slate-300">
        正在加载本节课程...
      </div>
      <div className="h-10 w-40 animate-pulse rounded bg-slate-200" />
    </div>
  );
}
