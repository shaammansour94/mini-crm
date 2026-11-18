import { requireUser } from "@/features/auth/session";
import { listLeads, saveLead } from "@/features/leads/leads.service";
import { assertSameOrigin, errorResponse } from "@/lib/http";
export async function GET(request: Request) {
  try {
    await requireUser();
    return Response.json(await listLeads(new URL(request.url).searchParams));
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    await requireUser();
    assertSameOrigin(request);
    return Response.json(
      { data: await saveLead(await request.json()) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
