import { endSession, requireUser } from "@/features/auth/session";
import { assertSameOrigin, errorResponse } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireUser();
    await endSession();
    return Response.json({ message: "Signed out." });
  } catch (error) {
    return errorResponse(error);
  }
}
