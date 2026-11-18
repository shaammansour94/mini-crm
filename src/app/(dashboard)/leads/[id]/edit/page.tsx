import { Suspense } from "react";
import { LeadFormPage } from "@/features/leads/lead-form";
async function Editor({ params }: { params: Promise<{ id: string }> }) {
  return <LeadFormPage id={(await params).id} />;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading lead…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}
