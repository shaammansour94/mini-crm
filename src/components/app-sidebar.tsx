"use client";
import { GuardedLink as Link, useNavigationGuard } from "./navigation-guard";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  UsersRound,
  SlidersHorizontal,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { apiRequest } from "@/lib/api-client";
export function AppSidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const { confirmNavigation } = useNavigationGuard();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <>
      <header className="mobile-header">
        <Link href="/leads" className="font-bold tracking-widest">
          AQARY
        </Link>
        <Button
          variant="ghost"
          aria-expanded={open}
          aria-controls="workspace-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />} Menu
        </Button>
      </header>
      <aside id="workspace-nav" className={`sidebar ${open ? "is-open" : ""}`}>
        <Link
          href="/leads"
          className="mb-14 flex items-center gap-3 text-xl font-bold tracking-[.18em]"
        >
          <Building2 className="text-primary" size={29} />
          AQARY
        </Link>
        <p className="mb-3 px-3 text-[10px] font-medium tracking-[.16em] opacity-50">
          WORKSPACE
        </p>
        <nav className="space-y-2" aria-label="Workspace">
          <Link
            onClick={() => setOpen(false)}
            className={`nav-link ${pathname.startsWith("/leads") ? "active" : ""}`}
            href="/leads"
          >
            <UsersRound size={18} />
            Leads
          </Link>
          {user.role === "ADMIN" && (
            <Link
              onClick={() => setOpen(false)}
              className={`nav-link ${pathname === "/form-builder" ? "active" : ""}`}
              href="/form-builder"
            >
              <SlidersHorizontal size={18} />
              Form Builder
            </Link>
          )}
        </nav>
        <div className="mt-auto border-t border-white/15 pt-5">
          <div className="mb-5 flex gap-3 items-center">
            <span className="grid size-10 place-items-center rounded-full bg-white/10 text-sm">
              {user.role === "ADMIN" ? "DA" : "DG"}
            </span>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="mt-1 text-xs opacity-50">
                {user.role === "ADMIN" ? "Administrator" : "Agent"}
              </p>
            </div>
          </div>
          <Button
            disabled={pending}
            variant="ghost"
            className="w-full justify-start text-inherit hover:bg-white/10 hover:text-white"
            onClick={() => {
              const signOut = async () => {
                if (pending) return;
                setError("");
                setPending(true);
                try {
                  await apiRequest("/api/auth/logout", { method: "POST" });
                  queryClient.clear();
                  router.replace("/login");
                  router.refresh();
                } catch {
                  setError("Could not sign out. Try again.");
                } finally {
                  // Next can preserve this layout after signing in again.
                  setPending(false);
                }
              };
              if (
                !confirmNavigation(() => {
                  void signOut();
                })
              )
                void signOut();
            }}
          >
            <LogOut />
            Sign out
          </Button>
          {error && (
            <p role="alert" className="text-xs">
              {error}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
