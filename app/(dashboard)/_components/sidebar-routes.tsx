"use client";

import { BarChart, Compass, Layout, List, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarItem } from "./sidebar-item";

const guestRoutes = [
  {
    icon: Layout,
    label: "学习中心",
    href: "/",
  },
  {
    icon: Compass,
    label: "课程目录",
    href: "/search",
  },
];

const teacherRoutes = [
  {
    icon: List,
    label: "课程管理",
    href: "/teacher/courses",
  },
  {
    icon: Users,
    label: "学员开通",
    href: "/teacher/students",
  },
  {
    icon: BarChart,
    label: "数据概览",
    href: "/teacher/analytics",
  },
];

export const SidebarRoutes = () => {
  const pathname = usePathname();
  const isTeacherPage = pathname?.includes("/teacher");
  const routes = isTeacherPage ? teacherRoutes : guestRoutes;

  return (
    <div className="flex flex-col w-full">
      {routes.map((route) => (
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
        />
      ))}
    </div>
  );
};
