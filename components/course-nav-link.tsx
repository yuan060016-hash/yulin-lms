"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function CourseNavLink({ href, children, className }: Props) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const active = pathname === href;

  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      aria-busy={pending || undefined}
      className={[
        className || "",
        active ? "bg-sky-50 text-sky-800" : "",
        pending ? "opacity-70" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return;
        }

        // Prefer hard navigation to avoid flaky Next.js RSC soft navigations on mobile networks.
        event.preventDefault();
        setPending(true);
        window.location.assign(href);
      }}
    >
      {children}
      {pending ? <span className="ml-auto text-[10px] text-sky-600">加载中</span> : null}
    </Link>
  );
}
