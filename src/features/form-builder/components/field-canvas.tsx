"use client";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { coreTypes, type FormField } from "../form-schema";

function FieldRow({
  field,
  index,
  total,
  selected,
  onSelect,
  onMove,
  onRemove,
}: {
  field: FormField;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id: field.id, index });
  return (
    <li
      ref={ref}
      className={`rounded-lg border bg-card p-3 transition-colors ${selected ? "border-primary bg-accent/40 ring-1 ring-primary" : ""} ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={handleRef}
          aria-label={`Drag ${field.label}`}
          className="flex min-h-11 min-w-6 touch-none items-center justify-center text-muted-foreground"
        >
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          aria-pressed={selected}
          onClick={onSelect}
          className="min-h-11 flex-1 text-left text-sm font-medium"
        >
          {field.label || "Untitled field"}
          {field.required && " *"}
        </button>
        {Object.hasOwn(coreTypes, field.id) && (
          <LockKeyhole
            size={12}
            aria-label="Protected field"
            className="text-muted-foreground"
          />
        )}
      </div>
      {field.visibility && (
        <p className="mb-2 ml-8 text-xs text-primary">
          Visible when {field.visibility.fieldId} = {field.visibility.equals}
        </p>
      )}
      <div className="ml-8 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          aria-label={`Move ${field.label} up`}
          disabled={index === 0}
          onClick={() => onMove(-1)}
        >
          <ArrowUp size={13} />
          Up
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Move ${field.label} down`}
          disabled={index === total - 1}
          onClick={() => onMove(1)}
        >
          <ArrowDown size={13} />
          Down
        </Button>
        {!Object.hasOwn(coreTypes, field.id) && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            aria-label={`Remove ${field.label}`}
            onClick={onRemove}
          >
            <Trash2 size={13} />
            Remove
          </Button>
        )}
      </div>
    </li>
  );
}
export function FieldCanvas({
  fields,
  selectedId,
  onSelect,
  onChange,
}: {
  fields: FormField[];
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (fields: FormField[]) => void;
}) {
  return (
    <div className="p-5">
      <div className="mb-5 flex justify-between">
        <h2 className="text-sm font-semibold">Lead information</h2>
        <span className="text-xs text-muted-foreground">
          {fields.length} fields
        </span>
      </div>
      <DragDropProvider
        onDragEnd={(event) => {
          if (!event.canceled) onChange(move(fields, event));
        }}
      >
        <ol className="space-y-3">
          {fields.map((field, index) => (
            <FieldRow
              key={field.id}
              field={field}
              index={index}
              total={fields.length}
              selected={field.id === selectedId}
              onSelect={() => onSelect(field.id)}
              onMove={(delta) => {
                const next = [...fields];
                const [item] = next.splice(index, 1);
                next.splice(index + delta, 0, item);
                onChange(next);
              }}
              onRemove={() => {
                onChange(
                  fields
                    .filter((f) => f.id !== field.id)
                    .map((f) =>
                      f.visibility?.fieldId === field.id
                        ? { ...f, visibility: undefined }
                        : f,
                    ),
                );
                if (selectedId === field.id) onSelect(fields[0].id);
              }}
            />
          ))}
        </ol>
      </DragDropProvider>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Drag the handles to reorder, or use the Up / Down controls. Core fields
        stay protected.
      </p>
    </div>
  );
}
