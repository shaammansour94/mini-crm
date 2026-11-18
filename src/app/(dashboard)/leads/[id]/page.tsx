import { Suspense } from "react";
import { LeadDetails } from "@/features/leads/lead-details";
async function Details({ params }: { params: Promise<{ id: string }> }) {
  return <LeadDetails id={(await params).id} />;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading lead…</p>}>
      <Details params={params} />
    </Suspense>
  );
}
