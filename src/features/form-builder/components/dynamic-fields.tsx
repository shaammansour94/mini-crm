"use client";
import {
  isFieldVisible,
  minimumDate,
  maximumDate,
  type FormField,
  type LeadValues,
  type FieldErrors,
} from "../form-schema";

export function DynamicFields({
  fields,
  values,
  errors = {},
  onChange,
  disabled = false,
  prefix = "lead",
}: {
  fields: FormField[];
  values: LeadValues;
  errors?: FieldErrors;
  onChange: (id: string, value: string | boolean) => void;
  disabled?: boolean;
  prefix?: string;
}) {
  return (
    <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
      {fields
        .filter((f) => isFieldVisible(f, values))
        .map((field) => {
          const id = `${prefix}-${field.id}`;
          const value = values[field.id];
          const common = {
            id,
            name: field.id,
            disabled,
            "aria-required": field.required,
            "aria-invalid": !!errors[field.id],
            "aria-describedby": errors[field.id]
              ? `${id}-error`
              : field.visibility
                ? `${id}-hint`
                : undefined,
          };
          let input;
          switch (field.type) {
            case "dropdown":
              input = (
                <select
                  {...common}
                  value={String(value ?? "")}
                  onChange={(e) => onChange(field.id, e.target.value)}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              );
              break;
            case "checkbox":
              input = (
                <div className="flex min-h-11 items-center gap-3">
                  <input
                    {...common}
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => onChange(field.id, e.target.checked)}
                  />
                  <label className="m-0 font-normal" htmlFor={id}>
                    Yes
                  </label>
                </div>
              );
              break;
            default:
              input = (
                <input
                  {...common}
                  type={field.type}
                  min={field.type === "date" ? minimumDate : undefined}
                  max={field.type === "date" ? maximumDate : undefined}
                  step={field.type === "number" ? "any" : undefined}
                  placeholder={field.placeholder}
                  value={String(value ?? "")}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              );
          }
          return (
            <div key={field.id}>
              <label htmlFor={id}>
                {field.label}
                {field.required && (
                  <span className="ml-1 text-primary" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
              {input}
              {errors[field.id] && (
                <p id={`${id}-error`} className="mt-2 text-xs text-destructive">
                  {errors[field.id]}
                </p>
              )}
              {field.visibility && !errors[field.id] && (
                <p
                  id={`${id}-hint`}
                  className="mt-2 text-xs text-muted-foreground"
                >
                  Shown when{" "}
                  {
                    fields.find((f) => f.id === field.visibility?.fieldId)
                      ?.label
                  }{" "}
                  is {field.visibility.equals}.
                </p>
              )}
            </div>
          );
        })}
    </div>
  );
}
