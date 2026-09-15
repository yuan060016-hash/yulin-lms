import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { InfoCard } from "./_components/info-card";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
  const { userId, session } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  let { completedCourses, coursesInProgress } = await getDashboardCourses(userId);

  if (completedCourses.length + coursesInProgress.length === 0) {
    const fallback = await db.course.findMany({
      where: {
        isPublished: true,
        OR: [{ userId }, { purchases: { some: { userId } } }],
      },
      include: {
        category: true,
        chapters: { where: { isPublished: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    coursesInProgress = fallback.map((course) => ({
      ...course,
      progress: 0,
    }));
  }

  // Keep both courses visible and sorted with newest first when possible
  const items = [...coursesInProgress, ...completedCourses];
  const mainCourse = items[0];

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">雨林外贸 · 学习中心</h1>
          <p className="mt-1 text-sm text-slate-500">
            当前账号：{session?.email || "已登录"}。登录后学习已开通课程。
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/search">
            <Button variant="outline">课程目录</Button>
          </Link>
          {mainCourse ? (
            <Link href={`/courses/${mainCourse.id}`}>
              <Button className="bg-sky-700 hover:bg-sky-800">继续学习</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard icon={Clock} label="学习中" numberOfItems={coursesInProgress.length} />
        <InfoCard
          icon={CheckCircle}
          label="已完成"
          numberOfItems={completedCourses.length}
          variant="success"
        />
      </div>

      <CoursesList items={items} />
    </div>
  );
}
