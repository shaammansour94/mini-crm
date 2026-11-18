import "server-only";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { parseFormDefinition } from "./form-schema";

export async function getFormSchema() {
  const schema = await db.formSchema.findUnique({ where: { id: "lead" } });
  if (!schema)
    throw new HttpError(503, "Database not initialized. Run npm run db:setup.");
  return {
    fields: parseFormDefinition(schema.fields),
    updatedAt: schema.updatedAt.toISOString(),
  };
}
export async function saveFormSchema(input: unknown) {
  let fields;
  try {
    fields = parseFormDefinition(input);
  } catch (error) {
    throw new HttpError(
      422,
      error instanceof Error ? error.message : "Invalid form definition.",
    );
  }
  // A retained field ID always keeps its type. Removal only changes the active schema.
  const previous = await getFormSchema();
  for (const field of fields) {
    const old = previous.fields.find((f) => f.id === field.id);
    if (old && old.type !== field.type)
      throw new HttpError(
        422,
        "Existing field types cannot change. Add a new field instead.",
      );
  }
  const saved = await db.formSchema.update({
    where: { id: "lead" },
    data: { fields },
  });
  return { fields, updatedAt: saved.updatedAt.toISOString() };
}
