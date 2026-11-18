import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { initialFields } from "@/features/form-builder/form-schema";
import { hashPassword } from "@/features/auth/password";

const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => (jar.has(key) ? { value: jar.get(key) } : undefined),
    set: (key: string, value: string) => jar.set(key, value),
  }),
}));
const directory = mkdtempSync(path.join(tmpdir(), "aqary-test-"));
process.env.DATABASE_URL = `file:${directory}/test.db`;
const { db } = await import("@/lib/db");
const auth = await import("@/app/api/auth/login/route");
const logout = await import("@/app/api/auth/logout/route");
const schema = await import("@/app/api/form-schema/route");
const leads = await import("@/app/api/leads/route");
const detail = await import("@/app/api/leads/[id]/route");
function request(route: string, method = "GET", body?: unknown) {
  return new Request(`http://localhost${route}`, {
    method,
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      : {}),
  });
}
async function login(role: string) {
  jar.clear();
  const result = await auth.POST(
    request("/api/auth/login", "POST", {
      email: `${role}@aqary.demo`,
      password: "test-password",
    }),
  );
  expect(result.status).toBe(200);
}
const values = {
  name: "Persistence Test",
  email: "persist@example.com",
  status: "New",
  budget: 850000,
  preferred_location: "Dubai Marina",
};
beforeAll(async () => {
  const migration = readFileSync(
    path.resolve("prisma/migrations/20261117131527_init/migration.sql"),
    "utf8",
  );
  for (const sql of migration.split(";").filter((sql) => sql.trim()))
    await db.$executeRawUnsafe(sql);
  await db.formSchema.create({ data: { id: "lead", fields: initialFields } });
  for (const role of ["ADMIN", "AGENT"] as const)
    await db.user.create({
      data: {
        name: role,
        role,
        email: `${role.toLowerCase()}@aqary.demo`,
        passwordHash: hashPassword("test-password"),
      },
    });
});
afterAll(async () => {
  await db.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});
