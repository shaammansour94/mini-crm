"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center justify-center gap-3 text-primary">
          <Building2 size={32} />
          <span className="text-3xl font-bold tracking-[.2em]">AQARY</span>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1 className="mt-2 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">
            Sign in to manage your leads and keep things moving.
          </p>
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (pending) return;
              const data = new FormData(e.currentTarget);
              setPending(true);
              setError("");
              try {
                await apiRequest("/api/auth/login", {
                  method: "POST",
                  body: JSON.stringify({
                    email: data.get("email"),
                    password: data.get("password"),
                  }),
                });
                queryClient.clear();
                router.replace("/leads");
                router.refresh();
              } catch (error) {
                setError(
                  error instanceof Error ? error.message : "Unable to sign in.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            <div>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="admin@aqary.demo"
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
              <ArrowRight />
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Demo accounts: admin@aqary.demo · agent@aqary.demo
          <br />
          Password: AqaryDemo2026!
        </p>
      </div>
    </main>
  );
}
