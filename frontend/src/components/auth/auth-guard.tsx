"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { BrandedLoader } from "@/components/layout/branded-loader";
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
    return <BrandedLoader message="Memeriksa sesi dispatcher…" />;
  }

  return children;
}
