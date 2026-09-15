"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import { formatPrice } from "@/lib/format";
import { CourseProgress } from "@/components/course-progress";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string;
  chaptersLength?: number;
  price: number;
  progress?: number | null;
  category?: string;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  price,
  progress,
  category,
}: CourseCardProps) => {
  const enrolled = progress !== null && progress !== undefined;
  const isFacebook = /facebook/i.test(title) || category === "Facebook获客";
  const isLocal = imageUrl.startsWith("/");
  const href = `/courses/${id}`;

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        window.location.assign(href);
      }}
    >
      <div
        className={`group h-full overflow-hidden rounded-xl border p-3 transition hover:shadow-md ${
          isFacebook ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white"
        }`}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-100">
          <Image
            fill
            className="object-cover"
            alt={title}
            src={imageUrl}
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
            unoptimized={isLocal}
          />
          <div
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${
              isFacebook ? "bg-indigo-600" : "bg-sky-700"
            }`}
          >
            {category || (isFacebook ? "Facebook获客" : "外贸实战")}
          </div>
        </div>
        <div className="flex flex-col pt-2">
          <div className="line-clamp-2 text-base font-medium transition group-hover:text-sky-700 md:text-lg">
            {title}
          </div>
          {chaptersLength ? (
            <div className="my-3 flex items-center gap-x-2 text-xs text-slate-500 md:text-sm">
              <div className="flex items-center gap-x-1">
                <IconBadge size="sm" icon={BookOpen} />
                <span>{chaptersLength} 节课</span>
              </div>
            </div>
          ) : null}
          {enrolled ? (
            <CourseProgress
              variant={progress === 100 ? "success" : "default"}
              size="sm"
              value={progress ?? 0}
            />
          ) : (
            <p className="text-sm font-medium text-slate-700 md:text-base">
              {formatPrice(price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
