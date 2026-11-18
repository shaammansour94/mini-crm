import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/features/auth/password";
import {
  initialFields,
  statuses,
} from "../src/features/form-builder/form-schema";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});
async function seed() {
  for (const role of ["ADMIN", "AGENT"] as const) {
    const email = `${role.toLowerCase()}@aqary.demo`;
    await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: role === "ADMIN" ? "Demo Admin" : "Demo Agent",
        role,
        passwordHash: hashPassword("AqaryDemo2026!"),
      },
    });
  }
  await db.formSchema.upsert({
    where: { id: "lead" },
    update: {},
    create: { id: "lead", fields: initialFields },
  });
  const names = [
    "Sara Ahmed",
    "Omar Hassan",
    "Maya Ali",
    "Adam Noor",
    "Lina Khalid",
    "Youssef Saleh",
    "Nour Ibrahim",
    "Zain Malik",
    "Hana Saeed",
    "Rami Faris",
    "Leila Hamdan",
    "Amir Nasser",
    "Dina Adel",
    "Kareem Sami",
    "Salma Rashid",
    "Tariq Jamal",
    "Mariam Aziz",
    "Faisal Omar",
    "Reem Khalil",
    "Samir Amin",
    "Aya Zayed",
    "Hassan Said",
    "Dana Salem",
    "Ali Mansour",
  ];
  for (const [i, name] of names.entries()) {
    const status = statuses[i % 4];
    const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;
    const budget = 650000 + i * 25000;
    await db.lead.upsert({
      where: { id: `demo-lead-${i + 1}` },
      update: {},
      create: {
        id: `demo-lead-${i + 1}`,
        name,
        email,
        status,
        budget,
        createdAt: new Date(
          `2026-11-${String(16 - Math.floor(i / 4)).padStart(2, "0")}T09:00:00Z`,
        ),
        values: {
          name,
          email,
          status,
          budget,
          preferred_location: [
            "Dubai Marina",
            "Downtown Dubai",
            "Business Bay",
          ][i % 3],
          ...(status === "Lost"
            ? { loss_reason: "Budget no longer available" }
            : {}),
        },
      },
    });
  }
  console.log(
    `Seed verified: ${await db.user.count()} users, ${await db.lead.count()} leads, ${await db.formSchema.count()} form schema.`,
  );
}
seed().finally(() => db.$disconnect());
