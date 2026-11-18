"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type Blocker = { discard: () => void };
type Guard = {
  register: (blocker: Blocker) => () => void;
  confirmNavigation: (proceed: () => void) => boolean;
};
const NavigationGuard = createContext<Guard>({
  register: () => () => {},
  confirmNavigation: () => false,
});
export function useNavigationGuard() {
  return useContext(NavigationGuard);
}

// TypeScript 5.9 does not include the browser Navigation API event types yet.
interface HistoryNavigationEvent extends Event {
  navigationType: string;
  canIntercept: boolean;
  destination: { key: string; url: string; sameDocument: boolean };
}
interface BrowserNavigation {
  addEventListener(
    type: "navigate",
    listener: (event: HistoryNavigationEvent) => void,
  ): void;
  removeEventListener(
    type: "navigate",
    listener: (event: HistoryNavigationEvent) => void,
  ): void;
  traverseTo(key: string): { finished: Promise<unknown> };
}
declare global {
  interface Window {
    navigation?: BrowserNavigation;
  }
}

export function NavigationGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const blocker = useRef<Blocker | null>(null);
  const [pending, setPending] = useState<{ proceed: () => void } | null>(null);
  const register = useCallback((next: Blocker) => {
    blocker.current = next;
    return () => {
      if (blocker.current === next) {
        blocker.current = null;
        // A save can finish while its leave-confirmation dialog is open.
        setPending(null);
      }
    };
  }, []);
  const confirmNavigation = useCallback((proceed: () => void) => {
    if (!blocker.current) return false;
    setPending({ proceed });
    return true;
  }, []);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!blocker.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    const navigation = window.navigation;
    function onTraverse(event: HistoryNavigationEvent) {
      if (
        event.navigationType !== "traverse" ||
        !event.cancelable ||
        !event.canIntercept ||
        !event.destination.sameDocument ||
        !blocker.current
      )
        return;
      const destination = new URL(event.destination.url);
      if (
        destination.pathname === location.pathname &&
        destination.search === location.search
      )
        return;
      event.preventDefault();
      confirmNavigation(() => {
        // Traversal may be aborted by another navigation while the dialog is open.
        void navigation
          ?.traverseTo(event.destination.key)
          .finished.catch(() => {});
      });
    }
    window.addEventListener("beforeunload", beforeUnload);
    navigation?.addEventListener("navigate", onTraverse);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      navigation?.removeEventListener("navigate", onTraverse);
    };
  }, [confirmNavigation]);

  return (
    <NavigationGuard.Provider value={{ register, confirmNavigation }}>
      {children}
      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle className="text-lg font-semibold">
            Unsaved changes
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-3 text-sm leading-6 text-muted-foreground">
            You have unsaved changes. Are you sure you want to leave?
          </AlertDialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AlertDialogCancel onClick={() => setPending(null)}>
              Stay on page
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = pending;
                blocker.current?.discard();
                blocker.current = null;
                setPending(null);
                action?.proceed();
              }}
            >
              Leave without saving
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </NavigationGuard.Provider>
  );
}

export function GuardedLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & {
  href: string;
}) {
  const router = useRouter();
  const guard = useNavigationGuard();
  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        const destination = new URL(href, window.location.href);
        if (
          destination.pathname === location.pathname &&
          destination.search === location.search
        )
          return;
        if (
          guard.confirmNavigation(() => {
            if (props.replace) router.replace(href, { scroll: props.scroll });
            else router.push(href, { scroll: props.scroll });
          })
        )
          event.preventDefault();
      }}
    />
  );
}

export function useUnsavedChanges(dirty: boolean, discard: () => void) {
  const { register } = useNavigationGuard();
  useEffect(() => {
    if (!dirty) return;
    return register({ discard });
  }, [dirty, discard, register]);
}
