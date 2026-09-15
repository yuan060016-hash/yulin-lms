"use client";

import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "./search-input";

type MeUser = {
  id: string;
  email: string;
  role: string;
  name?: string | null;
};

let cachedUser: MeUser | null | undefined = undefined;
let inflight: Promise<MeUser | null> | null = null;

async function fetchMe(force = false): Promise<MeUser | null> {
  if (!force && cachedUser !== undefined) return cachedUser;
  if (!force && inflight) return inflight;

  inflight = axios
    .get("/api/auth/me")
    .then((res) => {
      const nextUser = (res.data?.user as MeUser | null) || null;
      cachedUser = nextUser;
      return nextUser;
    })
    .catch(() => {
      cachedUser = null;
      return null;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export const NavbarRoutes = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(cachedUser ?? null);

  const isTeacherPage = pathname?.startsWith("/teacher");
  const isCoursePage = pathname?.includes("/courses");
  const isSearchPage = pathname === "/search";
  const canTeach = user?.role === "TEACHER";

  useEffect(() => {
    let alive = true;
    fetchMe(false).then((me) => {
      if (alive) setUser(me);
    });
    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {}
    cachedUser = null;
    setUser(null);
    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <>
      {isSearchPage && (
        <div className="hidden md:block">
          <SearchInput />
        </div>
      )}
      <div className="flex items-center gap-x-2 ml-auto">
        {isTeacherPage || isCoursePage ? (
          <Link href="/">
            <Button size="sm" variant="ghost">
              <LogOut className="h-4 w-4 mr-2" />
              返回学习中心
            </Button>
          </Link>
        ) : canTeach ? (
          <Link href="/teacher/courses">
            <Button size="sm" variant="ghost">
              管理后台
            </Button>
          </Link>
        ) : null}

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 md:inline">{user.email}</span>
            <Button size="sm" variant="outline" onClick={logout}>
              退出
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
};
