import { Sparkles, MapPinned, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getRouteOptions,
  loadingPoints,
  type Truck as TruckData,
} from "@/data/hauling-screens";

function loadingPointName(id: string) {
  return loadingPoints.find((point) => point.id === id)?.name ?? id;
}

export function TruckSummary({
  truck,
  onAssignRoute,
}: {
  truck: TruckData;
  onAssignRoute: () => void;
}) {
  const recommendedRoute = getRouteOptions(truck)[0];

  // Calculate distance
  const distanceMeter =
    (recommendedRoute.emptyRoute.distanceMeter ?? 0) +
    (recommendedRoute.loadedRoute.distanceMeter ?? 0);
  const distanceKm =
    distanceMeter > 0
      ? (distanceMeter / 1000).toFixed(1).replace(".", ",")
      : "4,2";

  // Circular progress variables
  const radius = 15;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (truck.healthScore / 100) * circumference;

  // Health quality label
  const healthLabel =
    truck.healthScore >= 85
      ? "Baik"
      : truck.healthScore >= 70
        ? "Cukup"
        : "Kurang";
  const healthColor =
    truck.healthScore >= 85
      ? "text-emerald-600 dark:text-emerald-400"
      : truck.healthScore >= 70
        ? "text-amber-500"
        : "text-red-500";
  const ringColor =
    truck.healthScore >= 85
      ? "stroke-emerald-500"
      : truck.healthScore >= 70
        ? "stroke-amber-500"
        : "stroke-red-500";

  return (
    <div className="flex flex-col gap-4 text-[var(--text-default)]">
      {/* 2-Column Grid (Kapasitas & Health Score) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Kapasitas */}
        <div className="rounded-xl border border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
          <p className="text-[12px] font-semibold text-[var(--text-muted)]">
            Kapasitas
          </p>
          <p className="text-xl font-bold text-[var(--text-default)] mt-1">
            {truck.capacityTon} ton
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Muatan</p>
        </div>

        {/* Health Score */}
        <div className="rounded-xl border border-[var(--border-default)] p-3 bg-[var(--bg-surface)] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[var(--text-muted)]">
              Skor Kesehatan
            </p>
            <p className="text-xl font-bold text-[var(--text-default)] mt-1 leading-none">
              {truck.healthScore}/100
            </p>
            <p
              className={`text-[12px] font-bold mt-1 leading-none ${healthColor}`}
            >
              {healthLabel}
            </p>
          </div>

          {/* SVG Progress Circle */}
          <div className="relative size-10 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="20"
                cy="20"
                r={radius}
                className="stroke-[var(--border-subtle)] fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Foreground progress ring */}
              <circle
                cx="20"
                cy="20"
                r={radius}
                className={`fill-none transition-all duration-500 ${ringColor}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Lokasi Saat Ini Box */}
      <div className="rounded-xl border border-[var(--border-default)] p-4 bg-[var(--bg-surface)] flex flex-col gap-3">
        <div>
          <p className="text-[12px] font-semibold text-[var(--text-muted)]">
            Lokasi Saat Ini
          </p>
          <div className="mt-2 flex items-center gap-2">
            <MapPinned className="size-4.5 text-[var(--text-subtle)]" />
            <span className="text-[14px] font-bold text-[var(--text-default)]">
              Dispatch Point
            </span>
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">
            Node saat ini
          </span>
          <span className="rounded-full bg-emerald-50 border border-emerald-200/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            Siap Dispatch
          </span>
        </div>
      </div>

      {/* Rekomendasi Awal Box */}
      <div className="rounded-xl border border-[var(--border-default)] p-4 bg-[var(--bg-surface)] flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-amber-500">In
          <span className="text-[12px] font-bold text-[var(--text-default)]">
            Rekomendasi Awal
          </span>
        </div>

        <p className="text-body-sm text-[var(--text-muted)] leading-relaxed font-medium">
          Berdasarkan kondisi jalan, antrian, dan jarak, kami merekomendasikan
          rute ke{" "}
          <strong className="font-bold text-[var(--text-default)]">
            {loadingPointName(recommendedRoute.loadingPointId)}
          </strong>{" "}
          melalui{" "}
          <strong className="font-bold text-[var(--text-default)]">
            Rute {recommendedRoute.id}
          </strong>
          .
        </p>

        {/* 3-Column Metrics */}
        <div className="border-t border-[var(--border-subtle)] pt-2.5 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] leading-none">
              Jarak
            </p>
            <p className="mt-1.5 text-[12px] font-bold text-[var(--text-default)] truncate">
              {distanceKm} km
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] leading-none">
              ETA
            </p>
            <p className="mt-1.5 text-[12px] font-bold text-[var(--text-default)] truncate">
              {recommendedRoute.etaMin} min
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] leading-none">
              Est. Muatan
            </p>
            <p className="mt-1.5 text-[12px] font-bold text-[var(--text-default)] truncate">
              {recommendedRoute.coalTon} ton
            </p>
          </div>
        </div>
      </div>

      {/* Cari Rute Optimal Button */}
      <Button
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--kideco-red-500)] hover:bg-[var(--kideco-red-600)] text-white py-3 font-semibold transition active:scale-[0.98] cursor-pointer"
        onClick={onAssignRoute}
      >
        <Search className="size-4" />
        Cari Rute Optimal
      </Button>
    </div>
  );
}
