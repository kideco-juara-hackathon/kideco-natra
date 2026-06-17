import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RouteAssignment } from "@/data/hauling-screens";

export function DispatchSuccess({
  assignment,
  onOpenOverview,
}: {
  assignment: RouteAssignment | null;
  onOpenOverview: () => void;
}) {
  return (
    <div className="grid min-h-[420px] place-content-center gap-5 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-tint-success text-status-ready">
        <Check className="size-7" />
      </div>
      <div>
        <h3 className="text-heading-md">Truk mulai berjalan</h3>
        <p className="mt-2 text-body-sm text-text-subtle">
          {assignment?.tripId} sudah aktif. Unit tidak lagi tersedia di Rencana Rute.
        </p>
      </div>
      <Button onClick={onOpenOverview}>
        Lihat di Overview
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
