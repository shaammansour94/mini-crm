import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, errorResponse, HttpError } from "@/lib/http";
import { createSession } from "@/features/auth/session";
import { verifyPassword } from "@/features/auth/password";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { email, password } = z
      .strictObject({
        email: z.email().max(254),
        password: z.string().min(1).max(200),
      })
      .parse(await request.json());
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !verifyPassword(password, user.passwordHash))
      throw new HttpError(401, "Email or password is incorrect.");
    await createSession(user.id);
    return Response.json({ data: { name: user.name, role: user.role } });
  } catch (error) {
    return errorResponse(error);
  }
}
