"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestState } from "@/components/request-state";
import { ApiError } from "@/lib/api-client";
import { useFormSchema } from "@/features/form-builder/form-schema.queries";
import {
  defaultValues,
  isFieldVisible,
  validateLeadValues,
  type FormField,
  type LeadValues,
  type FieldErrors,
} from "@/features/form-builder/form-schema";
import { DynamicFields } from "@/features/form-builder/components/dynamic-fields";
import { useLead, useSaveLead } from "./leads.queries";

function LeadEditor({
  fields,
  initial,
  id,
}: {
  fields: FormField[];
  initial?: LeadValues;
  id?: string;
}) {
  const [values, setValues] = useState<LeadValues>(() => ({
    ...defaultValues(fields),
    ...initial,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const mutation = useSaveLead(id);
  const router = useRouter();
  function showErrors(next: FieldErrors) {
    setErrors(next);
    const first = fields.find((f) => next[f.id] && isFieldVisible(f, values));
    if (first)
      requestAnimationFrame(() =>
        document.getElementById(`lead-${first.id}`)?.focus(),
      );
  }
  return (
    <form
      noValidate
      className="panel p-5 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (mutation.isPending) return;
        const next = validateLeadValues(fields, values);
        showErrors(next);
        if (Object.keys(next).length) return;
        try {
          await mutation.mutateAsync(values);
          router.push(`/leads?saved=${id ? "updated" : "created"}`);
        } catch (error) {
          if (error instanceof ApiError) showErrors(error.errors);
        }
      }}
    >
      <h2 className="mb-7 font-semibold">Lead information</h2>
      <DynamicFields
        fields={fields}
        values={values}
        errors={errors}
        disabled={mutation.isPending}
        onChange={(key, value) =>
          setValues((old) => ({ ...old, [key]: value }))
        }
      />
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Please check the highlighted fields.
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {mutation.error.message} Your changes are still here. Please try
          again.
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-xs text-muted-foreground">* Required field</p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/leads">Cancel</Link>
          </Button>
          <Button disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving…"
              : id
                ? "Save changes"
                : "Create lead"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function LeadFormPage({ id }: { id?: string }) {
  const schema = useFormSchema();
  const lead = useLead(id);
  return (
    <div className="max-w-5xl">
      <Link
        href="/leads"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={16} />
        Back to leads
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LEADS / {id ? "EDIT" : "CREATE"}</p>
          <h1>{id ? "Edit lead" : "Create lead"}</h1>
          <p>A little information. A new opportunity.</p>
        </div>
        <span className="rounded-full bg-accent px-3 py-2 text-xs text-accent-foreground">
          Saved form layout
        </span>
      </div>
      {schema.isPending || (id && lead.isPending) ? (
        <RequestState loading="Loading lead form…" />
      ) : schema.isError || lead.isError ? (
        <RequestState
          error={schema.error ?? lead.error}
          retry={() => {
            schema.refetch();
            if (id) lead.refetch();
          }}
        />
      ) : (
        schema.data && (
          <LeadEditor
            key={id ?? "new"}
            fields={schema.data.data.fields}
            initial={lead.data?.data.values}
            id={id}
          />
        )
      )}
    </div>
  );
}
