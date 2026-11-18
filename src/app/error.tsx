"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorScreen
      code="500"
      title="Something went wrong"
      description="We couldn't load this page. Please try again, or return to your leads workspace."
      retry={retry}
    />
  );
}
