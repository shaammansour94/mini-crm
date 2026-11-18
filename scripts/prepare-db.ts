import "dotenv/config";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (!url.startsWith("file:") || url === "file::memory:") {
  throw new Error("DATABASE_URL must point to a local SQLite file.");
}
// Prisma's schema engine in this setup needs the database file to exist first.
// Append mode creates an empty file without altering an existing database.
const filename = resolve(url.slice(5));
mkdirSync(dirname(filename), { recursive: true });
closeSync(openSync(filename, "a"));
