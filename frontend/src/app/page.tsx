import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { HaulingWorkspace } from "@/components/hauling/hauling-workspace";

export default function Home() {
  return (
    <AuthGuard>
      <Suspense fallback={<div>Memuat...</div>}>
        <HaulingWorkspace />
      </Suspense>
    </AuthGuard>
  );
}
