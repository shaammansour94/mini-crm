import { apiRequest } from "@/lib/api-client";
import type { FormField } from "./form-schema";
export type SavedSchema = { data: { fields: FormField[]; updatedAt: string } };
export function fetchSchema() {
  return apiRequest<SavedSchema>("/api/form-schema");
}
export function persistSchema(fields: FormField[]) {
  return apiRequest<SavedSchema>("/api/form-schema", {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}
