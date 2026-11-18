import { apiRequest } from "@/lib/api-client";
import type { LeadValues } from "@/features/form-builder/form-schema";
export type Lead = {
  id: string;
  name: string;
  email: string;
  status: string;
  budget: number | null;
  values: LeadValues;
  createdAt: string;
  updatedAt: string;
};
export type LeadFilters = {
  search: string;
  status: string;
  page: number;
  pageSize: number;
};
export function fetchLeads(filters: LeadFilters) {
  const params = new URLSearchParams({
    search: filters.search,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  if (filters.status) params.set("status", filters.status);
  return apiRequest<{
    data: Lead[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/leads?${params}`);
}
export function fetchLead(id: string) {
  return apiRequest<{ data: Lead }>(`/api/leads/${id}`);
}
export function persistLead(values: LeadValues, id?: string) {
  return apiRequest<{ data: Lead }>(id ? `/api/leads/${id}` : "/api/leads", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({ values }),
  });
}
