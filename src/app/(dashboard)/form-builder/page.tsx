import { Suspense } from "react";
import { ErrorScreen } from "@/components/error-screen";
import { requirePageUser } from "@/features/auth/session";
import { FormBuilderPage } from "@/features/form-builder/components/form-builder";
async function Builder() {
  const user = await requirePageUser();
  if (user.role !== "ADMIN")
    return (
      <ErrorScreen
        code="403"
        title="Access denied"
        description="Only administrators can open the Form Builder. You can still manage your leads from your workspace."
      />
    );
  return <FormBuilderPage />;
}
export default function Page() {
  return (
    <Suspense fallback={<p>Loading form builder…</p>}>
      <Builder />
    </Suspense>
  );
}
