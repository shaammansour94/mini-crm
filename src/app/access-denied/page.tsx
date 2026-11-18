import { ErrorScreen } from "@/components/error-screen";

export default function AccessDeniedPage() {
  return (
    <ErrorScreen
      code="403"
      title="Access denied"
      description="Only administrators can open the Form Builder. You can still manage your leads from your workspace."
    />
  );
}
