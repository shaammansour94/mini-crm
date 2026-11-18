"use client";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  defaultValues,
  validateLeadValues,
  type FormField,
  type FieldErrors,
} from "../form-schema";
import { DynamicFields } from "./dynamic-fields";
export function FormPreview({
  fields,
  onClose,
}: {
  fields: FormField[];
  onClose: () => void;
}) {
  const [values, setValues] = useState(() => defaultValues(fields));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [valid, setValid] = useState(false);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-32px)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-2 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold">
              Preview lead form
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label="Close preview">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-8 text-sm text-muted-foreground">
            Your draft configuration. Preview submissions do not create leads.
          </Dialog.Description>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const next = validateLeadValues(fields, values);
              setErrors(next);
              setValid(!Object.keys(next).length);
              const first = fields.find((f) => next[f.id]);
              if (first)
                requestAnimationFrame(() =>
                  document.getElementById(`preview-${first.id}`)?.focus(),
                );
            }}
          >
            <DynamicFields
              prefix="preview"
              fields={fields}
              values={values}
              errors={errors}
              onChange={(id, value) => {
                setValid(false);
                setValues((old) => ({ ...old, [id]: value }));
              }}
            />
            {valid && (
              <p role="status" className="success-message mt-6">
                Looks good! This preview passes validation.
              </p>
            )}
            <div className="mt-8 flex justify-end">
              <Button>Test validation</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
