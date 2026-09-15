"use client";

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
