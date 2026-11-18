import { NextResponse, type NextRequest } from "next/server";
import { userFromToken } from "@/features/auth/session";

// Deny before streaming starts so a direct builder request receives HTTP 403.
// The page and write API also enforce authorization independently.
export async function proxy(request: NextRequest) {
  const user = await userFromToken(request.cookies.get("aqary_session")?.value);
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (user.role !== "ADMIN")
    return NextResponse.rewrite(new URL("/access-denied", request.url), {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  return NextResponse.next();
}
export const config = { matcher: "/form-builder/:path*" };
