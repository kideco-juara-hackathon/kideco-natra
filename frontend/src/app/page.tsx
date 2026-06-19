import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BrandedLoader } from "@/components/layout/branded-loader";
import { HaulingWorkspace } from "@/components/hauling/hauling-workspace";

export default function Home() {
  return (
    <AuthGuard>
      <Suspense fallback={<BrandedLoader />}>
        <HaulingWorkspace />
      </Suspense>
    </AuthGuard>
  );
}
