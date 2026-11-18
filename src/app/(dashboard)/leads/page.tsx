import { Suspense } from "react";
import { LeadsTable } from "@/features/leads/leads-table";
export default function LeadsPage() {
  return (
    <Suspense fallback={<p>Loading leads…</p>}>
      <LeadsTable />
    </Suspense>
  );
}
