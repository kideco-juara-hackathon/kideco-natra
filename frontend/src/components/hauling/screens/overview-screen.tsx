"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Cell, Line, LineChart as RechartsLineChart, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Fuel,
  Gauge,
  HeartPulse,
  LineChart,
  MapPin,
  PauseCircle,
  PieChart as FleetIcon,
  RefreshCw,
  Sparkles,
  Target,
  Truck,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  api,
  type NodeResponse,
  type RecommendationResponse,
  type TelemetryResponse,
  type VehicleResponse,
} from "@/lib/api";
import { useCommandCenter } from "@/lib/command-center/use-command-center";
import {
  recommendationsForFleet,
  syntheticTelemetryHistory,
  telemetryByTruck,
} from "@/lib/hauling-telemetry";

import {
  BASELINE_EMPTY_LPH,
  BASELINE_FULL_LPH,
  n,
  priorityOrder,
} from "./lenses/shared";
import { MiniFleetMapShell } from "./mini-fleet-map-shell";

function statusClass(status: string) {
  if (status === "active") return "bg-sky-50 text-sky-700";
  if (status === "idle") return "bg-emerald-50 text-emerald-700";
  return "bg-red-50 text-red-700";
}

function statusLabel(status: string) {
  if (status === "active") return "Bergerak";
  if (status === "idle") return "Standby";
  return "Perawatan";
}

function priorityBadgeClass(priority: string) {
  if (priority === "critical") {
    return "border-transparent bg-[var(--danger-50)] text-[var(--danger-700)]";
  }
  if (priority === "high") {
    return "border-transparent bg-[var(--warning-50)] text-[var(--warning-700)]";
  }
  if (priority === "medium") {
    return "border-transparent bg-[var(--info-50)] text-[var(--info-700)]";
  }
  return "border-transparent bg-muted text-muted-foreground";
}

function healthBadge(score: number) {
  if (score >= 80) {
    return {
      label: "Baik",
      className: "bg-[var(--success-50)] text-[var(--success-700)]",
    };
  }
  if (score >= 60) {
    return {
      label: "Monitor",
      className: "bg-[var(--warning-50)] text-[var(--warning-700)]",
    };
  }
  return {
    label: "Kritis",
    className: "bg-[var(--danger-50)] text-[var(--danger-700)]",
  };
}

