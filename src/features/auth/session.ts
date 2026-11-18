import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";

const cookieName = "aqary_session";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure:
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false"),
  path: "/",
};
function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function currentUser() {
  return userFromToken((await cookies()).get(cookieName)?.value);
}
export async function userFromToken(token?: string) {
  if (!token || token.length !== 64) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function requireUser(admin = false) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  if (admin && user.role !== "ADMIN")
    throw new HttpError(403, "Only administrators can configure the form.");
  return user;
}
export async function requirePageUser() {
  // Session expiry uses the current clock and must run for a real request,
  // including when Cache Components attempts a speculative prerender.
  await connection();
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const jar = await cookies();
  const old = jar.get(cookieName)?.value;
  if (old)
    await db.session.deleteMany({ where: { tokenHash: tokenHash(old) } });
  await db.session.create({
    data: { tokenHash: tokenHash(token), userId, expiresAt },
  });
  jar.set(cookieName, token, { ...cookieOptions, expires: expiresAt });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  jar.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
}
