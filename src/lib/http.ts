import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { message: error.message, errors: error.errors },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return Response.json(
      {
        message: "Invalid input.",
        errors: Object.fromEntries(
          error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      },
      { status: 422 },
    );
  if (error instanceof SyntaxError)
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  console.error(error);
  return Response.json(
    { message: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Next may normalize request.url to localhost even when a browser uses
  // 127.0.0.1. The incoming Host preserves the actual browser-facing authority.
  const expected = new URL(request.url);
  expected.host = request.headers.get("host") ?? expected.host;
  if (origin && origin !== expected.origin)
    throw new HttpError(403, "Cross-origin requests are not allowed.");
}
