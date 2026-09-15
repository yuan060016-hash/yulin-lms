"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CourseItem = {
  id: string;
  title: string;
  price: number | null;
  isPublished: boolean;
};

type EnrollmentItem = {
  id: string;
  userId: string;
  courseId: string;
  amount: number | null;
  createdAt: string;
};

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<{ id: string; email: string; name: string | null }[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [createdUserId, setCreatedUserId] = useState("");

  const [studentUserId, setStudentUserId] = useState("");
  const [courseId, setCourseId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await axios.get("/api/teacher/enrollments");
      setCourses(res.data.courses || []);
      setStudents(res.data.students || []);
      setEnrollments(res.data.enrollments || []);
      setCourseId(current => current || res.data.courses?.[0]?.id || "");
    } catch {
      toast.error("加载学员开通数据失败");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createStudent = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/teacher/students", {
        email,
        password,
        name,
      });
      setCreatedUserId(res.data.id);
      setStudentUserId(res.data.id);
      toast.success("学员账号已创建");
      setPassword("");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data || "创建学员失败");
    } finally {
      setLoading(false);
    }
  };

  const grantAccess = async () => {
    try {
      setLoading(true);
      await axios.post("/api/teacher/enrollments", {
        studentUserId,
        courseId,
      });
      toast.success("已开通课程权限");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data || "开通失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">学员开通</h1>
        <p className="text-sm text-slate-500 mt-1">
          创建学员账号后，选择学员和课程即可开通学习权限。
        </p>
      </div>

      <section className="rounded-lg border p-5 space-y-4">
        <h2 className="font-medium text-lg">1. 创建学员账号</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="学员姓名（可选）" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="学员邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="初始密码（至少8位）" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button disabled={loading} onClick={createStudent}>创建学员</Button>
        {createdUserId ? (
          <p className="text-xs text-emerald-700 break-all">已创建用户 ID：{createdUserId}</p>
        ) : null}
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h2 className="font-medium text-lg">2. 开通课程权限</h2>
        <select aria-label="选择学员" className="w-full rounded-md border px-3 py-2 text-sm" value={studentUserId} onChange={e => setStudentUserId(e.target.value)}>
          <option value="">选择学员</option>
          {students.map(student => <option key={student.id} value={student.id}>{student.name || "未填写姓名"} · {student.email}</option>)}
        </select>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="">选择课程</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}{course.isPublished ? "" : "（未发布）"}
            </option>
          ))}
        </select>
        <Button disabled={loading || !studentUserId || !courseId} onClick={grantAccess}>
          开通课程
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-3">
        <h2 className="font-medium text-lg">最近开通记录</h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-slate-500">暂无开通记录</p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((item) => {
              const course = courses.find((c) => c.id === item.courseId);
              return (
                <div key={item.id} className="rounded border px-3 py-2 text-sm">
                  <div>学员：{students.find(s => s.id === item.userId)?.email || "历史账号（需核对）"}</div>
                  <div>课程：{course?.title || item.courseId}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
