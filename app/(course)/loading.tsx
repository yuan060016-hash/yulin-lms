export default function CourseLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pt-16 md:pl-80">
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="aspect-video w-full animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
