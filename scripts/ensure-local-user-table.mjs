import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("prisma/dev.db");
db.exec(`
CREATE TABLE IF NOT EXISTS LocalUser (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
`);
console.log(db.prepare("SELECT name FROM sqlite_master WHERE name='LocalUser'").get());
db.close();
