"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import {
  Plus,
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestState } from "@/components/request-state";
import { statuses } from "@/features/form-builder/form-schema";
import { useLeads } from "./leads.queries";

export function LeadsTable() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    pageSize: 5,
  });
  // Next hides cached pages with Activity rather than unmounting them.
  // Clear the list state when leaving, including browser back/forward visits.
  useLayoutEffect(() => {
    return () => {
      setFilters({ search: "", status: "", page: 1, pageSize: 5 });
    };
  }, []);
  const query = useLeads(filters);
  const params = useSearchParams();
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Leads</h1>
          <p>Manage your sales enquiries in one place.</p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus />
            Create lead
          </Link>
        </Button>
      </div>
      {params.get("saved") && (
        <p role="status" className="success-message mb-6">
          Lead {params.get("saved") === "created" ? "created" : "updated"}{" "}
          successfully.
        </p>
      )}
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-muted-foreground"
              size={18}
            />
            <input
              className="pl-10"
              aria-label="Search name or email"
              placeholder="Search name or email…"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
            />
          </div>
          <select
            className="sm:max-w-48"
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {query.isPending || query.isError ? (
          <RequestState
            loading="Loading leads…"
            error={query.error}
            retry={() => query.refetch()}
          />
        ) : query.data.data.length === 0 ? (
          <div className="py-16 text-center">
            <UsersRound className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-semibold">No matching leads</h2>
            <p className="my-2 text-sm text-muted-foreground">
              Try another search or clear the filters.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({ ...filters, search: "", status: "", page: 1 })
              }
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="leads-table">
              <thead>
                <tr>
                  {[
                    "Name",
                    "Email",
                    "Status",
                    "Budget (AED)",
                    "Created",
                    "Actions",
                  ].map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Link
                        className="font-medium hover:text-primary"
                        href={`/leads/${lead.id}`}
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{lead.email}</td>
                    <td>
                      <span
                        className={`status-badge status-${lead.status.toLowerCase()}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="tabular-nums">
                      {lead.budget == null
                        ? "—"
                        : lead.budget.toLocaleString("en-AE", {
                            maximumFractionDigits: 2,
                          })}
                    </td>
                    <td className="whitespace-nowrap text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Dubai",
                      })}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Button asChild variant="ghost">
                          <Link
                            aria-label={`View ${lead.name}`}
                            href={`/leads/${lead.id}`}
                          >
                            View
                            <ArrowUpRight size={14} />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost">
                          <Link
                            aria-label={`Edit ${lead.name}`}
                            href={`/leads/${lead.id}/edit`}
                          >
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t p-5 text-sm">
          <p className="text-muted-foreground" role="status">
            {query.isSuccess
              ? `Showing ${total && query.data.data.length ? (filters.page - 1) * filters.pageSize + 1 : 0}–${Math.min(filters.page * filters.pageSize, total)} of ${total} leads`
              : "Loading results"}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              aria-label="Previous page"
              disabled={filters.page <= 1 || query.isPending}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              <ChevronLeft />
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {filters.page} / {pages}
            </span>
            <Button
              variant="outline"
              aria-label="Next page"
              disabled={filters.page >= pages || query.isPending}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground sm:hidden">
        Swipe the table horizontally to see all lead details.
      </p>
    </>
  );
}
