import { requireUser } from "@/features/auth/session";
import { getLead, saveLead } from "@/features/leads/leads.service";
import { assertSameOrigin, errorResponse } from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    await requireUser();
    return Response.json({ data: await getLead((await context.params).id) });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PUT(request: Request, context: Context) {
  try {
    await requireUser();
    assertSameOrigin(request);
    return Response.json({
      data: await saveLead(await request.json(), (await context.params).id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
