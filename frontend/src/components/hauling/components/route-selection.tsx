import { Badge } from "@/components/ui/badge";
import {
  loadingPoints,
  type RouteOption,
} from "@/data/hauling-screens";
import { cn } from "@/lib/utils";

import { CompactMetric } from "./metrics";

function pointById(loadingPointId: string) {
  return loadingPoints.find((point) => point.id === loadingPointId);
}

function routeIntent(option: RouteOption) {
  if (option.id.startsWith("OPTIMAL")) return "Seimbang";
  if (option.id.startsWith("FUEL")) return "Hemat BBM";
  if (option.id.startsWith("QUEUE")) return "Antrian Rendah";
  return "Manual";
}

function riskTone(risk?: string) {
  if (risk === "low") return "bg-surface-tint-success text-status-ready";
  if (risk === "medium") return "bg-surface-tint-warning text-status-monitor";
  return "bg-surface-tint-danger text-status-critical";
}

export function RouteSelection({
  dataSource,
  errorMessage,
  isLoading,
  manualLoadingPointId,
  onManualLoadingPointChange,
  onRouteSelect,
  options,
  selectedRoute,
}: {
  dataSource?: "backend" | "fallback";
  errorMessage?: string | null;
  isLoading?: boolean;
  manualLoadingPointId: string;
  onManualLoadingPointChange: (loadingPointId: string) => void;
  onRouteSelect: (route: RouteOption) => void;
  options: RouteOption[];
  selectedRoute: RouteOption | null;
}) {
  return (
    <div className="grid gap-5">
      <section>
        <div className="mb-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-heading-sm">Rekomendasi Sistem</h3>
            <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-caption font-medium text-text-subtle">
              {isLoading ? "Menghitung..." : dataSource === "backend" ? "Dijkstra backend" : "Fallback lokal"}
            </span>
          </div>
          <p className="text-body-sm text-text-subtle">
            Pilih opsi berdasarkan ETA, BBM, payload, queue, dan score keputusan.
          </p>
          {errorMessage ? (
            <p className="mt-2 rounded-[var(--radius-sm)] bg-surface-tint-warning px-3 py-2 text-caption text-status-monitor">
              Backend belum tersedia, memakai rekomendasi lokal. Detail: {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          {options.map((option) => {
            const point = pointById(option.loadingPointId);

            return (
              <button
                className={cn(
                  "w-full rounded-[var(--radius-md)] border p-4 text-left transition",
                  selectedRoute?.id === option.id
                    ? "border-[var(--brand-primary)] bg-brand-primary-subtle shadow-[0_0_0_3px_var(--brand-primary-subtle)]"
                    : "border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-subtle)]",
                )}
                key={option.id}
                onClick={() => onRouteSelect(option)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{option.label}</p>
                      {option.id === "OPTIMAL-A2" ? <Badge>Direkomendasikan</Badge> : null}
                    </div>
                    <p className="mt-1 text-caption text-text-muted">
                      {routeIntent(option)} / {option.loadingPointId} / Score {option.score}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-caption font-semibold tabular-nums">
                    {option.etaMin}m
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  <CompactMetric label="ETA" value={`${option.etaMin}m`} />
                  <CompactMetric label="BBM" value={`${option.fuelLiter} L`} />
                  <CompactMetric label="Payload" value={`${option.coalTon} t`} />
                  <CompactMetric label="Full" value={`${option.fulfillment}%`} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-caption text-text-subtle">
                    antrian {point?.queue ?? "-"} unit
                  </span>
                  <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-caption text-text-subtle">
                    stock {point?.stockTon ?? "-"} t
                  </span>
                  <span className={cn("rounded-full px-2 py-1 text-caption font-medium", riskTone(point?.risk))}>
                    risiko {point?.risk ?? "sedang"}
                  </span>
                </div>

                <p className="mt-3 text-body-sm text-text-subtle">{option.reason}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border-default)]">
        <div className="border-b border-[var(--border-default)] px-3 py-2">
          <h3 className="text-heading-sm">Perbandingan Cepat</h3>
        </div>
        <div className="grid grid-cols-[1.3fr_0.7fr_0.8fr_0.9fr_0.7fr] gap-2 px-3 py-2 text-caption font-semibold text-text-muted">
          <span>Opsi</span>
          <span>ETA</span>
          <span>BBM</span>
          <span>Muatan</span>
          <span>Score</span>
        </div>
        {options.map((option) => (
          <button
            className={cn(
              "grid w-full grid-cols-[1.3fr_0.7fr_0.8fr_0.9fr_0.7fr] gap-2 border-t border-[var(--border-subtle)] px-3 py-2 text-left text-body-sm hover:bg-[var(--bg-subtle)]",
              selectedRoute?.id === option.id ? "bg-brand-primary-subtle" : "",
            )}
            key={`row-${option.id}`}
            onClick={() => onRouteSelect(option)}
            type="button"
          >
            <span className="truncate font-medium">{routeIntent(option)}</span>
            <span className="tabular-nums">{option.etaMin}m</span>
            <span className="tabular-nums">{option.fuelLiter}L</span>
            <span className="tabular-nums">{option.coalTon}t</span>
            <span className="tabular-nums">{option.score}</span>
          </button>
        ))}
      </section>

      <section className="border-t border-[var(--border-default)] pt-4">
        <h3 className="text-heading-sm">Pilih Loading Point Manual</h3>
        <p className="mb-3 mt-1 text-body-sm text-text-subtle">
          Sistem tetap menghitung jalur terbaik dari Dispatch Point ke titik pilihan lalu Stockpile 1.
        </p>
        <div className="grid gap-2">
          {loadingPoints.map((point) => (
            <button
              className={cn(
                "rounded-[var(--radius-md)] border p-3 text-left transition",
                manualLoadingPointId === point.id || selectedRoute?.id === `MANUAL-${point.id}`
                  ? "border-[var(--brand-primary)] bg-brand-primary-subtle"
                  : "border-[var(--border-default)] hover:border-[var(--brand-primary)]",
              )}
              key={point.id}
              onClick={() => onManualLoadingPointChange(point.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{point.name}</p>
                  <p className="mt-1 text-caption text-text-muted">{point.pit}</p>
                </div>
                <span className={cn("rounded-full px-2 py-1 text-caption font-medium", riskTone(point.risk))}>
                  {point.risk}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <CompactMetric label="Stock" value={`${point.stockTon} t`} />
                <CompactMetric label="Queue" value={`${point.queue}`} />
                <CompactMetric label="ETA dasar" value={`${point.etaMin}m`} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
