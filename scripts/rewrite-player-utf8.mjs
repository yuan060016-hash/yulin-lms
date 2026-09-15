import fs from "fs";

const playerPath =
  "D:/codexshipinjiaoxue/LMS-clone/app/(course)/courses/[courseId]/chapters/[chapterId]/activities/[activityId]/_components/video-player.tsx";

const player = `"use client";

import { useCallback, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { CourseWatermark } from "@/components/video/course-watermark";
import { TencentVodPlayer } from "@/components/video/tencent-vod-player";
import { LessonCompletion } from "./lesson-completion";

type Props = {
  activityId?: string;
  playbackId?: string | null;
  fileId?: string | null;
  signedUrl?: string | null;
  provider?: "mux" | "tencent-vod" | "external-url";
  progressUrl?: string;
  initialCompleted?: boolean;
};

export const ActivityVideoPlayer = ({
  playbackId,
  fileId,
  activityId,
  signedUrl,
  provider = "mux",
  progressUrl,
  initialCompleted = false,
}: Props) => {
  const [ended, setEnded] = useState(0);
  const [error, setError] = useState(false);
  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID || "";

  const onEnded = useCallback(() => setEnded((n) => n + 1), []);
  const onError = useCallback(() => setError(true), []);

  const hasVideo =
    (provider === "mux" && !!playbackId) ||
    (provider === "tencent-vod" && !!fileId && !!appId) ||
    (provider === "external-url" && !!signedUrl);

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-900">
        <CourseWatermark />
        {provider === "mux" && playbackId ? (
          <MuxPlayer
            playbackId={playbackId}
            className="h-full w-full"
            onEnded={onEnded}
            onError={onError}
          />
        ) : null}
        {provider === "tencent-vod" && fileId && appId ? (
          <TencentVodPlayer
            fileId={fileId}
            appId={appId}
            activityId={activityId}
            onEnded={onEnded}
            onError={onError}
          />
        ) : null}
        {provider === "external-url" && signedUrl ? (
          <video
            className="h-full w-full"
            src={signedUrl}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            playsInline
            preload="metadata"
            onEnded={onEnded}
            onError={onError}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : null}
        {!hasVideo ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-slate-300">
            本节视频即将上线，请稍后再来学习。
          </div>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          视频暂时无法播放，请刷新重试或联系管理员。
        </p>
      ) : null}
      {progressUrl ? (
        <LessonCompletion
          progressUrl={progressUrl}
          initialCompleted={initialCompleted}
          ended={ended}
          disabled={!hasVideo || error}
        />
      ) : null}
    </div>
  );
};
`;

const wm = `"use client";

type CourseWatermarkProps = {
  text?: string;
};

export const CourseWatermark = ({
  text = "雨林外贸｜仅限购买学员学习",
}: CourseWatermarkProps) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="absolute right-3 top-3 rounded bg-black/35 px-2 py-1 text-xs text-white backdrop-blur-sm">
        {text}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] text-sm font-medium text-white/25 whitespace-nowrap">
        {text}
      </div>
    </div>
  );
};
`;

fs.writeFileSync(playerPath, player, "utf8");
fs.writeFileSync(
  "D:/codexshipinjiaoxue/LMS-clone/components/video/course-watermark.tsx",
  wm,
  "utf8"
);
console.log("utf8 rewrite ok");
