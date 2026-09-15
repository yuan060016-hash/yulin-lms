import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ChapterPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const chapter = await db.chapter.findFirst({
    where: { id: params.chapterId, courseId: params.courseId,
      OR: [{ isPublished: true, course: { isPublished: true } }, { course: { userId } }],
    },
    include: {
      activities: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  const activity = chapter?.activities?.[0];
  if (activity) {
    redirect(
      `/courses/${params.courseId}/chapters/${params.chapterId}/activities/${activity.id}`
    );
  }

  redirect(`/courses/${params.courseId}`);
};

export default ChapterPage;
