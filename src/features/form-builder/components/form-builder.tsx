"use client";
import {
  GuardedLink as Link,
  useUnsavedChanges,
} from "@/components/navigation-guard";
import { useCallback, useLayoutEffect, useState } from "react";
import {
  Plus,
  Type,
  Mail,
  Hash,
  List,
  CalendarDays,
  SquareCheck,
  Eye,
  Check,
  ArrowLeft,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestState } from "@/components/request-state";
import { useFormSchema, useSaveSchema } from "../form-schema.queries";
import {
  fieldTypes,
  parseFormDefinition,
  type FormField,
} from "../form-schema";
import type { SavedSchema } from "../form-schema.api";
import { FieldProperties } from "./field-properties";
import { FieldCanvas } from "./field-canvas";
import { FormPreview } from "./form-preview";

import { useDraftHistory } from "../draft-history";

const palette = [Type, Mail, Hash, List, CalendarDays, SquareCheck];
function FormBuilder({ saved }: { saved: SavedSchema["data"] }) {
  const history = useDraftHistory(saved.fields);
  const fields = history.fields;
  const resetHistory = history.reset;
  const [selectedId, setSelectedId] = useState(saved.fields[0].id);
  const [tab, setTab] = useState("Canvas");
  const [preview, setPreview] = useState(false);
  // Activity preserves the draft between visits; only reset the mobile panel.
  useLayoutEffect(() => {
    return () => setTab("Canvas");
  }, []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savedFields, setSavedFields] = useState(saved.fields);
  const [lastSaved, setLastSaved] = useState(saved.updatedAt);
  const mutation = useSaveSchema();
  const dirty = JSON.stringify(fields) !== JSON.stringify(savedFields);
  const selected = fields.find((f) => f.id === selectedId) ?? fields[0];
  const discard = useCallback(() => {
    resetHistory(savedFields);
    setPreview(false);
    setMessage("");
    setError("");
  }, [savedFields, resetHistory]);
  useUnsavedChanges(dirty, discard);
  function change(next: FormField[], group?: string) {
    history.change(next, group);
    setMessage("");
    setError("");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FORM CONFIGURATION</p>
          <h1>Lead form builder</h1>
          <p>
            {dirty ? "Draft changes" : "All changes saved"} · Last saved{" "}
            {new Date(lastSaved).toLocaleString("en-GB", {
              timeZone: "Asia/Dubai",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/leads">
              <ArrowLeft />
              Back to leads
            </Link>
          </Button>
          <Button
            variant="outline"
            aria-label="Undo"
            disabled={mutation.isPending || !history.canUndo}
            onClick={() => {
              history.undo();
              setMessage("");
              setError("");
            }}
          >
            <Undo2 />
            Undo
          </Button>
          <Button
            variant="outline"
            aria-label="Redo"
            disabled={mutation.isPending || !history.canRedo}
            onClick={() => {
              history.redo();
              setMessage("");
              setError("");
            }}
          >
            <Redo2 />
            Redo
          </Button>
          <Button variant="outline" onClick={() => setPreview(true)}>
            <Eye />
            Preview
          </Button>
          <Button
            disabled={mutation.isPending || !dirty}
            onClick={async () => {
              if (mutation.isPending) return;
              setError("");
              setMessage("");
              try {
                const valid = parseFormDefinition(fields);
                const result = await mutation.mutateAsync(valid);
                history.reset(result.data.fields);
                setSavedFields(result.data.fields);
                setLastSaved(result.data.updatedAt);
                setMessage(
                  "Form saved. Create and edit lead forms now use this configuration.",
                );
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Could not save form.",
                );
              }
            }}
          >
            <Check />
            {mutation.isPending ? "Saving…" : "Save form"}
          </Button>
        </div>
      </div>
      {message && (
        <p role="status" className="success-message mb-5">
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-card p-4 text-sm text-destructive"
        >
          {error} Your draft is still here.
        </p>
      )}
      <div
        className="mb-4 flex gap-2 border-b lg:hidden"
        role="tablist"
        aria-label="Builder panels"
      >
        {["Fields", "Canvas", "Properties"].map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            aria-controls={`panel-${t}`}
            role="tab"
            aria-selected={tab === t}
            tabIndex={tab === t ? 0 : -1}
            onKeyDown={(event) => {
              const tabs = ["Fields", "Canvas", "Properties"];
              const index = tabs.indexOf(t);
              const next =
                event.key === "ArrowRight"
                  ? tabs[(index + 1) % 3]
                  : event.key === "ArrowLeft"
                    ? tabs[(index + 2) % 3]
                    : event.key === "Home"
                      ? tabs[0]
                      : event.key === "End"
                        ? tabs[2]
                        : undefined;
              if (next) {
                event.preventDefault();
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
            className={`min-h-11 flex-1 border-b-2 px-3 text-sm ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <fieldset
        disabled={mutation.isPending}
        className="builder-grid panel overflow-hidden"
      >
        <section
          id="panel-Fields"
          aria-labelledby="tab-Fields"
          className={`builder-palette border-border ${tab !== "Fields" ? "hidden lg:block" : ""}`}
        >
          <div className="p-5">
            <h2 className="text-xs font-semibold tracking-wide">
              FIELD PALETTE
            </h2>
            <p className="mt-2 mb-6 text-xs text-muted-foreground">
              Add a field to the canvas
            </p>
            <div className="space-y-3">
              {fieldTypes.map((type, i) => {
                const Icon = palette[i];
                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="w-full justify-start bg-card capitalize"
                    disabled={fields.length >= 60}
                    onClick={() => {
                      const id = `field_${crypto.randomUUID()}`;
                      change([
                        ...fields,
                        {
                          id,
                          type,
                          label: type[0].toUpperCase() + type.slice(1),
                          required: false,
                          ...(type === "dropdown"
                            ? { options: ["Option 1", "Option 2"] }
                            : {}),
                        },
                      ]);
                      setSelectedId(id);
                      setTab("Canvas");
                    }}
                  >
                    <Icon size={16} />
                    {type}
                    <Plus className="ml-auto" size={14} />
                  </Button>
                );
              })}
            </div>
            <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
              Build the form your team needs. Saved changes appear in every lead
              form.
            </p>
          </div>
        </section>
        <section
          id="panel-Canvas"
          aria-labelledby="tab-Canvas"
          className={`bg-background ${tab !== "Canvas" ? "hidden lg:block" : ""}`}
        >
          <FieldCanvas
            fields={fields}
            selectedId={selected.id}
            onChange={change}
            onSelect={(id) => {
              history.endGroup();
              setSelectedId(id);
              setTab("Properties");
            }}
          />
        </section>
        <section
          id="panel-Properties"
          aria-labelledby="tab-Properties"
          className={`border-border ${tab !== "Properties" ? "hidden lg:block" : ""}`}
        >
          <FieldProperties
            field={selected}
            fields={fields}
            onEditEnd={history.endGroup}
            onChange={(field, property) =>
              change(
                fields.map((f) => (f.id === field.id ? field : f)),
                property ? `${field.id}:${property}` : undefined,
              )
            }
          />
        </section>
      </fieldset>
      {preview && (
        <FormPreview fields={fields} onClose={() => setPreview(false)} />
      )}
    </>
  );
}
export function FormBuilderPage() {
  const query = useFormSchema();
  if (query.isPending || query.isError)
    return (
      <RequestState
        loading="Loading form configuration…"
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  return <FormBuilder saved={query.data.data} />;
}
