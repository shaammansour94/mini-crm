import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSchema, persistSchema } from "./form-schema.api";
export function useFormSchema() {
  return useQuery({ queryKey: ["form-schema"], queryFn: fetchSchema });
}
export function useSaveSchema() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: persistSchema,
    onSuccess: (data) => {
      client.setQueryData(["form-schema"], data);
    },
  });
}
