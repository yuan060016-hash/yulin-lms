import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CourseIdPage = async ({
  params,
}: {
  params: { courseId: string };
}) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        include: {
          activities: {
            orderBy: { position: "asc" },
            include: { userProgress: { where: { userId }, select: { completedAt: true } } },
          },
        },
      },
      purchases: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!course || (!course.isPublished && course.userId !== userId)) notFound();

  const isPurchased = course.purchases.length > 0 || course.userId === userId;
  const remaining = course.chapters.flatMap(chapter => chapter.activities.map(activity => ({ chapter, activity })))
    .find(item => !item.activity.userProgress[0]?.completedAt);
  const firstChapter = remaining?.chapter || course.chapters[0];
  const firstActivity = remaining?.activity || firstChapter?.activities?.[0];

  // Auto enter first lesson when purchased
  if (isPurchased && firstChapter && firstActivity) {
    redirect(
      `/courses/${course.id}/chapters/${firstChapter.id}/activities/${firstActivity.id}`
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.imageUrl} alt={course.title} className="h-56 w-full object-cover" />
        ) : null}
        <div className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold text-slate-800">{course.title}</h1>
          <p className="text-sm leading-6 text-slate-600">
            {course.description || "外贸实战系统课程，覆盖获客、沟通、成交与风控。"}
          </p>
          <div className="text-sm text-slate-500">课程价格：¥{course.price ?? 2980}</div>
          {isPurchased ? (
            firstChapter && firstActivity ? (
              <Link href={`/courses/${course.id}/chapters/${firstChapter.id}/activities/${firstActivity.id}`}>
                <Button className="bg-sky-700 hover:bg-sky-800">开始学习</Button>
              </Link>
            ) : (
              <p className="text-sm text-amber-700">课程已开通，但还没有课时内容。</p>
            )
          ) : (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              本课程需管理员开通后学习，请联系雨林外贸老师。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseIdPage;
