"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface CourseEnrollButtonProps {
  price: number;
  courseId: string;
}

export const CourseEnrollButton = ({ price }: CourseEnrollButtonProps) => {
  return (
    <Button size="sm" className="w-full md:w-auto" variant="secondary" disabled>
      需开通 · {formatPrice(price)}
    </Button>
  );
};