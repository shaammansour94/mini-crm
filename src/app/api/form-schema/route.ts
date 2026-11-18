import { z } from "zod";
import { requireUser } from "@/features/auth/session";
import {
  getFormSchema,
  saveFormSchema,
} from "@/features/form-builder/form-schema.service";
import { assertSameOrigin, errorResponse } from "@/lib/http";
export async function GET() {
  try {
    await requireUser();
    return Response.json({ data: await getFormSchema() });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    await requireUser(true);
    assertSameOrigin(request);
    const body = z
      .strictObject({ fields: z.unknown() })
      .parse(await request.json());
    return Response.json({ data: await saveFormSchema(body.fields) });
  } catch (error) {
    return errorResponse(error);
  }
}
