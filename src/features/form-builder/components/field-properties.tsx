"use client";
import { coreTypes, type FormField } from "../form-schema";

export function FieldProperties({
  field,
  fields,
  onChange,
  onEditEnd,
}: {
  field?: FormField;
  fields: FormField[];
  onChange: (field: FormField, textProperty?: string) => void;
  onEditEnd?: () => void;
}) {
  if (!field)
    return (
      <p className="p-5 text-sm text-muted-foreground">
        Select a field to edit its properties.
      </p>
    );
  const parents = fields.filter(
    (f) =>
      f.id !== field.id &&
      f.type === "dropdown" &&
      !f.visibility &&
      !fields.some((other) => other.visibility?.fieldId === field.id),
  );
  const parent = fields.find((f) => f.id === field.visibility?.fieldId);
  const core = Object.hasOwn(coreTypes, field.id);
  return (
    <div className="space-y-6 p-5">
      <div>
        <h2 className="text-xs font-semibold tracking-wide">
          FIELD PROPERTIES
        </h2>
        <p className="mt-2 break-all text-xs text-muted-foreground capitalize">
          {field.type} / stable ID:{" "}
          <span className="font-mono normal-case">{field.id}</span>
        </p>
        {core && (
          <p className="mt-2 text-xs text-primary">Protected core field</p>
        )}
      </div>
      <div>
        <label htmlFor="field-label">Label</label>
        <input
          id="field-label"
          onBlur={onEditEnd}
          maxLength={120}
          value={field.label}
          onChange={(e) =>
            onChange({ ...field, label: e.target.value }, "label")
          }
        />
      </div>
      {field.type !== "checkbox" && field.type !== "dropdown" && (
        <div>
          <label htmlFor="field-placeholder">Placeholder</label>
          <input
            id="field-placeholder"
            onBlur={onEditEnd}
            maxLength={200}
            value={field.placeholder ?? ""}
            onChange={(e) =>
              onChange({ ...field, placeholder: e.target.value }, "placeholder")
            }
          />
        </div>
      )}
      <label className="flex items-center gap-3 text-sm font-normal">
        <input
          type="checkbox"
          checked={field.required}
          disabled={core && field.id !== "budget"}
          onChange={(e) => onChange({ ...field, required: e.target.checked })}
        />
        Required when visible
      </label>
      {field.type === "dropdown" && (
        <div>
          <label htmlFor="field-options">Options (one per line)</label>
          <textarea
            id="field-options"
            onBlur={onEditEnd}
            disabled={field.id === "status"}
            value={field.options?.join("\n") ?? ""}
            onChange={(e) =>
              onChange(
                { ...field, options: e.target.value.split("\n") },
                "options",
              )
            }
          />
          {field.id === "status" && (
            <p className="mt-2 text-xs text-muted-foreground">
              The four status values are fixed.
            </p>
          )}
        </div>
      )}
      {!core && (
        <div className="border-t pt-6">
          <h3 className="mb-4 text-sm font-semibold">Visibility condition</h3>
          <label
            htmlFor="visibility-field"
            className="text-xs text-muted-foreground"
          >
            Show this field when
          </label>
          <select
            id="visibility-field"
            value={field.visibility?.fieldId ?? ""}
            onChange={(e) =>
              onChange({
                ...field,
                visibility: e.target.value
                  ? {
                      fieldId: e.target.value,
                      equals:
                        fields.find((f) => f.id === e.target.value)
                          ?.options?.[0] ?? "",
                    }
                  : undefined,
              })
            }
          >
            <option value="">Always visible</option>
            {parents.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          {field.visibility && (
            <div className="mt-4">
              <label
                htmlFor="visibility-value"
                className="text-xs text-muted-foreground"
              >
                Equals
              </label>
              <select
                id="visibility-value"
                value={field.visibility.equals}
                onChange={(e) =>
                  onChange({
                    ...field,
                    visibility: {
                      fieldId: field.visibility!.fieldId,
                      equals: e.target.value,
                    },
                  })
                }
              >
                {parent?.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Hidden fields do not block submission. Conditions use always-visible
            dropdowns.
          </p>
        </div>
      )}
    </div>
  );
}
