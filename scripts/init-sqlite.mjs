import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve('prisma/dev.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new DatabaseSync(dbPath);
db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE Category (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE Course (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  imageUrl TEXT,
  price REAL,
  isPublished INTEGER NOT NULL DEFAULT 0,
  categoryId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  lastIndexedAt DATETIME,
  FOREIGN KEY (categoryId) REFERENCES Category(id)
);
CREATE TABLE Chapter (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  videoUrl TEXT,
  position INTEGER NOT NULL,
  isPublished INTEGER NOT NULL DEFAULT 0,
  isFree INTEGER NOT NULL DEFAULT 0,
  courseId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
);
CREATE TABLE Attachment (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  chapterId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (chapterId) REFERENCES Chapter(id) ON DELETE CASCADE
);
CREATE TABLE ChapterActivity (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  videoUrl TEXT,
  position INTEGER NOT NULL,
  textContent TEXT,
  quizData TEXT,
  chapterId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (chapterId) REFERENCES Chapter(id) ON DELETE CASCADE
);
CREATE TABLE MuxData (
  id TEXT PRIMARY KEY NOT NULL,
  assetId TEXT NOT NULL,
  playbackId TEXT,
  activityId TEXT,
  FOREIGN KEY (activityId) REFERENCES ChapterActivity(id) ON DELETE CASCADE
);
CREATE TABLE UserProgress (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  activityId TEXT,
  videoLastWatchedAt DATETIME,
  quizAttemptData TEXT,
  completedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (activityId) REFERENCES ChapterActivity(id) ON DELETE CASCADE,
  UNIQUE(userId, activityId)
);
CREATE TABLE Purchase (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  amount REAL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE,
  UNIQUE(userId, courseId)
);
CREATE TABLE StripeCustomer (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL UNIQUE,
  stripeCustomerId TEXT NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE TABLE LearningPlan (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE TABLE LearningPlanStep (
  id TEXT PRIMARY KEY NOT NULL,
  description TEXT NOT NULL,
  position INTEGER NOT NULL,
  learningPlanId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (learningPlanId) REFERENCES LearningPlan(id) ON DELETE CASCADE
);
CREATE TABLE LearningPlanStepCourse (
  id TEXT PRIMARY KEY NOT NULL,
  learningPlanStepId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (learningPlanStepId) REFERENCES LearningPlanStep(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE,
  UNIQUE(learningPlanStepId, courseId)
);
`);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(tables);
db.close();
console.log('OK', dbPath);
