"use client";
import Link from "next/link";
import { Pencil, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestState } from "@/components/request-state";
import { useFormSchema } from "@/features/form-builder/form-schema.queries";
import { isFieldVisible } from "@/features/form-builder/form-schema";
import { useLead } from "./leads.queries";
export function LeadDetails({ id }: { id: string }) {
  const lead = useLead(id);
  const schema = useFormSchema();
  if (lead.isPending || schema.isPending)
    return <RequestState loading="Loading lead…" />;
  if (lead.isError || schema.isError)
    return (
      <RequestState
        error={lead.error ?? schema.error}
        retry={() => {
          lead.refetch();
          schema.refetch();
        }}
      />
    );
  const record = lead.data.data;
  return (
    <div className="max-w-5xl">
      <Link
        href="/leads"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        Back to leads
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LEAD DETAILS</p>
          <h1>{record.name}</h1>
          <p>
            Created{" "}
            {new Date(record.createdAt).toLocaleDateString("en-GB", {
              timeZone: "Asia/Dubai",
            })}
          </p>
        </div>
        <Button asChild>
          <Link href={`/leads/${id}/edit`}>
            <Pencil />
            Edit lead
          </Link>
        </Button>
      </div>
      <div className="panel p-5 sm:p-8">
        <h2 className="mb-8 font-semibold">Lead information</h2>
        <dl className="grid gap-8 sm:grid-cols-2">
          {schema.data.data.fields
            .filter((f) => isFieldVisible(f, record.values))
            .map((field) => {
              const value = record.values[field.id];
              return (
                <div key={field.id}>
                  <dt className="mb-2 text-xs text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="break-words text-sm">
                    {field.id === "status" ? (
                      <span
                        className={`status-badge status-${record.status.toLowerCase()}`}
                      >
                        {record.status}
                      </span>
                    ) : value === null ||
                      value === undefined ||
                      value === "" ? (
                      "—"
                    ) : typeof value === "boolean" ? (
                      value ? (
                        "Yes"
                      ) : (
                        "No"
                      )
                    ) : field.id === "budget" ? (
                      `${Number(value).toLocaleString("en-AE")} AED`
                    ) : (
                      String(value)
                    )}
                  </dd>
                </div>
              );
            })}
        </dl>
      </div>
    </div>
  );
}
