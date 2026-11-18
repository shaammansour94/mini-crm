import { expect, it } from "vitest";
import { assertSameOrigin } from "@/lib/http";
it("accepts the actual browser host when Next normalizes request.url", () => {
  expect(() =>
    assertSameOrigin(
      new Request("http://localhost:3100/api/auth/login", {
        headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" },
      }),
    ),
  ).not.toThrow();
});
it("rejects cross-origin browser writes including different ports", () => {
  for (const origin of [
    "https://attacker.example",
    "http://localhost:9999",
    "null",
  ]) {
    expect(() =>
      assertSameOrigin(
        new Request("http://localhost:3100/api/leads", {
          headers: { host: "localhost:3100", origin },
        }),
      ),
    ).toThrow("Cross-origin");
  }
});
