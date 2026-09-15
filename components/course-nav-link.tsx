"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

function preferHardNavigation() {
  if (typeof window === "undefined") return false;
  // Mobile / touch networks are flaky with Next soft RSC navigations on Netlify.
  return window.matchMedia("(max-width: 768px), (hover: none)").matches;
}

export function CourseNavLink({ href, children, className }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHard, setPendingHard] = useState(false);
  const [pendingSoft, startTransition] = useTransition();
  const active = pathname === href;
  const pending = pendingHard || pendingSoft;

  return (
    <Link
      href={href}
      prefetch={!preferHardNavigation()}
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
        if (preferHardNavigation()) {
          setPendingHard(true);
          window.location.assign(href);
          return;
        }

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
