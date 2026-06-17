import { Clock, Fuel, Gauge, LockKeyhole, Weight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RouteAssignment, Truck } from "@/data/hauling-screens";

import { Metric, ReadOnlyField } from "./metrics";

function getRoutePositionLabel(assignment: RouteAssignment) {
  const segmentCount = assignment.routeNodes.length - 1;
  const segmentIndex = Math.min(
    Math.floor((Math.max(0, Math.min(assignment.progress, 99.5)) / 100) * segmentCount),
    segmentCount - 1,
  );
  return `${assignment.routeNodes[segmentIndex]} -> ${assignment.routeNodes[segmentIndex + 1]}`;
}

function getLoadState(progress: number) {
  if (progress < 45) return "Perjalanan kosong";
  if (progress < 58) return "Sedang memuat";
  if (progress < 95) return "Perjalanan penuh";
  return "Tiba di gudang";
}

function getTruckAlert(truck: Truck, assignment: RouteAssignment) {
  if (truck.healthScore < 60) return "Risiko perawatan: pantau getaran dan suhu.";
  if (assignment.progress < 45 && assignment.loadingPointId === "LP-B1") {
    return "Antrian memuat dapat menambah 6-9 menit.";
  }
  return "Tidak ada peringatan kritis";
}

export function MonitoringPanel({
  assignment,
  truck,
}: {
  assignment: RouteAssignment;
  truck: Truck;
}) {
  return (
    <aside className="absolute bottom-4 right-4 top-4 z-[600] w-[min(390px,calc(100%-32px))] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-lg)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-text-muted">{assignment.tripId}</p>
          <h2 className="text-heading-md">{truck.id}</h2>
        </div>
        <Badge className="bg-surface-tint-success text-status-ready" variant="outline">
          Active
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="Progres" value={`${Math.round(assignment.progress)}%`} icon={<Gauge />} />
        <Metric
          label="Sisa ETA"
          value={`${Math.max(1, Math.ceil(assignment.etaMin * (1 - assignment.progress / 100)))}m`}
          icon={<Clock />}
        />
        <Metric label="Prediksi BBM" value={`${assignment.fuelLiter} L`} icon={<Fuel />} />
        <Metric label="Muatan Batu Bara" value={`${assignment.coalTon} t`} icon={<Weight />} />
      </div>

      <div className="mt-4 grid gap-3">
        <ReadOnlyField label="Rute" value={assignment.routeLabel} />
        <ReadOnlyField label="Lokasi / Berikutnya" value={getRoutePositionLabel(assignment)} />
        <ReadOnlyField label="Status Muatan" value={getLoadState(assignment.progress)} />
        <ReadOnlyField label="Peringatan" value={getTruckAlert(truck, assignment)} />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3 text-body-sm text-text-subtle">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" />
        Rute terkunci setelah dispatch. Informasi pada panel ini bersifat read-only.
      </div>
    </aside>
  );
}
