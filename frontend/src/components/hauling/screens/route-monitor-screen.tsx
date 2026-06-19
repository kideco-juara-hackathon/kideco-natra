"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Gauge } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { buildHaulingVehicleRow } from "@/lib/hauling-vehicle-rows";

import { ETALens } from "./lenses/eta-lens";
import { FuelLens } from "./lenses/fuel-lens";
import { OverviewLens } from "./lenses/overview-lens";
import {
  ETADetailPanel,
  FuelDetailPanel,
  OverviewDetailPanel,
  healthBarClass,
  healthText,
  healthTier,
  priorityOrder,
  statusLabel,
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
  const [sheetOpen, setSheetOpen] = useState(false);

  // Per-vehicle fuel history, loaded on demand for the Fuel detail panel
  const [history, setHistory] = useState<TelemetryResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Refs so fetchData and history effect don't re-register the interval on every cc tick
  const ccTrucksRef = useRef(cc.trucks);
  const ccAssignmentsRef = useRef(cc.assignments);
  useEffect(() => { ccTrucksRef.current = cc.trucks; }, [cc.trucks]);
  useEffect(() => { ccAssignmentsRef.current = cc.assignments; }, [cc.assignments]);

  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // Throttle history fetches: only every 5th poll (~10s)
  const pollCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const [telemetryRes, recsRes] = await Promise.all([
        api.getLatestTelemetry(),
        api.getRecommendations(undefined, "open"),
      ]);

      const trucks = ccTrucksRef.current;
      const assignments = ccAssignmentsRef.current;

      const rows: VehicleRow[] = trucks.map((truck) => {
        const assignment = assignments.find((a) => a.truckId === truck.id);
        const telemetry = telemetryForTruck(telemetryRes, truck, assignments);
        const recommendations = recommendationsForTruck(recsRes, truck.id)
          .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));
        return buildHaulingVehicleRow({
          truck,
          telemetry,
          recommendations,
          assignment,
        });
      });

      setVehicles(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
      setError(null);

      // Throttle history fetch to every 5th poll
      pollCountRef.current += 1;
      if (pollCountRef.current % 5 === 1) {
        const sid = selectedIdRef.current;
        if (sid) {
          const truck = trucks.find((item) => item.id === sid);
          const assignment = assignments.find((item) => item.truckId === sid);
          setLoadingHistory(true);
          api.getTelemetryHistory(sid, 5)
            .then((items) => setHistory(items.length > 0 ? items : truck ? syntheticTelemetryHistory(truck, assignment, 5) : []))
            .catch(() => setHistory(truck ? syntheticTelemetryHistory(truck, assignment, 5) : []))
            .finally(() => setLoadingHistory(false));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data Route Monitor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    const interval = window.setInterval(fetchData, 2_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [fetchData]);

  // Reload history immediately when user switches selected unit
  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      const truck = ccTrucksRef.current.find((item) => item.id === selectedId);
      const assignment = ccAssignmentsRef.current.find((item) => item.truckId === selectedId);
      setLoadingHistory(true);
      setHistory([]);
      api.getTelemetryHistory(selectedId, 5)
        .then((items) => setHistory(items.length > 0 ? items : truck ? syntheticTelemetryHistory(truck, assignment, 5) : []))
        .catch(() => setHistory(truck ? syntheticTelemetryHistory(truck, assignment, 5) : []))
        .finally(() => setLoadingHistory(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;
  const selectedRouteLabel = selectedId
    ? cc.assignments.find((a) => a.truckId === selectedId)?.routeLabel ?? null
    : null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3">
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
    <>
      <div className="grid grid-cols-1 gap-3">
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
            <OverviewLens vehicles={vehicles} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="eta">
            <ETALens vehicles={vehicles} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="fuel">
            <FuelLens vehicles={vehicles} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col overflow-hidden p-0 sm:max-w-[480px]">
          <SheetHeader className="shrink-0 border-b p-5 pb-4">
            <SheetTitle className="text-lg">
              {selectedVehicle?.id ?? "Detail Unit"}
            </SheetTitle>
            {selectedVehicle && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline">{statusLabel(selectedVehicle.status)}</Badge>
                <Badge
                  variant="outline"
                  className={healthText(selectedVehicle.healthScore)}
                >
                  Health {selectedVehicle.healthScore}
                </Badge>
              </div>
            )}
            {selectedVehicle && selectedRouteLabel && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs text-muted-foreground">{selectedRouteLabel}</p>
                <Progress
                  value={selectedVehicle.progress ?? 0}
                  className={`h-2 ${healthBarClass(healthTier(selectedVehicle.healthScore))}`}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {selectedVehicle.progress ?? 0}% selesai
                </p>
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            {selectedVehicle ? (
              activeTab === "eta" ? (
                <ETADetailPanel vehicle={selectedVehicle} />
              ) : activeTab === "fuel" ? (
                <FuelDetailPanel vehicle={selectedVehicle} history={history} loadingHistory={loadingHistory} />
              ) : (
                <OverviewDetailPanel vehicle={selectedVehicle} />
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <Gauge className="size-8" />
                <p className="text-sm">Pilih unit dari tabel untuk melihat detail.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
