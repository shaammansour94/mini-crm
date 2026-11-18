import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getFormSchema } from "@/features/form-builder/form-schema.service";
import {
  isFieldVisible,
  leadValuesInput,
  statuses,
  validateLeadValues,
  type LeadValues,
} from "@/features/form-builder/form-schema";

const listInput = z.object({
  search: z.string().max(200).default(""),
  status: z.enum(statuses).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(5),
});
export async function listLeads(params: URLSearchParams) {
  const { search, status, page, pageSize } = listInput.parse(
    Object.fromEntries(params),
  );
  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {}),
  };
  const [data, total] = await db.$transaction([
    db.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.lead.count({ where }),
  ]);
  return { data, total, page, pageSize };
}
export async function getLead(id: string) {
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) throw new HttpError(404, "Lead not found.");
  return lead;
}
export async function saveLead(input: unknown, id?: string) {
  const { values: submitted } = z
    .strictObject({ values: leadValuesInput })
    .parse(input);
  const existing = id ? await getLead(id) : null;
  const { fields } = await getFormSchema();
  const errors = validateLeadValues(fields, submitted);
  if (Object.keys(errors).length)
    throw new HttpError(422, "Please check the highlighted fields.", errors);
  const values: LeadValues = existing
    ? leadValuesInput.parse(existing.values)
    : {};
  // Ignore hidden/unknown submitted fields; keep their old values when editing.
  for (const field of fields) {
    if (!isFieldVisible(field, submitted)) continue;
    const value = submitted[field.id];
    values[field.id] =
      value === undefined || value === "" || value === null
        ? null
        : field.type === "number"
          ? Number(value)
          : typeof value === "string"
            ? value.trim()
            : value;
  }
  const data = {
    name: String(values.name),
    email: String(values.email),
    status: String(values.status),
    budget: values.budget == null ? null : Number(values.budget),
    values,
  };
  return id
    ? db.lead.update({ where: { id }, data })
    : db.lead.create({ data });
}
