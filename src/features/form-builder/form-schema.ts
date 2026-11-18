import { z } from "zod";

export const fieldTypes = [
  "text",
  "email",
  "number",
  "dropdown",
  "date",
  "checkbox",
] as const;
export const minimumDate = "1970-01-01";
export const maximumDate = "9999-12-31";
export const statuses = ["New", "Contacted", "Qualified", "Lost"] as const;
export const fieldDefinition = z.strictObject({
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/),
  type: z.enum(fieldTypes),
  label: z.string().trim().min(1).max(120),
  placeholder: z.string().max(200).optional(),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  visibility: z
    .strictObject({ fieldId: z.string(), equals: z.string() })
    .optional(),
});
export type FormField = z.infer<typeof fieldDefinition>;
export type LeadValues = Record<string, string | number | boolean | null>;
export type FieldErrors = Record<string, string>;
export const coreTypes: Record<string, FormField["type"]> = {
  name: "text",
  email: "email",
  status: "dropdown",
  budget: "number",
};
export const initialFields: FormField[] = [
  {
    id: "name",
    type: "text",
    label: "Name",
    required: true,
    placeholder: "Full name",
  },
  {
    id: "email",
    type: "email",
    label: "Email",
    required: true,
    placeholder: "name@example.com",
  },
  {
    id: "status",
    type: "dropdown",
    label: "Status",
    required: true,
    options: [...statuses],
  },
  {
    id: "budget",
    type: "number",
    label: "Budget (AED)",
    required: false,
    placeholder: "e.g. 850000",
  },
  {
    id: "preferred_location",
    type: "text",
    label: "Preferred location",
    required: false,
    placeholder: "e.g. Dubai Marina",
  },
  {
    id: "loss_reason",
    type: "text",
    label: "Loss reason",
    required: true,
    placeholder: "Why was this lead lost?",
    visibility: { fieldId: "status", equals: "Lost" },
  },
];

export function parseFormDefinition(input: unknown): FormField[] {
  const fields = z.array(fieldDefinition).min(4).max(60).parse(input);
  const ids = new Set(fields.map((f) => f.id));
  if (ids.size !== fields.length) throw new Error("Field IDs must be unique.");
  for (const [id, type] of Object.entries(coreTypes)) {
    const field = fields.find((f) => f.id === id);
    if (!field || field.type !== type || field.visibility)
      throw new Error(
        `Core field ${id} cannot be removed, change type, or be conditional.`,
      );
    if (id !== "budget" && !field.required)
      throw new Error(`${id} must remain required.`);
  }
  if (
    JSON.stringify(fields.find((f) => f.id === "status")?.options) !==
    JSON.stringify(statuses)
  )
    throw new Error(
      "Status options must remain New, Contacted, Qualified, Lost.",
    );
  for (const field of fields) {
    if (field.type === "dropdown") {
      if (
        !field.options?.length ||
        new Set(field.options).size !== field.options.length
      )
        throw new Error(`${field.label}: provide unique, nonempty options.`);
    } else if (field.options)
      throw new Error("Only dropdown fields can have options.");
    if (field.visibility) {
      const parent = fields.find((f) => f.id === field.visibility?.fieldId);
      // Only unconditional dropdowns can control visibility: no cycles or hidden parents.
      if (
        !parent ||
        parent.id === field.id ||
        parent.type !== "dropdown" ||
        parent.visibility ||
        !parent.options?.includes(field.visibility.equals)
      )
        throw new Error(
          `${field.label}: select an always-visible dropdown and a valid option.`,
        );
    }
  }
  return fields;
}

export function isFieldVisible(field: FormField, values: LeadValues) {
  return (
    !field.visibility ||
    values[field.visibility.fieldId] === field.visibility.equals
  );
}

export function defaultValues(fields: FormField[]): LeadValues {
  return Object.fromEntries(
    fields.map((f) => [f.id, f.type === "checkbox" ? false : ""]),
  );
}

export function validateLeadValues(
  fields: FormField[],
  values: LeadValues,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const f of fields) {
    if (!isFieldVisible(f, values)) continue;
    const value = values[f.id];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim());
    if (empty) {
      if (f.required) errors[f.id] = "This field is required.";
      continue;
    }
    switch (f.type) {
      case "text":
        if (typeof value !== "string" || value.length > 5000)
          errors[f.id] = "Enter text (up to 5,000 characters).";
        break;
      case "email":
        if (
          typeof value !== "string" ||
          !z.email().safeParse(value.trim()).success
        )
          errors[f.id] = "Enter a valid email address.";
        break;
      case "number": {
        const number =
          typeof value === "number"
            ? value
            : typeof value === "string" &&
                /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())
              ? Number(value)
              : NaN;
        if (
          !Number.isFinite(number) ||
          Math.abs(number) > 1e12 ||
          (f.id === "budget" &&
            (number < 0 ||
              Math.abs(number * 100 - Math.round(number * 100)) > 0.001))
        )
          errors[f.id] =
            f.id === "budget"
              ? "Enter a positive AED amount with at most two decimals (maximum 1 trillion)."
              : "Enter a valid number (maximum magnitude 1 trillion).";
        break;
      }
      case "dropdown":
        if (typeof value !== "string" || !f.options?.includes(value))
          errors[f.id] = "Select a valid option.";
        break;
      case "date":
        if (
          typeof value !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          value < minimumDate ||
          value > maximumDate ||
          !Number.isFinite(Date.parse(value)) ||
          new Date(value).toISOString().slice(0, 10) !== value
        )
          errors[f.id] = "Enter a valid date between 1970 and 9999.";
        break;
      case "checkbox":
        if (typeof value !== "boolean" || (f.required && !value))
          errors[f.id] = f.required
            ? "This checkbox must be checked."
            : "Choose checked or unchecked.";
    }
  }
  return errors;
}

export const leadValuesInput = z.record(
  z.string().max(80),
  z.union([z.string().max(5000), z.number().finite(), z.boolean(), z.null()]),
);
