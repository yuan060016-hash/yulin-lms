import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLessonAccess, getNextLesson } from "@/lib/lesson-access";
import { resolvePlaybackSource } from "@/lib/video/provider";
import { ActivityVideoPlayer } from "./_components/video-player";
import { LessonCompletion } from "./_components/lesson-completion";
import { CourseNavLink } from "@/components/course-nav-link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ActivityPage({
  params,
}: {
  params: { courseId: string; chapterId: string; activityId: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const access = await getLessonAccess(userId, params);
  if (!access || !access.available) notFound();
  if (!access.allowed) redirect(`/courses/${params.courseId}`);

  const { activity } = access;
  const playback = resolvePlaybackSource({
    provider: activity.videoProvider,
    muxPlaybackId: activity.muxData[0]?.playbackId,
    tencentFileId: activity.videoProvider === "tencent-vod" ? activity.videoUrl : null,
    externalUrl: activity.videoProvider === "external-url" ? activity.videoUrl : null,
  });

  const next = await getNextLesson(params.courseId, {
    id: activity.id,
    chapterId: activity.chapter.id,
    chapterPosition: activity.chapter.position,
    position: activity.position,
  });

  const progressUrl = `/api/courses/${params.courseId}/chapters/${params.chapterId}/activities/${params.activityId}/progress`;
  const completed = !!activity.userProgress[0]?.completedAt;
  const isVideo = String(activity.type || "").toLowerCase() === "video";

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-4">
        <div className="text-xs text-slate-500">{activity.chapter.title}</div>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800">{activity.name}</h1>
      </div>

      {isVideo ? (
        <ActivityVideoPlayer
          key={activity.id}
          provider={playback?.provider}
          playbackId={playback?.playbackId}
          fileId={playback?.fileId}
          activityId={activity.id}
          signedUrl={playback?.signedUrl}
          progressUrl={progressUrl}
          initialCompleted={completed}
        />
      ) : (
        <div className="space-y-4 rounded-lg border bg-white p-6">
          <p className="whitespace-pre-wrap text-sm text-slate-600">
            {activity.textContent || "本节暂无内容"}
          </p>
          <LessonCompletion progressUrl={progressUrl} initialCompleted={completed} />
        </div>
      )}

      {next ? (
        <CourseNavLink
          className="mt-5 block text-sm font-medium text-sky-700 hover:underline"
          href={`/courses/${params.courseId}/chapters/${next.chapterId}/activities/${next.id}`}
        >
          下一节：{next.name} →
        </CourseNavLink>
      ) : null}
    </div>
  );
}
