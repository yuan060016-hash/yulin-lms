import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapping = JSON.parse(
  readFileSync(join(__dirname, "../data/tencent-vod-fileids.json"), "utf8")
);
const db = new PrismaClient();

function normalize(s = "") {
  return s
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/\s+/g, "")
    .toLowerCase();
}

async function main() {
  const course = await db.course.findFirst({
    where: { title: { contains: "雨林" } },
    include: {
      chapters: {
        orderBy: { position: "asc" },
        include: { activities: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!course) throw new Error("未找到雨林课程");

  const byPosition = new Map(mapping.map((m) => [m.position, m]));
  let updated = 0;
  for (const chapter of course.chapters) {
    const item = byPosition.get(chapter.position);
    const activity = chapter.activities[0];
    if (!item || !activity) {
      console.log("SKIP", chapter.position, chapter.title);
      continue;
    }
    await db.chapterActivity.update({
      where: { id: activity.id },
      data: {
        videoProvider: "tencent-vod",
        videoUrl: item.fileId,
        updatedAt: new Date(),
      },
    });
    updated += 1;
    console.log(`OK ${chapter.position} ${chapter.title} -> ${item.fileId}`);
  }
  console.log(`updated=${updated}/${course.chapters.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
