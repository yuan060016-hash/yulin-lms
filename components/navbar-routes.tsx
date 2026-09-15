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

export const NavbarRoutes = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);

  const isTeacherPage = pathname?.startsWith("/teacher");
  const isCoursePage = pathname?.includes("/courses");
  const isSearchPage = pathname === "/search";
  const canTeach = user?.role === "TEACHER";

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  const logout = async () => {
    await axios.post("/api/auth/logout");
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