describe("real route handlers, sessions and SQLite", () => {
  it("returns 401 when unauthenticated and 403 on an Agent direct schema write", async () => {
    jar.clear();
    expect((await leads.GET(request("/api/leads"))).status).toBe(401);
    expect((await schema.GET()).status).toBe(401);
    expect(
      (
        await schema.PUT(
          request("/api/form-schema", "PUT", { fields: initialFields }),
        )
      ).status,
    ).toBe(401);
    await login("agent");
    expect((await schema.GET()).status).toBe(200);
    expect(
      (
        await schema.PUT(
          request("/api/form-schema", "PUT", { fields: initialFields }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await leads.POST(request("/api/leads", "POST", { values }))).status,
    ).toBe(201);
  });
  it("enforces persisted visibility rules, ignores client schema, and reports stable field error keys", async () => {
    await login("admin");
    const invalid = await leads.POST(
      request("/api/leads", "POST", { values: { ...values, status: "Lost" } }),
    );
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).errors.loss_reason).toBeTruthy();
    expect(
      (await leads.POST(request("/api/leads", "POST", { values, fields: [] })))
        .status,
    ).toBe(422);
    expect(
      (await leads.POST(request("/api/leads", "POST", { values }))).status,
    ).toBe(201);
    expect(
      (
        await detail.GET(request("/api/leads/missing"), {
          params: Promise.resolve({ id: "missing" }),
        })
      ).status,
    ).toBe(404);
  });
  it("retains dynamic values through renaming, reordering, deletion and a fresh database connection", async () => {
    const created = await leads.POST(request("/api/leads", "POST", { values }));
    const id = (await created.json()).data.id;
    const context = { params: Promise.resolve({ id }) };
    const renamed = [...initialFields]
      .reverse()
      .map((f) =>
        f.id === "preferred_location" ? { ...f, label: "Area of interest" } : f,
      );
    expect(
      (
        await schema.PUT(
          request("/api/form-schema", "PUT", { fields: renamed }),
        )
      ).status,
    ).toBe(200);
    expect((await schema.GET()).status).toBe(200);
    const updated = await detail.PUT(
      request(`/api/leads/${id}`, "PUT", {
        values: { ...values, name: "Updated Test" },
      }),
      context,
    );
    expect((await updated.json()).data.values.preferred_location).toBe(
      "Dubai Marina",
    );
    const removed = renamed.filter((f) => f.id !== "preferred_location");
    expect(
      (
        await schema.PUT(
          request("/api/form-schema", "PUT", { fields: removed }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await detail.PUT(
          request(`/api/leads/${id}`, "PUT", {
            values: {
              name: "Updated Again",
              email: values.email,
              status: "Contacted",
              budget: 850000,
            },
          }),
          context,
        )
      ).status,
    ).toBe(200);
    const fresh = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
    });
    try {
      const persisted = await fresh.lead.findUniqueOrThrow({ where: { id } });
      expect(persisted.values).toMatchObject({
        preferred_location: "Dubai Marina",
        name: "Updated Again",
      });
      expect(
        (await fresh.formSchema.findUniqueOrThrow({ where: { id: "lead" } }))
          .fields,
      ).toEqual(removed);
    } finally {
      await fresh.$disconnect();
    }
    expect(
      (
        await schema.PUT(
          request("/api/form-schema", "PUT", { fields: initialFields }),
        )
      ).status,
    ).toBe(200);
  });
  it("preserves old values for a hidden field, even when a client submits a replacement", async () => {
    const response = await leads.POST(
      request("/api/leads", "POST", {
        values: { ...values, status: "Lost", loss_reason: "Original reason" },
      }),
    );
    const id = (await response.json()).data.id;
    const updated = await detail.PUT(
      request(`/api/leads/${id}`, "PUT", {
        values: { ...values, loss_reason: "Tampered hidden value" },
      }),
      { params: Promise.resolve({ id }) },
    );
    expect((await updated.json()).data.values.loss_reason).toBe(
      "Original reason",
    );
  });
  it("searches name OR email and filters before paginating with an accurate total", async () => {
    const response = await leads.GET(
      request(
        "/api/leads?search=persist%40example.com&status=New&page=1&pageSize=1",
      ),
    );
    const body = await response.json();
    expect(body.total).toBeGreaterThan(1);
    expect(body.data).toHaveLength(1);
    const none = await leads.GET(
      request("/api/leads?search=no-match&status=Lost&page=1&pageSize=1"),
    );
    expect((await none.json()).total).toBe(0);
  });
  it("rejects ancient dates in direct create and update requests without changing stored values", async () => {
    await login("admin");
    const fields = [
      ...initialFields,
      { id: "visit", type: "date", label: "Visit", required: true },
    ];
    expect(
      (await schema.PUT(request("/api/form-schema", "PUT", { fields }))).status,
    ).toBe(200);
    try {
      const invalid = await leads.POST(
        request("/api/leads", "POST", {
          values: { ...values, visit: "0002-02-12" },
        }),
      );
      expect(invalid.status).toBe(422);
      expect((await invalid.json()).errors.visit).toBe(
        "Enter a valid date between 1970 and 9999.",
      );
      const created = await leads.POST(
        request("/api/leads", "POST", {
          values: { ...values, visit: "2099-02-12" },
        }),
      );
      expect(created.status).toBe(201);
      const id = (await created.json()).data.id;
      const context = { params: Promise.resolve({ id }) };
      const updated = await detail.PUT(
        request(`/api/leads/${id}`, "PUT", {
          values: { ...values, visit: "0002-02-12" },
        }),
        context,
      );
      expect(updated.status).toBe(422);
      const persisted = await detail.GET(request(`/api/leads/${id}`), context);
      expect((await persisted.json()).data.values.visit).toBe("2099-02-12");
    } finally {
      await schema.PUT(
        request("/api/form-schema", "PUT", { fields: initialFields }),
      );
    }
  });
  it("SCHEMA-05: removing property_type retains Apartment in raw SQLite after a later lead edit", async () => {
    await login("admin");
    const original = await db.formSchema.findUniqueOrThrow({
      where: { id: "lead" },
    });
    const propertyField = {
      id: "property_type",
      type: "dropdown",
      label: "Property type",
      required: false,
      options: ["Apartment", "Villa"],
    };
    const fields = [...initialFields, propertyField];
    const saveSchema = await schema.PUT(
      request("/api/form-schema", "PUT", { fields }),
    );
    expect(saveSchema.status).toBe(200);
    try {
      const created = await leads.POST(
        request("/api/leads", "POST", {
          values: {
            ...values,
            name: "SCHEMA-05 Test",
            property_type: "Apartment",
          },
        }),
      );
      expect(created.status).toBe(201);
      const id = (await created.json()).data.id;

      function inspectStoredValues() {
        // A new native SQLite connection bypasses the API, Prisma, and UI caches.
        const sqlite = new DatabaseSync(path.join(directory, "test.db"), {
          readOnly: true,
        });
        try {
          const raw = sqlite
            .prepare('SELECT "values" FROM "Lead" WHERE "id" = ?')
            .get(id)?.values;
          if (typeof raw !== "string")
            throw new Error("Expected persisted Lead.values JSON");
          return JSON.parse(raw);
        } finally {
          sqlite.close();
        }
      }

      expect(inspectStoredValues()).toMatchObject({
        property_type: "Apartment",
      });
      const removed = await schema.PUT(
        request("/api/form-schema", "PUT", { fields: initialFields }),
      );
      expect(removed.status).toBe(200);
      const active = (await (await schema.GET()).json()).data.fields;
      expect(
        active.some((field: { id: string }) => field.id === "property_type"),
      ).toBe(false);
      expect(inspectStoredValues()).toMatchObject({
        property_type: "Apartment",
      });

      // Editing with only the active fields must not erase a removed field either.
      const updated = await detail.PUT(
        request(`/api/leads/${id}`, "PUT", {
          values: { ...values, name: "SCHEMA-05 Updated" },
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(updated.status).toBe(200);
      const persisted = inspectStoredValues();
      expect(persisted).toMatchObject({
        name: "SCHEMA-05 Updated",
        property_type: "Apartment",
      });
      console.info(
        "SCHEMA-05 SQLite evidence:",
        JSON.stringify({
          activeSchemaContainsPropertyType: false,
          storedValues: {
            name: persisted.name,
            property_type: persisted.property_type,
          },
        }),
      );
    } finally {
      await schema.PUT(
        request("/api/form-schema", "PUT", { fields: original.fields }),
      );
    }
  });
  it("rejects malformed schema and expired, forged or revoked sessions", async () => {
    expect(
      (await schema.PUT(request("/api/form-schema", "PUT", { fields: [] })))
        .status,
    ).toBe(422);
    const token = jar.get("aqary_session")!;
    expect(
      (await logout.POST(request("/api/auth/logout", "POST"))).status,
    ).toBe(200);
    jar.set("aqary_session", token);
    expect((await schema.GET()).status).toBe(401);
    await login("admin");
    await db.session.updateMany({ data: { expiresAt: new Date(0) } });
    expect((await schema.GET()).status).toBe(401);
    jar.set("aqary_session", "a".repeat(64));
    expect((await schema.GET()).status).toBe(401);
  });
});
