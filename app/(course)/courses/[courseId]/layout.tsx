import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NavbarRoutes } from "@/components/navbar-routes";
import { CourseProgress } from "@/components/course-progress";
import { CourseNavLink } from "@/components/course-nav-link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CourseLayout({ children, params }: {
  children: React.ReactNode; params: { courseId: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const course = await db.course.findUnique({ where: { id: params.courseId }, include: {
    purchases: { where: { userId }, select: { id: true } },
    chapters: { where: { isPublished: true }, orderBy: { position: "asc" }, select: {
      id: true, title: true, activities: { orderBy: { position: "asc" }, select: {
        id: true, name: true, userProgress: { where: { userId }, select: { completedAt: true } },
      } },
    } },
  } });
  if (!course || (!course.isPublished && course.userId !== userId)) notFound();
  const canLearn = course.userId === userId || course.purchases.length > 0;
  const activities = course.chapters.flatMap(c => c.activities);
  const completedCount = activities.filter(a => !!a.userProgress[0]?.completedAt).length;
  const progress = activities.length ? completedCount / activities.length * 100 : 0;
  const directory = <div className="space-y-3 p-4">
    <Link href={`/courses/${course.id}`} className="block font-semibold text-slate-800">{course.title}</Link>
    {canLearn ? <>
      <p className="text-xs text-slate-500">已完成 {completedCount} / {activities.length} 节</p>
      <CourseProgress value={progress} size="sm" />
      <nav aria-label="课程目录" className="space-y-1">
        {course.chapters.map(chapter => <div key={chapter.id}>
          {chapter.activities.map((activity, index) => <CourseNavLink key={activity.id}
            href={`/courses/${course.id}/chapters/${chapter.id}/activities/${activity.id}`}
            className="flex items-start gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-800">
            <span aria-label={activity.userProgress[0]?.completedAt ? "已完成" : "未完成"} className="text-emerald-700">{activity.userProgress[0]?.completedAt ? "✓" : "○"}</span>
            <span className="flex-1">{index === 0 ? chapter.title : activity.name}</span>
          </CourseNavLink>)}
        </div>)}
      </nav>
    </> : <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">请联系管理员开通后学习</p>}
  </div>;
  return <div className="min-h-screen bg-slate-50">
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b bg-white px-4 md:pl-80"><NavbarRoutes /></header>
    <aside className="fixed inset-y-0 left-0 hidden w-80 overflow-y-auto border-r bg-white pt-16 md:block">{directory}</aside>
    <main className="pt-16 md:pl-80">
      <details className="border-b bg-white md:hidden"><summary className="cursor-pointer p-4 text-sm font-medium">课程目录 · {canLearn ? `${completedCount}/${activities.length} 已完成` : "待开通"}</summary>{directory}</details>
      {children}
    </main>
  </div>;
}
