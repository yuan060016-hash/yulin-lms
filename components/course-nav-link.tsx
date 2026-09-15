"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function CourseNavLink({ href, children, className }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = pathname === href;

  return (
    <Link
      href={href}
      prefetch
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
        event.preventDefault();
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {children}
      {pending ? <span className="ml-auto text-[10px] text-sky-600">加载中</span> : null}
    </Link>
  );
}
