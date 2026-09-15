import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// NOTE: Run this BEFORE switching DATABASE_URL to Postgres,
// while still pointing at sqlite file:./dev.db
const db = new PrismaClient();

async function main() {
  const outDir = path.join(process.cwd(), "data");
  fs.mkdirSync(outDir, { recursive: true });

  const payload = {
    exportedAt: new Date().toISOString(),
    localUsers: await db.localUser.findMany(),
    categories: await db.category.findMany(),
    courses: await db.course.findMany(),
    chapters: await db.chapter.findMany({ orderBy: { position: "asc" } }),
    activities: await db.chapterActivity.findMany({ orderBy: { position: "asc" } }),
    muxData: await db.muxData.findMany(),
    attachments: await db.attachment.findMany(),
    purchases: await db.purchase.findMany(),
    userProgress: await db.userProgress.findMany(),
    learningPlans: await db.learningPlan.findMany(),
    learningPlanSteps: await db.learningPlanStep.findMany(),
    learningPlanStepCourses: await db.learningPlanStepCourse.findMany(),
    stripeCustomers: await db.stripeCustomer.findMany(),
  };

  const outPath = path.join(outDir, "sqlite-export.json");
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log("Exported to", outPath);
  console.log({
    users: payload.localUsers.length,
    courses: payload.courses.length,
    chapters: payload.chapters.length,
    activities: payload.activities.length,
    purchases: payload.purchases.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
