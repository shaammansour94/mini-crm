"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  RefreshCw,
  SearchX,
  ShieldX,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorScreen({
  code,
  title,
  description,
  retry,
}: {
  code: "403" | "404" | "500";
  title: string;
  description: string;
  retry?: () => void;
}) {
  const Icon =
    code === "403" ? ShieldX : code === "404" ? SearchX : TriangleAlert;
  return (
    <div className="flex min-h-[90dvh] flex-col items-center justify-center px-5 py-12">
      <Link
        href="/leads"
        aria-label="AQARY home"
        className="mb-10 flex min-h-11 items-center gap-3 text-xl font-bold tracking-[.18em]"
      >
        <Building2 className="text-primary" size={28} />
        AQARY
      </Link>
      <section
        aria-labelledby="error-title"
        className="panel w-full max-w-lg overflow-hidden text-center shadow-sm"
      >
        <div className="h-1 bg-primary" />
        <div className="px-6 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-accent text-primary">
            <Icon size={30} strokeWidth={1.5} />
          </div>
          <p className="eyebrow mb-3">ERROR {code}</p>
          <h1
            id="error-title"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {retry && (
              <Button onClick={retry}>
                <RefreshCw />
                Try again
              </Button>
            )}
            <Button asChild variant={retry ? "outline" : "default"}>
              <Link href="/leads">
                <ArrowLeft />
                Back to leads
              </Link>
            </Button>
          </div>
        </div>
        <p className="border-t bg-muted/40 px-6 py-4 text-xs text-muted-foreground">
          Your workspace. Your next opportunity.
        </p>
      </section>
    </div>
  );
}
