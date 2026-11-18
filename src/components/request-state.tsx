"use client";
import { Button } from "./ui/button";
export function RequestState({
  error,
  retry,
  loading = "Loading…",
}: {
  error?: Error | null;
  retry?: () => void;
  loading?: string;
}) {
  return (
    <div className="panel p-8 text-center" role={error ? "alert" : "status"}>
      <p className={error ? "text-destructive" : "text-muted-foreground"}>
        {error ? error.message : loading}
      </p>
      {error && retry && (
        <Button className="mt-4" variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
