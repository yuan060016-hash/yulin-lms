"use client";

import { Banner } from "@/components/banner";
import { formatPrice } from "@/lib/format";

interface CourseEnrollBannerProps {
  price: number;
  courseId: string;
}

export const CourseEnrollBanner = ({ price }: CourseEnrollBannerProps) => {
  return (
    <Banner
      variant="warning"
      label={`本课程需管理员开通后学习（课程价格 ${formatPrice(price)}）。请联系雨林外贸老师开通账号权限。`}
    />
  );
};