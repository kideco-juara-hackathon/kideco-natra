import { CircleCheck, Clock3, MapPin, Truck } from "lucide-react";

import { loadingPoints, type RouteOption, type Truck as TruckData } from "@/data/hauling-screens";
import { cn } from "@/lib/utils";

function bestQueuePoint() {
  return [...loadingPoints].sort((a, b) => a.queue - b.queue)[0];
}

function recommendedTruck(trucks: TruckData[]) {
  return [...trucks].sort((a, b) => b.healthScore - a.healthScore || b.capacityTon - a.capacityTon)[0];
}

export function RouteCommandStrip({
  idleTrucks,
  selectedRoute,
  selectedTruck,
}: {
  idleTrucks: TruckData[];
  selectedRoute: RouteOption | null;
  selectedTruck: TruckData | null;
}) {
  const queuePoint = bestQueuePoint();
  const nextTruck = recommendedTruck(idleTrucks);

  const items = [
    {
      icon: <Truck className="size-4" />,
      label: "Idle",
      value: `${idleTrucks.length} unit`,
    },
    {
      icon: <CircleCheck className="size-4" />,
      label: "Rekomendasi unit",
      value: selectedTruck?.id ?? nextTruck?.id ?? "-",
    },
    {
      icon: <Clock3 className="size-4" />,
      label: "Queue terbaik",
      value: queuePoint ? `${queuePoint.id} / ${queuePoint.queue} unit` : "-",
    },
    {
      icon: <MapPin className="size-4" />,
      label: "Draft rute",
      value: selectedRoute ? `${selectedRoute.loadingPointId} / ${selectedRoute.etaMin}m` : "Belum dipilih",
    },
  ];

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-4 z-[500] hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]/95 p-2 shadow-[var(--shadow-md)] backdrop-blur md:grid md:grid-cols-4",
        selectedTruck
          ? "left-20 right-[470px]"
          : "left-1/2 w-[min(760px,calc(100%-220px))] -translate-x-1/2",
      )}
    >
      {items.map((item) => (
        <div
          className="flex min-w-0 items-center gap-2 border-r border-[var(--border-subtle)] px-3 py-2 last:border-r-0"
          key={item.label}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
            {item.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-caption text-[var(--text-muted)]">{item.label}</span>
            <span className="block truncate text-body-sm font-semibold text-[var(--text-default)]">
              {item.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
