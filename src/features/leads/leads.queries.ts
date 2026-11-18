import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLead,
  fetchLeads,
  persistLead,
  type LeadFilters,
} from "./leads.api";
import type { LeadValues } from "@/features/form-builder/form-schema";
export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () => fetchLeads(filters),
  });
}
export function useLead(id?: string) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchLead(id!),
    enabled: !!id,
  });
}
export function useSaveLead(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: LeadValues) => persistLead(values, id),
    onSuccess: async (result) => {
      client.setQueryData(["lead", result.data.id], result);
      await client.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
