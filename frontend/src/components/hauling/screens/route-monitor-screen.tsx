"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  api,
  type TelemetryResponse,
} from "@/lib/api";
import { useCommandCenter } from "@/lib/command-center/use-command-center";
import {
  recommendationsForTruck,
  syntheticTelemetryHistory,
  telemetryForTruck,
} from "@/lib/hauling-telemetry";

import { ETALens } from "./lenses/eta-lens";
import { FuelLens } from "./lenses/fuel-lens";
import { OverviewLens } from "./lenses/overview-lens";
import {
  ETADetailPanel,
  FuelDetailPanel,
  OverviewDetailPanel,
  priorityOrder,
  type VehicleRow,
} from "./lenses/shared";

type LensTab = "overview" | "eta" | "fuel";

export function HaulingRouteMonitorScreen() {
  const cc = useCommandCenter();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<LensTab>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Per-vehicle fuel history, loaded on demand for the Fuel detail panel
  const [history, setHistory] = useState<TelemetryResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [telemetryRes, recsRes] = await Promise.all([
        api.getLatestTelemetry(),
        api.getRecommendations(undefined, "open"),
      ]);

      const rows: VehicleRow[] = cc.trucks.map((truck) => ({
        id: truck.id,
        name: truck.code,
        type: "hauler",
        capacityTon: truck.capacityTon,
        status: truck.status,
        healthScore: truck.healthScore,
        currentNodeId: truck.currentNodeId,
        lat: truck.position.lat,
        lng: truck.position.lng,
        telemetry: telemetryForTruck(telemetryRes, truck, cc.assignments),
        recs: recommendationsForTruck(recsRes, truck.id)
          .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority)),
      }));

      setVehicles(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data Route Monitor.");
    } finally {
      setLoading(false);
    }
  }, [cc.assignments, cc.trucks]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    const interval = window.setInterval(fetchData, 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [fetchData]);

  // Load fuel history whenever the selected unit changes
  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      const truck = cc.trucks.find((item) => item.id === selectedId);
      const assignment = cc.assignments.find((item) => item.truckId === selectedId);
      setLoadingHistory(true);
      setHistory([]);
      api.getTelemetryHistory(selectedId, 5)
        .then((items) => setHistory(items.length > 0 ? items : truck ? syntheticTelemetryHistory(truck, assignment, 5) : []))
        .catch(() => setHistory(truck ? syntheticTelemetryHistory(truck, assignment, 5) : []))
        .finally(() => setLoadingHistory(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [cc.assignments, cc.trucks, selectedId]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-xl shadow-none">
                <CardHeader className="px-5 pb-2 pt-4"><Skeleton className="h-4 w-28" /></CardHeader>
                <CardContent className="px-5 pb-4"><Skeleton className="h-9 w-16" /><Skeleton className="mt-2 h-3 w-32" /></CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-xl shadow-none">
            <CardContent className="space-y-2 px-5 py-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-xl shadow-none">
          <CardContent className="space-y-3 px-5 py-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-none border-red-100 bg-red-50">
        <CardContent className="flex items-center gap-3 px-5 py-4">
          <AlertTriangle className="size-4 shrink-0 text-[var(--danger-700)]" />
          <span className="text-sm text-[var(--danger-700)]">{error}</span>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={fetchData}>Coba lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">

      {/* ── LEFT: lens tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as LensTab)}
        className="gap-3"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="eta">ETA</TabsTrigger>
          <TabsTrigger value="fuel">Konsumsi BBM</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewLens vehicles={vehicles} selectedId={selectedId} onSelect={setSelectedId} />
        </TabsContent>
        <TabsContent value="eta">
          <ETALens vehicles={vehicles} selectedId={selectedId} onSelect={setSelectedId} />
        </TabsContent>
        <TabsContent value="fuel">
          <FuelLens vehicles={vehicles} selectedId={selectedId} onSelect={setSelectedId} />
        </TabsContent>
      </Tabs>

      {/* ── RIGHT: shared detail panel (follows active lens + selected unit) ── */}
      <div>
        {selectedVehicle ? (
          activeTab === "eta" ? (
            <ETADetailPanel vehicle={selectedVehicle} />
          ) : activeTab === "fuel" ? (
            <FuelDetailPanel vehicle={selectedVehicle} history={history} loadingHistory={loadingHistory} />
          ) : (
            <OverviewDetailPanel vehicle={selectedVehicle} />
          )
        ) : (
          <Card className="rounded-xl shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Gauge className="size-8" />
              <p className="text-sm">Pilih unit dari tabel untuk melihat detail.</p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
