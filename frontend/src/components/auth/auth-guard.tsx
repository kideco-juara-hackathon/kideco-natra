"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { hasPrototypeSession } from "@/lib/prototype-auth";

const subscribeToHydration = () => () => undefined;

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const authorized = hydrated && hasPrototypeSession();

  useEffect(() => {
    if (hydrated && !authorized) router.replace("/login");
  }, [authorized, hydrated, router]);

  if (!authorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--bg-app-frame)]">
        <div className="flex items-center gap-3 text-body-sm text-[var(--text-subtle)]">
          <span className="size-2 animate-pulse rounded-full bg-[var(--brand-primary)]" />
          Memeriksa sesi dispatcher...
        </div>
      </main>
    );
  }

  return children;
}
