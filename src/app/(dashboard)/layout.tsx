import { Suspense } from "react";
import { requirePageUser } from "@/features/auth/session";
import { NavigationGuardProvider } from "@/components/navigation-guard";
import { AppSidebar } from "@/components/app-sidebar";
async function Workspace({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return (
    <NavigationGuardProvider>
      <div className="workspace">
        <AppSidebar user={user} />
        <main id="main-content" className="workspace-main">
          {children}
        </main>
      </div>
    </NavigationGuardProvider>
  );
}
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Suspense
        fallback={
          <p className="p-8" role="status">
            Loading workspace…
          </p>
        }
      >
        <Workspace>{children}</Workspace>
      </Suspense>
    </>
  );
}
