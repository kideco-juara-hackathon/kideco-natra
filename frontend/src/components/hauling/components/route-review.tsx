import { ArrowLeft, Clock, Fuel, Gauge, ShieldAlert, Truck, Weight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadingPoints, type RouteOption, type Truck as TruckData } from "@/data/hauling-screens";

function ReviewMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        <p className="text-body-sm font-bold text-[var(--text-default)] mt-1.5 leading-none">
          {value}
        </p>
      </div>
      <div className="size-8 flex shrink-0 items-center justify-center rounded-full text-[var(--text-subtle)] bg-[var(--bg-subtle)]/40">
        {icon}
      </div>
    </div>
  );
}

export function RouteReview({
  onBack,
  onDispatch,
  route,
  truck,
}: {
  onBack: () => void;
  onDispatch: () => void;
  route: RouteOption;
  truck: TruckData;
}) {
  const loadingPoint = loadingPoints.find((point) => point.id === route.loadingPointId);

  return (
    <div className="flex flex-col gap-4 text-[var(--text-default)]">
      <button
        className="inline-flex items-center gap-2 text-[12px] font-semibold text-text-subtle hover:text-foreground self-start transition"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="size-4" />
        Ubah pilihan
      </button>

      <div>
        <Badge variant="outline" className="border-[var(--border-default)] text-[10px]">Tinjauan Akhir</Badge>
        <h3 className="mt-2 text-lg font-bold text-[var(--text-default)]">{route.label}</h3>
        <p className="mt-1 text-body-sm text-[var(--text-muted)] font-medium">
          {truck.id} / Dispatch Point -&gt; {route.loadingPointId} -&gt; Stockpile 1
        </p>
      </div>

      <div className="rounded-xl border border-[var(--kideco-red-400)] bg-[var(--kideco-red-50)]/10 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--kideco-red-600)]">
          Ringkasan Keputusan
        </p>
        <p className="mt-2 text-body-sm text-[var(--text-default)] leading-relaxed font-medium">
          {route.reason} Target muatan {route.coalTon} ton dengan pemenuhan {route.fulfillment}%.
          Rute akan dipakai sebagai trip aktif setelah dispatcher menekan Dispatch Truck.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        <ReviewMetric label="ETA" value={`${route.etaMin} min`} icon={<Clock className="size-4" />} />
        <ReviewMetric label="Prediksi BBM" value={`${route.fuelLiter} L`} icon={<Fuel className="size-4" />} />
        <ReviewMetric label="Muatan Batu Bara" value={`${route.coalTon} ton`} icon={<Weight className="size-4" />} />
        <ReviewMetric label="Pemenuhan" value={`${route.fulfillment}%`} icon={<Gauge className="size-4" />} />
        <ReviewMetric label="Antrian" value={`${loadingPoint?.queue ?? "-"} unit`} icon={<Clock className="size-4" />} />
        <ReviewMetric label="Risiko Jalan" value={loadingPoint?.risk ?? "sedang"} icon={<ShieldAlert className="size-4" />} />
      </div>

      <RouteLegSequence
        label={`Rute kosong / ${route.emptyRoute.etaMin} min / ${route.emptyRoute.fuelLiter} L`}
        nodes={route.emptyRoute.routeNodes}
      />

      <RouteLegSequence
        label={`Rute bermuatan / ${route.loadedRoute.etaMin} min / ${route.loadedRoute.fuelLiter} L`}
        nodes={route.loadedRoute.routeNodes}
      />

      <div className="rounded-xl bg-amber-50/50 border border-amber-200/50 p-3.5 text-body-sm font-medium text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
        Rute akan terkunci setelah dispatch. Trip hanya dapat dipantau dari Hauling Overview.
      </div>

      <Button
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--kideco-red-500)] hover:bg-[var(--kideco-red-600)] text-white py-3 font-semibold transition active:scale-[0.98] cursor-pointer"
        onClick={onDispatch}
      >
        <Truck className="size-4" />
        Dispatch Truck
      </Button>
    </div>
  );
}

function RouteLegSequence({ label, nodes }: { label: string; nodes: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] p-4 flex flex-col gap-3 bg-[var(--bg-surface)]">
      <p className="text-[12px] font-semibold text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 flex flex-col">
        {nodes.map((node, index) => (
          <div className="relative flex min-h-[44px] items-start gap-3" key={`${label}-${node}-${index}`}>
            {index < nodes.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[9px] top-5 h-[calc(100%-10px)] w-px bg-[var(--border-subtle)]"
              />
            ) : null}
            <div className="relative z-10 grid size-5 shrink-0 place-items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[10px] font-bold text-[var(--text-default)] shadow-[var(--shadow-sm)]">
              {index + 1}
            </div>
            <div className="min-w-0 pb-3 flex flex-col">
              <span className="text-[13px] font-semibold text-[var(--text-default)] leading-none mt-0.5">{node}</span>
              {index < nodes.length - 1 ? (
                <span className="text-[10px] text-[var(--text-muted)] mt-1">
                  lanjut ke waypoint berikutnya
                </span>
              ) : (
                <span className="text-[10px] text-[var(--text-muted)] mt-1">Akhir leg</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

