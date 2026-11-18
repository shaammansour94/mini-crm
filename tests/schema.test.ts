import { describe, expect, it } from "vitest";
import {
  initialFields,
  parseFormDefinition,
  validateLeadValues,
} from "@/features/form-builder/form-schema";

const validValues = {
  name: "Sara Ahmed",
  email: "sara@example.com",
  status: "New",
  budget: 500000,
};
describe("saved schema invariants", () => {
  it("retains stable IDs through rename and reorder", () => {
    const fields = [...initialFields]
      .reverse()
      .map((f) => ({ ...f, label: `${f.label} updated` }));
    expect(parseFormDefinition(fields).map((f) => f.id)).toEqual(
      [...initialFields].reverse().map((f) => f.id),
    );
  });
  it.each(["name", "email", "status", "budget"])(
    "protects core field %s",
    (id) => {
      expect(() =>
        parseFormDefinition(initialFields.filter((f) => f.id !== id)),
      ).toThrow();
      expect(() =>
        parseFormDefinition(
          initialFields.map((f) => (f.id === id ? { ...f, type: "date" } : f)),
        ),
      ).toThrow();
    },
  );
  it("rejects changed statuses, duplicate IDs, empty labels, unknown keys and malformed visibility", () => {
    const invalid = [
      initialFields.map((f) =>
        f.id === "status" ? { ...f, options: ["Other"] } : f,
      ),
      [...initialFields, initialFields[0]],
      initialFields.map((f) => ({ ...f, label: "" })),
      initialFields.map((f) => ({ ...f, surprise: true })),
      [
        ...initialFields,
        {
          id: "bad",
          label: "Bad",
          type: "text",
          required: true,
          visibility: { fieldId: "email", equals: "Lost" },
        },
      ],
      [
        ...initialFields,
        {
          id: "bad",
          label: "Bad",
          type: "dropdown",
          options: ["a", "a"],
          required: false,
        },
      ],
      [
        ...initialFields,
        {
          id: "bad",
          label: "Bad",
          type: "dropdown",
          options: ["a"],
          required: false,
          visibility: { fieldId: "bad", equals: "a" },
        },
      ],
      initialFields.map((f) =>
        f.id === "loss_reason"
          ? {
              ...f,
              visibility: {
                fieldId: "status",
                equals: "Lost",
                operator: "contains",
              },
            }
          : f,
      ),
    ];
    for (const input of invalid)
      expect(() => parseFormDefinition(input)).toThrow();
  });
  it("rejects conditional dropdown chains and cycles", () => {
    expect(() =>
      parseFormDefinition([
        ...initialFields,
        {
          id: "a",
          label: "A",
          type: "dropdown",
          options: ["Yes"],
          required: false,
          visibility: { fieldId: "status", equals: "Lost" },
        },
        {
          id: "b",
          label: "B",
          type: "text",
          required: true,
          visibility: { fieldId: "a", equals: "Yes" },
        },
      ]),
    ).toThrow();
  });
});
describe("visible lead validation", () => {
  it("requires loss reason only when status is Lost", () => {
    expect(validateLeadValues(initialFields, validValues)).toEqual({});
    expect(
      validateLeadValues(initialFields, { ...validValues, status: "Lost" }),
    ).toEqual({ loss_reason: "This field is required." });
    expect(
      validateLeadValues(initialFields, {
        ...validValues,
        status: "Lost",
        loss_reason: "No budget",
      }),
    ).toEqual({});
  });
  it("validates email, finite numbers, options, calendar dates and required checkbox", () => {
    const fields = [
      ...initialFields,
      { id: "visit", type: "date" as const, label: "Visit", required: true },
      {
        id: "consent",
        type: "checkbox" as const,
        label: "Consent",
        required: true,
      },
    ];
    expect(
      Object.keys(
        validateLeadValues(fields, {
          ...validValues,
          email: "bad",
          budget: "Infinity",
          status: "Invalid",
          visit: "2026-02-30",
          consent: false,
        }),
      ).sort(),
    ).toEqual(["budget", "consent", "email", "status", "visit"]);
    expect(
      validateLeadValues(fields, {
        ...validValues,
        visit: "2026-02-28",
        consent: true,
      }),
    ).toEqual({});
  });
});

describe("CRM date range", () => {
  const fields = [
    ...initialFields,
    { id: "visit", type: "date" as const, label: "Visit", required: true },
  ];
  it.each(["0002-02-12", "1969-12-31", "2026-02-30", "10000-01-01"])(
    "rejects invalid or out-of-range date %s",
    (visit) => {
      expect(validateLeadValues(fields, { ...validValues, visit }).visit).toBe(
        "Enter a valid date between 1970 and 9999.",
      );
    },
  );
  it.each(["1970-01-01", "2000-02-29", "2099-12-31", "9999-12-31"])(
    "accepts supported date %s",
    (visit) => {
      expect(validateLeadValues(fields, { ...validValues, visit })).toEqual({});
    },
  );
});
