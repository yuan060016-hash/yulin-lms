import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CURRICULUM } from "./curriculum.mjs";

const db = new PrismaClient();
const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Smoke tests must target localhost");
const tag = randomUUID();
const users = [];
let courseId;
let categoryId;
let keep = false;
const password = randomBytes(20).toString("base64url");
async function request(path, { cookie = "", method = "GET", body, status = 200 } = {}) {
  const response = await fetch(base + path, { method, redirect: "manual", headers: { Cookie: cookie, "Content-Type": "application/json" }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text();
  assert((Array.isArray(status) ? status : [status]).includes(response.status), `${method} ${path}: expected ${status}, got ${response.status}; ${text.slice(0, 250)}`);
  let data; try { data = JSON.parse(text); } catch {}
  return { response, text, data };
}
async function login(email) {
  const { response } = await request("/api/auth/login", { method: "POST", body: { email, password } });
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert(cookie?.startsWith("yulin_session="));
  return cookie;
}
try {
  assert(process.env.SMOKE_VIDEO_URL, "Set SMOKE_VIDEO_URL to a public test MP4 URL");
  const actual = await db.course.findFirst({ where: { title: "雨林外贸实战课程" }, include: { chapters: { orderBy: { position: "asc" } } } });
  assert.deepEqual(actual.chapters.map(c => c.title), CURRICULUM.map(c => `${c.number} ${c.title}`));
  console.log("PASS curriculum: 13 modules / 15 lessons, Facebook 5.1–5.3");
  const teacher = await db.localUser.create({ data: { email: `smoke-teacher-${tag}@example.invalid`, passwordHash: await bcrypt.hash(password, 10), role: "TEACHER", name: "临时验收管理员" } });
  users.push(teacher.id);
  const teacherCookie = await login(teacher.email);
  const students = [];
  for (const role of ["enrolled", "blocked"]) {
    const email = `smoke-${role}-${tag}@example.invalid`;
    const { data } = await request("/api/teacher/students", { cookie: teacherCookie, method: "POST", body: { email, password, name: `临时验收学员-${role}` } });
    users.push(data.id); students.push({ id: data.id, email, cookie: await login(email) });
  }
  const [student, blocked] = students;
  await request("/api/teacher/enrollments", { status: 401 });
  await request("/api/teacher/enrollments", { cookie: blocked.cookie, status: 401 });
  await request("/api/courses", { cookie: blocked.cookie, method: "POST", body: { title: "禁止创建" }, status: 403 });
  const teacherPage = await request("/teacher/students", { cookie: teacherCookie });
  assert(teacherPage.text.includes("学员开通"));
  const deniedAdmin = await request("/teacher/students", { cookie: blocked.cookie, status: [200, 307] });
  assert(deniedAdmin.text.includes("NEXT_REDIRECT") && !deniedAdmin.text.includes("最近开通记录"));
  const created = await request("/api/courses", { cookie: teacherCookie, method: "POST", body: { title: `临时视频验收-${tag}` } });
  courseId = created.data.id;
  const cat = await db.category.create({ data: { name: `smoke-${tag}` } }); categoryId = cat.id;
  await request(`/api/courses/${courseId}`, { cookie: teacherCookie, method: "PATCH", body: { description: "仅用于本次自动验收", price: 2980, imageUrl: "/logo.svg", categoryId } });
  const chapters = [];
  for (let i = 1; i <= 2; i++) {
    const { data: chapter } = await request(`/api/courses/${courseId}/chapters`, { cookie: teacherCookie, method: "POST", body: { title: `测试课时 ${i}` } });
    const { data: activity } = await request(`/api/courses/${courseId}/chapters/${chapter.id}/activities`, { cookie: teacherCookie, method: "POST", body: { name: `测试视频 ${i}`, type: "video" } });
    chapters.push({ ...chapter, activity });
    await request(`/api/courses/${courseId}/chapters/${chapter.id}/activities/${activity.id}/video`, { cookie: teacherCookie, method: "POST", body: { videoUrl: process.env.SMOKE_VIDEO_URL, provider: "external-url" } });
    await request(`/api/courses/${courseId}/chapters/${chapter.id}/publish`, { cookie: teacherCookie, method: "PATCH" });
  }
  await request(`/api/courses/${courseId}/publish`, { cookie: teacherCookie, method: "PATCH" });
  await request("/api/teacher/enrollments", { cookie: teacherCookie, method: "POST", body: { studentUserId: "missing-account", courseId }, status: 400 });
  await request("/api/teacher/enrollments", { cookie: teacherCookie, method: "POST", body: { studentUserId: student.id, courseId } });
  const a = chapters[0];
  const path = `/courses/${courseId}/chapters/${a.id}/activities/${a.activity.id}`;
  const api = `/api${path}/progress`;
  await request(api, { method: "POST", body: { isCompleted: true }, status: 401 });
  await request(api, { cookie: blocked.cookie, method: "POST", body: { isCompleted: true }, status: 403 });
  const denied = await request(path, { cookie: blocked.cookie, status: [200, 307] });
  assert(!denied.text.includes(process.env.SMOKE_VIDEO_URL));
  await request(`/api/courses/${courseId}/chapters/${chapters[1].id}/activities/${a.activity.id}/progress`, { cookie: student.cookie, method: "POST", body: { isCompleted: true }, status: 404 });
  await request(api, { cookie: student.cookie, method: "POST", body: { isCompleted: "true" }, status: 400 });
  await request(`/api${path}/quiz-completion`, { cookie: student.cookie, method: "POST", body: { isCompleted: true, quizData: {} }, status: 400 });
  await request(`/api${path}/video`, { cookie: student.cookie, method: "POST", body: { videoUrl: process.env.SMOKE_VIDEO_URL, provider: "external-url" }, status: 403 });
  await request(`/api/courses/${courseId}/chapters/${a.id}/activities`, { cookie: student.cookie, method: "POST", body: { name: "spoof", type: "video", userId: teacher.id }, status: 400 });
  console.log("PASS teacher/student login, create course/chapter/video, enrollment and access boundaries");
  const page = await request(path, { cookie: student.cookie });
  assert(page.text.includes('controlsList="nodownload"'));
  assert(page.text.includes(process.env.SMOKE_VIDEO_URL));
  assert(page.text.includes("雨林外贸｜仅限购买学员学习"));
  await request(api, { cookie: student.cookie, method: "POST", body: { isCompleted: true } });
  const progress = await db.userProgress.findUnique({ where: { userId_activityId: { userId: student.id, activityId: a.activity.id } } });
  assert(progress.completedAt);
  const refreshed = await request(path, { cookie: student.cookie });
  assert(refreshed.text.includes("50"));
  assert(refreshed.text.includes("已完成 · 取消标记"));
  const dashboard = await request("/", { cookie: student.cookie });
  assert(dashboard.text.includes("50"));
  const resume = await request(`/courses/${courseId}`, { cookie: student.cookie, status: [200, 307] });
  assert(resume.text.includes(chapters[1].activity.id));
  await request(api, { cookie: student.cookie, method: "POST", body: { isCompleted: false } });
  await request(api, { cookie: student.cookie, method: "POST", body: { isCompleted: false } });
  await db.chapter.update({ where: { id: a.id }, data: { isPublished: false } });
  await request(api, { cookie: student.cookie, method: "POST", body: { isCompleted: true }, status: 404 });
  const unpublished = await request(path, { cookie: student.cookie, status: [200, 404] });
  assert(!unpublished.text.includes(process.env.SMOKE_VIDEO_URL));
  await db.chapter.update({ where: { id: a.id }, data: { isPublished: true } });
  await db.course.update({ where: { id: courseId }, data: { isPublished: false } });
  await request(api, { cookie: student.cookie, method: "POST", body: { isCompleted: true }, status: 404 });
  await db.course.update({ where: { id: courseId }, data: { isPublished: true } });
  console.log("PASS saved completion survives reload, 50% calculation, resume link, undo, unpublished restrictions");
  await db.localUser.update({ where: { id: teacher.id }, data: { role: "STUDENT" } });
  await request("/api/teacher/enrollments", { cookie: teacherCookie, status: 401 });
  await db.localUser.update({ where: { id: teacher.id }, data: { role: "TEACHER" } });
  if (process.argv.includes("--keep-for-ui")) {
    fs.mkdirSync("backups", { recursive: true });
    fs.writeFileSync("backups/smoke-ui.json", JSON.stringify({ courseId, categoryId, users, teacherEmail: teacher.email, studentEmail: student.email, password, path, chapters }, null, 2));
    keep = true;
    console.log("PASS fixture ready for browser verification; cleanup required afterwards");
  }
} finally {
  if (!keep) {
    if (courseId) await db.course.delete({ where: { id: courseId } });
    if (categoryId) await db.category.delete({ where: { id: categoryId } });
    await db.localUser.deleteMany({ where: { id: { in: users } } });
    console.log("Temporary smoke data cleaned up");
  }
  await db.$disconnect();
}
