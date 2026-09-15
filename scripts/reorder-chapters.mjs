import { PrismaClient } from "@prisma/client";
import { CURRICULUM } from "./curriculum.mjs";
const db = new PrismaClient();
function normalize(name) {
  return name.toLowerCase().replace(/^(?:第\d+节\s*|\d+(?:\.\d+)*\s+)/, "")
    .replace(/[\s/／与]/g, "").replace(/（/g, "(").replace(/）/g, ")");
}
async function main() {
  const courses = await db.course.findMany({
    where: { title: "雨林外贸实战课程" },
    include: { chapters: { include: { activities: true } } },
  });
  if (courses.length !== 1) throw new Error("需要唯一的雨林外贸实战课程，未修改数据");
  const course = courses[0];
  const used = new Set();
  const updates = CURRICULUM.map((lesson, index) => {
    const matches = course.chapters.filter(ch =>
      !used.has(ch.id) && [ch.title, ...ch.activities.map(a => a.name)]
        .some(name => normalize(name) === normalize(lesson.title)));
    if (matches.length !== 1) throw new Error(`课时匹配不唯一：${lesson.title}，未修改数据`);
    const chapter = matches[0];
    used.add(chapter.id);
    return { lesson, chapter, position: index + 1 };
  });
  if (used.size !== course.chapters.length) throw new Error("存在课表外章节，未修改数据");
  await db.$transaction(async tx => {
    for (const { lesson, chapter, position } of updates) {
      await tx.chapter.update({ where: { id: chapter.id }, data: {
        title: `${lesson.number} ${lesson.title}`, position,
      } });
      // Preserve IDs, video bindings, progress and existing descriptions.
      for (const activity of chapter.activities) {
        if (normalize(activity.name) === normalize(lesson.title)) {
          await tx.chapterActivity.update({ where: { id: activity.id }, data: { name: lesson.title } });
        }
      }
    }
  });
  for (const { lesson, position } of updates) console.log(`${position}. ${lesson.number} ${lesson.title}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