function KpiCard({
  icon,
  label,
  value,
  caption,
  progress,
  progressClass,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  caption: string;
  progress?: number;
  progressClass?: string;
  badge?: { label: string; className: string };
}) {
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="px-4 pb-1 pt-3">
        <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          {icon}
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <p className="text-[11px] text-muted-foreground">{caption}</p>
        {typeof progress === "number" && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <Progress value={progress} className={`h-1.5 flex-1 ${progressClass ?? ""}`} />
            <span className="text-[11px] font-bold text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        )}
        {badge && (
          <Badge className={`mt-2 border-transparent ${badge.className}`}>{badge.label}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function SnapshotCard({
  icon,
  title,
  value,
  unit,
  caption,
  children,
  onDetail,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  caption: string;
  children?: React.ReactNode;
  onDetail?: () => void;
}) {
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-none flex flex-col justify-between h-full min-w-0">
      <CardHeader className="px-4 pb-1 pt-3">
        <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          {icon}
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">{value}</span>
              {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
            </div>
            <p className="text-xs text-muted-foreground">{caption}</p>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {children}
          </div>
        </div>
        {onDetail && (
          <Button size="sm" onClick={onDetail} className="mt-3 w-full text-xs">
            Lihat Detail
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function HaulingOverviewScreen({
  onOpenRouteIntelligence,
  onOpenMaintenance,
}: {
  onOpenRouteIntelligence?: () => void;
  onOpenMaintenance?: (truckId?: string) => void;
} = {}) {
  const cc = useCommandCenter();

  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [nodes, setNodes] = useState<NodeResponse[]>([]);
  const [latestTelemetry, setLatestTelemetry] = useState<Record<string, TelemetryResponse>>({});
  const [fuelSpark, setFuelSpark] = useState<{ i: number; v: number }[]>([]);
  const [speedSpark, setSpeedSpark] = useState<{ i: number; v: number }[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const ccTrucksRef = useRef(cc.trucks);
  const ccAssignmentsRef = useRef(cc.assignments);
  useEffect(() => { ccTrucksRef.current = cc.trucks; }, [cc.trucks]);
  useEffect(() => { ccAssignmentsRef.current = cc.assignments; }, [cc.assignments]);

  const pollCountRef = useRef(0);
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [recData, nodeData, telemetryData] = await Promise.all([
        api.getRecommendations(),
        api.getNodes(),
        api.getLatestTelemetry(),
      ]);

      setRecommendations(recData);
      setNodes(nodeData);
      setLatestTelemetry(telemetryByTruck(telemetryData, ccTrucksRef.current, ccAssignmentsRef.current));
      setError(null);
      setLastUpdated(new Date());

      pollCountRef.current += 1;
      if (pollCountRef.current % 5 === 1) {
        const histories = await Promise.all(
          ccTrucksRef.current.map((truck) => {
            const assignment = ccAssignmentsRef.current.find((item) => item.truckId === truck.id);
            return api
              .getTelemetryHistory(truck.id, 12)
              .then((items) => items.length > 0 ? items : syntheticTelemetryHistory(truck, assignment, 12))
              .catch(() => syntheticTelemetryHistory(truck, assignment, 12));
          }),
        );
        const nonEmpty = histories.filter((h) => h.length > 0);
        const minLen = nonEmpty.length > 0 ? Math.min(...nonEmpty.map((h) => h.length)) : 0;
        const fuelSeries: { i: number; v: number }[] = [];
        const speedSeries: { i: number; v: number }[] = [];

        for (let i = 0; i < minLen; i += 1) {
          const fuelVals = nonEmpty
            .map((h) => h[i].fuelRateLph)
            .filter((v): v is number => v !== null);
          const speedVals = nonEmpty
            .map((h) => h[i].speedKmh)
            .filter((v): v is number => v !== null);

          if (fuelVals.length > 0) {
            fuelSeries.push({ i, v: fuelVals.reduce((sum, v) => sum + v, 0) / fuelVals.length });
          }
          if (speedVals.length > 0) {
            speedSeries.push({ i, v: speedVals.reduce((sum, v) => sum + v, 0) / speedVals.length });
          }
        }

        setFuelSpark(fuelSeries);
        setSpeedSpark(speedSeries);
      }
    } catch {
      setError("Gagal terhubung ke backend. Pastikan server berjalan di port 8000.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(() => fetchData(), 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.resolveRecommendation(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // The recommendation remains visible so the dispatcher can retry.
    } finally {
      setResolvingId(null);
    }
  };

  const operationVehicles: VehicleResponse[] = useMemo(() => {
    const order = ["DT-03", "DT-04", "DT-05", "DT-02", "DT-01"];
    return cc.trucks.map((truck) => ({
      id: truck.id,
      name: truck.code,
      type: "hauler",
      capacityTon: truck.capacityTon,
      status: truck.status,
      healthScore: truck.healthScore,
      currentNodeId: truck.currentNodeId,
      lat: truck.position.lat,
      lng: truck.position.lng,
    })).sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
  }, [cc.trucks]);

  const operationTotal = operationVehicles.length;
  const operationActive = operationVehicles.filter((v) => v.status === "active").length;
  const operationIdle = operationVehicles.filter((v) => v.status === "idle").length;
  const operationMaintenance = operationVehicles.filter((v) => v.status === "maintenance" || v.healthScore < 60).length;
  const operationAverageHealth =
    operationTotal > 0
      ? Math.round(operationVehicles.reduce((sum, v) => sum + v.healthScore, 0) / operationTotal)
      : 0;
  const operationAlertUnits = operationVehicles
    .filter((v) => v.healthScore < 75)
    .sort((a, b) => a.healthScore - b.healthScore);
  const topWatchTruck = operationAlertUnits[0];
  const fleetHealth = healthBadge(operationAverageHealth);
  const alertsOk = operationAlertUnits.length === 0;

  const dispatchReady = operationVehicles.filter((v) => v.status === "idle" && v.healthScore >= 70).length;
  const dispatchReadinessPercent = operationTotal > 0 ? Math.round((dispatchReady / operationTotal) * 100) : 0;
  const dispatchTone = dispatchReadinessPercent >= 80
    ? { label: "Siap", className: "bg-[var(--success-50)] text-[var(--success-700)]" }
    : { label: "Perlu Monitor", className: "bg-[var(--warning-50)] text-[var(--warning-700)]" };

  const pieData =
    operationTotal > 0
      ? [
          {
            name: "Bergerak",
            value: Math.round((operationActive / operationTotal) * 100),
            color: "var(--success-600)",
          },
          {
            name: "Standby",
            value: Math.round((operationIdle / operationTotal) * 100),
            color: "var(--warning-500)",
          },
          {
            name: "Maintenance",
            value: Math.round((operationMaintenance / operationTotal) * 100),
            color: "var(--danger-500)",
          },
        ]
      : [
          { name: "Bergerak", value: 0, color: "var(--success-600)" },
          { name: "Standby", value: 0, color: "var(--warning-500)" },
          { name: "Maintenance", value: 0, color: "var(--danger-500)" },
        ];

  const efisiensiPersen = pieData.find((item) => item.name === "Bergerak")?.value ?? 0;

  const totalFuelKL = operationVehicles.length > 0
    ? Number((operationVehicles.reduce((sum, v) => {
        const ccTruck = cc.trucks.find(t => t.id === v.id);
        const pct = ccTruck?.fuelLevelPercent ?? 0;
        return sum + pct;
      }, 0) * 8.16 / 100).toFixed(1))
    : 0;

  const avgFuelKL = operationVehicles.length > 0
    ? Number((totalFuelKL / operationVehicles.length).toFixed(2))
    : 0;

  const haulerIds = new Set(operationVehicles.map((v) => v.id));
  const haulerTelemetry = Object.values(latestTelemetry).filter((t) => haulerIds.has(t.vehicleId));
  const fuelSamples = haulerTelemetry.filter((t) => t.fuelRateLph !== null);
  const avgFuelRate =
    fuelSamples.length > 0
      ? fuelSamples.reduce((sum, t) => sum + n(t.fuelRateLph), 0) / fuelSamples.length
      : null;
  const baselineAvg =
    fuelSamples.length > 0
      ? fuelSamples.reduce(
          (sum, t) => sum + (t.loadState === "Full" ? BASELINE_FULL_LPH : BASELINE_EMPTY_LPH),
          0,
        ) / fuelSamples.length
      : null;
  const fuelDeltaPercent =
    avgFuelRate !== null && baselineAvg
      ? Math.round(((avgFuelRate - baselineAvg) / baselineAvg) * 100)
      : null;
  const speedSamples = haulerTelemetry.filter((t) => t.speedKmh !== null);
  const avgSpeed =
    speedSamples.length > 0
      ? speedSamples.reduce((sum, t) => sum + n(t.speedKmh), 0) / speedSamples.length
      : null;

  const sortedRecs = recommendationsForFleet(recommendations, cc.trucks).sort((a, b) => {
    const diff = priorityOrder(a.priority) - priorityOrder(b.priority);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const activeRecs = sortedRecs.filter((r) => r.priority !== "critical").slice(0, 2);
  const recentActivity = sortedRecs.slice(0, 4);

  const formattedTime = lastUpdated
    ? `${lastUpdated.toLocaleTimeString("id-ID", { hour12: false })} WIB`
    : "--";

  const nodeName = (nodeId?: string | null) => {
    if (!nodeId) return "--";
    return nodes.find((node) => node.id === nodeId)?.name ?? nodeId;
  };

  const systemActivities = [
    ...cc.assignments.slice(0, 2).map((assignment, index) => ({
      timeOffset: index * 5 + 1,
      text: `${assignment.truckId} menjalankan ${assignment.routeLabel}`,
      color: "bg-emerald-500",
    })),
    ...operationAlertUnits.slice(0, 2).map((vehicle, index) => ({
      timeOffset: index * 7 + 4,
      text: `${vehicle.id} masuk watchlist maintenance (health ${vehicle.healthScore})`,
      color: vehicle.healthScore < 60 ? "bg-red-500" : "bg-amber-500",
    })),
    ...cc.idleTrucks.slice(0, 2).map((truck, index) => ({
      timeOffset: index * 6 + 9,
      text: `${truck.id} standby di ${nodeName(truck.currentNodeId)}`,
      color: "bg-amber-500",
    })),
  ].slice(0, 5);

  if (loading && !refreshing) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <RefreshCw className="size-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat data operasional KIDECO...</p>
      </div>
    );
  }

  // Helper for route details from the shared Command Center assignments.
  const getRouteInfo = (vehId: string) => {
    const assignment = cc.assignments.find((item) => item.truckId === vehId);
    if (!assignment) {
      return {
        route: "--",
        path: nodeName(cc.trucks.find((truck) => truck.id === vehId)?.currentNodeId),
        speed: "0 km/jam",
      };
    }

    const speed = latestTelemetry[vehId]?.speedKmh;
    return {
      route: assignment.routeLabel,
      path: `${nodeName(assignment.originNodeId)} -> ${nodeName(assignment.loadingPointId)} -> ${nodeName(assignment.dumpPointId)}`,
      speed: speed !== null && speed !== undefined ? `${Math.round(speed)} km/jam` : "--",
    };
  };

  // Helper for dynamic ETA formatting relative to Command Center progress.
  const getEtaText = (vehId: string, status: string) => {
    const assignment = cc.assignments.find((item) => item.truckId === vehId);
    if (status !== "active" || !assignment) {
      return { time: "--", remaining: "" };
    }
    const baseDate = lastUpdated ?? new Date();
    const remainingFactor = Math.max(0, 100 - assignment.progress) / 100;
    const addMins = Math.max(1, Math.round(assignment.etaMin * remainingFactor));
    const etaDate = new Date(baseDate.getTime() + addMins * 60000);
    const timeStr = etaDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    return { time: timeStr, remaining: `${addMins} menit lagi` };
  };

  // Helper for dynamic Activity Feed timestamps
  const getFeedTime = (offsetMinutes: number) => {
    const baseDate = lastUpdated || new Date();
    const date = new Date(baseDate.getTime() - offsetMinutes * 60000);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* AI Recommendation Banner */}
      <Card className="gap-0 rounded-xl py-0 shadow-none">
        <CardContent className="flex min-h-[56px] items-center gap-3 px-4 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
            <Bot className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-[var(--brand-primary)] uppercase tracking-wider leading-none mb-0.5">
              AI Rekomendasi
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground leading-tight">
                {topWatchTruck
                  ? `${topWatchTruck.id} perlu dipantau sebelum dispatch berikutnya.`
                  : "Operasional normal. Tidak ada rekomendasi aktif saat ini."}
              </p>
              <Badge
                className={`border-transparent text-[11px] font-semibold px-2 py-0.5 ${
                  alertsOk
                    ? "bg-[var(--success-50)] text-[var(--success-700)] hover:bg-[var(--success-50)]"
                    : "bg-[var(--warning-50)] text-[var(--warning-700)] hover:bg-[var(--warning-50)]"
                }`}
              >
                {alertsOk ? "Normal" : "Monitor"}
              </Badge>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--success-500)] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--success-500)]" />
            </span>
            Terakhir diperbarui: {formattedTime}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Row */}
      <section className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          icon={<Truck className="size-4 text-muted-foreground" />}
          label="Unit Bergerak"
          value={operationActive}
          caption={`dari ${operationTotal} unit`}
          progress={operationTotal > 0 ? (operationActive / operationTotal) * 100 : 0}
          progressClass="[&>div]:bg-foreground"
        />
        <KpiCard
          icon={<PauseCircle className="size-4 text-[var(--warning-600)]" />}
          label="Unit Standby"
          value={operationIdle}
          caption={`dari ${operationTotal} unit`}
          progress={operationTotal > 0 ? (operationIdle / operationTotal) * 100 : 0}
          progressClass="[&>div]:bg-[var(--warning-500)]"
        />
        <KpiCard
          icon={<Wrench className="size-4 text-[var(--info-600)]" />}
          label="Unit Maintenance"
          value={operationMaintenance}
          caption={`dari ${operationTotal} unit`}
          progress={operationTotal > 0 ? (operationMaintenance / operationTotal) * 100 : 0}
          progressClass="[&>div]:bg-[var(--info-500)]"
        />
        <KpiCard
          icon={<HeartPulse className="size-4 text-[var(--brand-primary)]" />}
          label="Kesehatan Armada"
          value={operationAverageHealth}
          caption="rata-rata kondisi unit"
          badge={fleetHealth}
        />
        <KpiCard
          icon={<Bell className="size-4 text-[var(--brand-primary)]" />}
          label="Peringatan Aktif"
          value={operationAlertUnits.length}
          caption="unit perlu perhatian"
          badge={{
            label: alertsOk ? "Aman" : "Monitor",
            className: alertsOk
              ? "bg-[var(--success-50)] text-[var(--success-700)] hover:bg-[var(--success-50)]"
              : "bg-[var(--warning-50)] text-[var(--warning-700)] hover:bg-[var(--warning-50)]",
          }}
        />
        <KpiCard
          icon={<Target className="size-4 text-[var(--brand-primary)]" />}
          label="Kesiapan Dispatch"
          value={`${dispatchReadinessPercent}%`}
          caption="siap operasi"
          badge={dispatchTone}
        />
      </section>

      {/* Main Content Area */}
      <section className="grid gap-1.5 lg:grid-cols-12">
        {/* Left column: Live Tracking Map Card */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none flex-1 flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-3 pb-2 pt-3">
              <div>
                <CardTitle className="text-[14px] font-bold text-foreground">Live Tracking - Hauling Darat</CardTitle>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge className="border-transparent bg-[var(--danger-500)] text-white hover:bg-[var(--danger-500)] font-semibold text-xs px-2 py-0.5">
                  <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-white" />
                  Live
                </Badge>
                {onOpenRouteIntelligence && (
                  <Button size="sm" variant="outline" onClick={onOpenRouteIntelligence} className="h-7 px-2.5 text-xs">
                    Lihat di Route Intelligence
                    <ChevronRight className="ml-1 size-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 flex-1 flex flex-col justify-end">
              <div className="relative h-[390px] overflow-hidden rounded-xl border">
                <MiniFleetMapShell
                  vehicles={operationVehicles}
                  nodes={nodes}
                  latestTelemetry={latestTelemetry}
                  interactive
                />
                <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]/95 px-3 py-2 text-xs shadow-[var(--shadow-md)] backdrop-blur">
                  <p className="mb-1.5 font-semibold text-foreground">Status Unit</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#16A34A]" /> Bergerak
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#D97706]" /> Standby
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#DC2626]" /> Maintenance
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#94A3B8]" /> Offline
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle column: 4 Stacked Insight Cards */}
        <div className="lg:col-span-4">
          <div className="grid grid-cols-2 gap-1.5 h-full">
            <SnapshotCard
              icon={<Gauge className="size-4 text-[var(--brand-primary)]" />}
              title="Progress Rute Hari Ini"
              value={`${cc.onShiftTarget}%`}
              caption="total progres"
              onDetail={onOpenRouteIntelligence}
            >
              <div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Progress value={cc.onShiftTarget} className="h-1.5 flex-1 [&>div]:bg-[var(--brand-primary)]" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground font-medium">
                  {Math.round((cc.onShiftTarget / 100) * 10)} dari 10 rute selesai
                </p>
              </div>
            </SnapshotCard>

            <SnapshotCard
              icon={<Fuel className="size-4 text-[var(--brand-primary)]" />}
              title="BBM Snapshot"
              value={totalFuelKL !== null ? `${totalFuelKL.toFixed(1)}` : "--"}
              unit="KL"
              caption="total sisa BBM"
              onDetail={onOpenRouteIntelligence}
            >
              <div>
                {mounted && fuelSpark.length >= 2 && (
                  <div className="mt-1 h-8 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={fuelSpark}>
                        <Line type="monotone" dataKey="v" stroke="var(--danger-500)" strokeWidth={1.5} dot={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-xs border-t pt-2">
                  <span className="text-muted-foreground">Rata-rata / unit</span>
                  <span className="font-semibold text-foreground">{avgFuelKL !== null ? `${avgFuelKL.toFixed(2)} KL` : "--"}</span>
                </div>
              </div>
            </SnapshotCard>

            <SnapshotCard
              icon={<Gauge className="size-4 text-[var(--brand-primary)]" />}
              title="Kecepatan Snapshot"
              value={avgSpeed !== null ? avgSpeed.toFixed(1) : "--"}
              unit="km/jam"
              caption="rata-rata kecepatan"
              onDetail={onOpenRouteIntelligence}
            >
              <div>
                {mounted && speedSpark.length >= 2 && (
                  <div className="mt-1 h-8 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={speedSpark}>
                        <Line type="monotone" dataKey="v" stroke="var(--info-500)" strokeWidth={1.5} dot={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground border-t pt-2">Batas aman 60 km/jam</p>
              </div>
            </SnapshotCard>

            <Card className="gap-0 rounded-xl py-0 shadow-none flex flex-col justify-between h-full">
              <CardHeader className="px-3 pb-1 pt-3">
                <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  <FleetIcon className="size-4 text-[var(--brand-primary)]" />
                  Utilisasi Fleet
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3 flex-1 flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2 mt-1 min-w-0">
                    {mounted ? (
                      <div className="relative h-[72px] w-[72px] shrink-0">
                        <PieChart width={72} height={72}>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            innerRadius={20}
                            outerRadius={34}
                            paddingAngle={3}
                            stroke="transparent"
                          >
                            {pieData.map((item) => (
                              <Cell key={item.name} fill={item.color} />
                            ))}
                          </Pie>
                        </PieChart>
                        <div className="absolute inset-0 grid place-items-center text-center">
                          <div>
                            <div className="text-[13px] font-bold tabular-nums leading-none">{efisiensiPersen}%</div>
                            <div className="text-[8px] text-muted-foreground font-medium">efisien</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[72px] w-[72px] shrink-0 bg-slate-50 rounded-full border border-dashed border-slate-200" />
                    )}
                    <div className="flex-1 grid gap-1 text-[10.5px] text-muted-foreground leading-normal min-w-0">
                      {pieData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-1 min-w-0">
                          <span className="flex items-center gap-1 min-w-0 truncate">
                            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="tabular-nums font-semibold shrink-0">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {onOpenRouteIntelligence && (
                  <Button size="sm" onClick={onOpenRouteIntelligence} className="mt-3 w-full text-xs">
                    Lihat Detail
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column: Critical Maintenance & Active Recommendations */}
        <div className="lg:col-span-3 flex flex-col gap-1.5">
          {/* Critical Maintenance Watch */}
          <Card className="gap-0 rounded-xl border py-0 shadow-none flex flex-col flex-1 animate-danger-pulse">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
              <CardTitle className="text-[13px] font-bold text-[var(--danger-700)] flex items-center gap-1.5">
                Pantau Maintenance Kritis
              </CardTitle>
              <Badge className="border-transparent bg-[var(--danger-600)] text-white px-2 py-0.5 text-[11px] hover:bg-[var(--danger-600)] font-bold">
                {operationAlertUnits.length}
              </Badge>
            </CardHeader>
            <CardContent className="px-4 pb-3 flex-1 flex flex-col justify-between">
              {topWatchTruck ? (
                <div className="rounded-lg border border-[var(--danger-100)] bg-[var(--danger-50)]/50 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-foreground">{topWatchTruck.id}</span>
                        <Badge
                          variant="outline"
                          className="border-transparent bg-[var(--danger-50)] text-[var(--danger-700)] px-1.5 py-0.5 text-[10px] font-bold"
                        >
                          Kritis
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-foreground">Perlu inspeksi segera</p>
                      <ul className="mt-1 text-[11px] text-muted-foreground list-disc pl-3.5 space-y-0.5 leading-normal">
                        <li>Getaran tinggi pada final drive</li>
                        <li>Estimasi downtime: 6-8 jam</li>
                      </ul>
                    </div>
                    {onOpenRouteIntelligence && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenRouteIntelligence}
                        className="border-[var(--danger-200)] text-[var(--danger-600)] hover:bg-[var(--danger-50)] text-xs shrink-0 self-center"
                      >
                        Lihat Detail
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-[var(--success-50)] p-3 text-sm text-[var(--success-700)]">
                  Tidak ada unit dengan risiko maintenance tinggi.
                </div>
              )}
              <div className="mt-3 text-center">
                <button
                  onClick={onOpenRouteIntelligence}
                  className="text-xs font-semibold text-[var(--danger-700)] hover:underline flex items-center justify-center w-full"
                >
                  Lihat semua ({operationAlertUnits.length}) &gt;
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Active Recommendations */}
          <Card className="gap-0 rounded-xl py-0 shadow-none flex flex-col flex-1">
            <CardHeader className="px-4 pb-1 pt-3">
              <CardTitle className="flex items-center gap-2 text-[13px] font-bold">
                <Sparkles className="size-4 text-[var(--info-600)]" />
                Rekomendasi Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-1 text-xs text-muted-foreground leading-relaxed">
                  Tidak ada rekomendasi aktif saat ini. Sistem akan memberikan rekomendasi jika terdapat potensi peningkatan.
                </div>
                <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--info-50)] text-[var(--info-600)]">
                  <div className="absolute inset-0.5 rounded-full border border-dashed border-[var(--info-300)]" />
                  <Check className="size-4 stroke-[2.5]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom Area */}
      <section className="grid gap-1.5 lg:grid-cols-12">
        {/* Left Column: Active Units Table */}
        <div className="lg:col-span-9 flex flex-col">
          <Card className="gap-0 rounded-xl py-0 shadow-none flex-1 flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between px-3 pb-2 pt-3">
              <div>
                <CardTitle className="text-[14px] font-bold">Unit Aktif Hari Ini</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="size-7 text-muted-foreground"
                aria-label="Segarkan data"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent className="px-3 pb-3 flex-1 flex flex-col justify-between">
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Rute Saat Ini</TableHead>
                      <TableHead>Asal ➔ Tujuan</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kesehatan</TableHead>
                      <TableHead>BBM</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operationVehicles.length > 0 ? (
                      operationVehicles.map((veh) => {
                        const routeInfo = getRouteInfo(veh.id);
                        const etaInfo = getEtaText(veh.id, veh.status);
                        const ccTruck = cc.trucks.find((t) => t.id === veh.id);
                        const fuelLevel = ccTruck?.fuelLevelPercent ?? 0;
                        const fuelKL = (fuelLevel * 8.16 / 100).toFixed(1);

                        return (
                          <TableRow key={veh.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="relative w-14 h-10 shrink-0 overflow-hidden rounded-lg border">
                                  <Image
                                    alt="Hauling Truck"
                                    src="/hauling_truck.png"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-mono font-bold text-xs">{veh.id}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Hauling
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-xs text-foreground">
                              {routeInfo.route}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {routeInfo.path}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {etaInfo.time !== "—" ? (
                                <div className="flex flex-col leading-tight">
                                  <span className="font-semibold text-foreground">{etaInfo.time}</span>
                                  <span className="text-[10px] text-muted-foreground">{etaInfo.remaining}</span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass(veh.status)}`}
                              >
                                {statusLabel(veh.status)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${healthBadge(veh.healthScore).className}`}
                              >
                                {healthBadge(veh.healthScore).label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={fuelLevel}
                                  className="h-1.5 w-14 [&>div]:bg-[var(--danger-500)]"
                                />
                                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                                  {fuelKL} KL
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {onOpenMaintenance && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => onOpenMaintenance(veh.id)}
                                  className="h-7 gap-1.5 px-2.5 text-[11px] font-semibold"
                                >
                                  <Eye className="size-3.5" />
                                  Detail
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                          Tidak ada unit aktif.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Menampilkan{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {operationVehicles.length}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold tabular-nums text-foreground">{operationTotal}</span>{" "}
                  unit
                </span>
                <button
                  type="button"
                  onClick={onOpenRouteIntelligence}
                  className="font-bold text-[var(--brand-primary)] hover:underline"
                >
                  Lihat semua unit &gt;
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Feed Card */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="gap-0 rounded-xl py-0 shadow-none flex-1 flex flex-col justify-between">
            <CardHeader className="px-4 pb-1 pt-3">
              <CardTitle className="text-[13px] font-bold">Aktivitas Sistem Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3 mt-1">
                {systemActivities.map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${evt.color}`} />
                    <div className="min-w-0 flex-1 text-muted-foreground leading-normal">
                      <span className="font-bold text-foreground mr-1.5">
                        {getFeedTime(evt.timeOffset)}
                      </span>
                      {evt.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t pt-3 text-center">
                <button
                  onClick={onOpenRouteIntelligence}
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Lihat semua aktivitas
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
