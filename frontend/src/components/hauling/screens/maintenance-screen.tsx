"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Eye,
  Fuel,
  Gauge,
  ShieldAlert,
  Thermometer,
  Truck,
  Wrench,
  ChevronRight,
  Info,
  CheckCircle2,
  MoreVertical,
  Search,
  Download,
  Settings,
  Ban,
  AlertCircle,
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  type RecommendationResponse,
  type TelemetryResponse,
  type VehicleResponse,
} from "@/lib/api";
import { useCommandCenter } from "@/lib/command-center/use-command-center";
import {
  recommendationsForTruck,
  telemetryForTruck,
} from "@/lib/hauling-telemetry";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type HealthLevel = "Aman" | "Monitoring" | "Risiko Sedang" | "Risiko Tinggi";

type VehicleRow = VehicleResponse & {
  telemetry: TelemetryResponse | null;
  recs: RecommendationResponse[];
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function healthLevel(score: number): HealthLevel {
  if (score >= 85) return "Aman";
  if (score >= 70) return "Monitoring";
  if (score >= 50) return "Risiko Sedang";
  return "Risiko Tinggi";
}

function healthTone(level: HealthLevel) {
  if (level === "Aman") return { badge: "bg-[var(--success-50)] text-[var(--success-700)] border-[var(--success-200)]", text: "text-[var(--success-700)]" };
  if (level === "Monitoring") return { badge: "bg-[var(--info-50)] text-[var(--info-700)] border-[var(--info-200)]", text: "text-[var(--info-700)]" };
  if (level === "Risiko Sedang") return { badge: "bg-[var(--warning-50)] text-[var(--warning-700)] border-[var(--warning-200)]", text: "text-[var(--warning-700)]" };
  return { badge: "bg-[var(--danger-50)] text-[var(--danger-700)] border-[var(--danger-200)]", text: "text-[var(--danger-700)]" };
}

function deriveNextAction(v: VehicleRow): string {
  const level = healthLevel(v.healthScore);
  if (level === "Risiko Tinggi") return "Tahan dari dispatch â€” kirim ke maintenance bay";
  if (level === "Risiko Sedang") return "Inspeksi setelah trip selesai";
  if (level === "Monitoring") return "Monitor telemetri pada trip berikutnya";
  return "Layak untuk dispatch berikutnya";
}

function priorityOrder(p: string): number {
  return p === "critical" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3;
}

const n = (v: number | null, fallback = 0): number => v ?? fallback;

function statusLabel(status: string): string {
  if (status === "active") return "Sedang Beroperasi";
  if (status === "maintenance") return "Tahan Maintenance";
  return "Standby";
}

function telemetryRiskOrder(risk?: string | null): number {
  if (risk === "critical") return 0;
  if (risk === "high") return 1;
  if (risk === "medium") return 2;
  if (risk === "low") return 3;
  return 4;
}

// â”€â”€â”€ Shared components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader className="px-5 pb-2 pt-4">
        <CardDescription className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon className="size-4 text-primary" />
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

// â”€â”€â”€ List screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MaintenanceListScreen({
  vehicles,
  onOpen,
}: {
  vehicles: VehicleRow[];
  onOpen: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const totalUnits = vehicles.length;
  const siapDispatch = vehicles.filter((v) => v.status === "idle").length;
  const siapDispatchPercent = totalUnits > 0 ? Math.round((siapDispatch / totalUnits) * 100) : 0;

  const risikoTinggi = vehicles.filter((v) => v.healthScore < 70).length;
  const risikoTinggiPercent = totalUnits > 0 ? Math.round((risikoTinggi / totalUnits) * 100) : 0;

  const maintenanceHold = vehicles.filter((v) => v.status === "maintenance").length;
  const maintenanceHoldPercent = totalUnits > 0 ? Math.round((maintenanceHold / totalUnits) * 100) : 0;

  const avgHealth = totalUnits > 0
    ? Math.round(vehicles.reduce((acc, v) => acc + v.healthScore, 0) / totalUnits)
    : 0;

  // Middle widgets data
  const countAman = vehicles.filter((v) => v.healthScore >= 85).length;
  const pctAman = totalUnits > 0 ? (countAman / totalUnits) * 100 : 0;

  const countSedang = vehicles.filter((v) => v.healthScore >= 70 && v.healthScore < 85).length;
  const pctSedang = totalUnits > 0 ? (countSedang / totalUnits) * 100 : 0;

  const countTinggi = vehicles.filter((v) => v.healthScore < 70).length;
  const pctTinggi = totalUnits > 0 ? (countTinggi / totalUnits) * 100 : 0;

  const countPerhatian = vehicles.filter((v) => v.healthScore < 85 && v.status !== "maintenance").length;
  const countPerhatianPercent = totalUnits > 0 ? Math.round((countPerhatian / totalUnits) * 100) : 0;

  // Donut chart circles calculation (r=15.915, circumference=100)
  const offsetTinggi = 0;
  const offsetSedang = -pctTinggi;
  const offsetAman = -(pctTinggi + pctSedang);

  const topPerhatianVehicles = [...vehicles]
    .sort((a, b) =>
      telemetryRiskOrder(a.telemetry?.riskLevel) - telemetryRiskOrder(b.telemetry?.riskLevel) ||
      a.healthScore - b.healthScore
    )
    .slice(0, 3);

  const getTopPerhatianDesc = (v: VehicleRow) => {
    const level = healthLevel(v.healthScore);
    if (level === "Risiko Tinggi") return "Health score rendah - kirim inspeksi sebelum dispatch";
    if (level === "Risiko Sedang") return "Health menurun - inspeksi setelah trip selesai";
    if (v.telemetry?.riskLevel === "medium") return "Telemetri perlu monitor pada trip berikutnya";
    return "Status aman - layak dispatch";
  };


  // Filter vehicles by search
  const filteredVehicles = vehicles.filter((v) =>
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (isoString?: string) => {
    if (!isoString) return "â€”";
    try {
      const date = new Date(isoString);
      const hrs = String(date.getHours()).padStart(2, "0");
      const mins = String(date.getMinutes()).padStart(2, "0");
      return `${hrs}:${mins}`;
    } catch {
      return "â€”";
    }
  };

  const getUpdatedTime = (v: VehicleRow) => {
    if (v.telemetry?.timestamp) {
      return formatTime(v.telemetry.timestamp);
    }
    return "10:12";
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "active") return "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "maintenance") return "bg-red-50 text-red-700 border-red-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200"; // standby
  };

  return (
    <div className="space-y-4">
      {/* 5 Metrics Cards */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {/* Total Unit Hauler */}
        <Card className="flex flex-row items-center justify-between p-5 rounded-xl shadow-none">
          <div className="space-y-1">
            <div className="text-[13px] font-medium text-muted-foreground">Total Unit Hauler</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{totalUnits}</span>
              <span className="text-[13px] text-muted-foreground font-medium">unit</span>
            </div>
          </div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-red-50 text-red-500">
            <Truck className="size-6" />
          </div>
        </Card>

        {/* Unit Siap Dispatch */}
        <Card className="flex flex-row items-center justify-between p-5 rounded-xl shadow-none">
          <div className="space-y-1">
            <div className="text-[13px] font-medium text-muted-foreground">Unit Siap Dispatch</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{siapDispatch}</span>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded ml-1">
                {siapDispatchPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-50 text-emerald-600">
            <Truck className="size-6" />
          </div>
        </Card>

        {/* Risiko Tinggi */}
        <Card className="flex flex-row items-center justify-between p-5 rounded-xl shadow-none">
          <div className="space-y-1">
            <div className="text-[13px] font-medium text-muted-foreground">Risiko Tinggi</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{risikoTinggi}</span>
              <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded ml-1">
                {risikoTinggiPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="size-6" />
          </div>
        </Card>

        {/* Maintenance Hold */}
        <Card className="flex flex-row items-center justify-between p-5 rounded-xl shadow-none">
          <div className="space-y-1">
            <div className="text-[13px] font-medium text-muted-foreground">Maintenance Hold</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{maintenanceHold}</span>
              <span className="text-[11px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded ml-1">
                {maintenanceHoldPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-red-50 text-red-500">
            <Ban className="size-6" />
          </div>
        </Card>

        {/* Rata-rata Health Score */}
        <Card className="flex flex-row items-center justify-between p-5 rounded-xl shadow-none col-span-2 md:col-span-1">
          <div className="space-y-1">
            <div className="text-[13px] font-medium text-muted-foreground">Rata-rata Health Score</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{avgHealth}</span>
              <span className="text-[13px] text-muted-foreground font-medium">dari 100</span>
            </div>
          </div>
          <div className="shrink-0">
            <svg className="w-20 h-10 text-red-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 25 Q20 5 45 22 T75 8 T95 20" />
            </svg>
          </div>
        </Card>
      </section>

      {/* Middle Analytics Widgets Row */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Distribusi Health Score */}
        <Card className="rounded-xl shadow-none p-5 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">Distribusi Health Score</span>
              <Info className="size-4 text-muted-foreground/60 cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-between gap-5 py-5">
            <div className="relative flex items-center justify-center size-28 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                
                {/* Red segment (Risiko Tinggi) */}
                {pctTinggi > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3.5"
                    strokeDasharray={`${pctTinggi} 100`}
                    strokeDashoffset={offsetTinggi}
                  />
                )}
                
                {/* Orange segment (Risiko Sedang) */}
                {pctSedang > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray={`${pctSedang} 100`}
                    strokeDashoffset={offsetSedang}
                  />
                )}
                
                {/* Green segment (Aman) */}
                {pctAman > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray={`${pctAman} 100`}
                    strokeDashoffset={offsetAman}
                  />
                )}
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold leading-none">{totalUnits}</span>
                <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Total Unit</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">Aman <span className="text-[11px] text-muted-foreground/60 font-mono">(80-100)</span></span>
                </div>
                <span className="text-[13px] font-semibold text-foreground">{countAman} unit ({Math.round(pctAman)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-muted-foreground">Risiko Sedang <span className="text-[11px] text-muted-foreground/60 font-mono">(50-79)</span></span>
                </div>
                <span className="text-[13px] font-semibold text-foreground">{countSedang} unit ({Math.round(pctSedang)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-muted-foreground">Risiko Tinggi <span className="text-[11px] text-muted-foreground/60 font-mono">(0-49)</span></span>
                </div>
                <span className="text-[13px] font-semibold text-foreground">{countTinggi} unit ({Math.round(pctTinggi)}%)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Ringkasan Maintenance Readiness */}
        <Card className="rounded-xl shadow-none p-5 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">Ringkasan Maintenance Readiness</span>
              <Info className="size-4 text-muted-foreground/60 cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 justify-center py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <span className="font-medium text-sm text-foreground">Siap Dispatch</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-foreground">{siapDispatch} unit</div>
                <div className="text-xs text-muted-foreground">{siapDispatchPercent}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-amber-50 text-amber-600">
                  <AlertTriangle className="size-5" />
                </div>
                <span className="font-medium text-sm text-foreground">Perlu Perhatian</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-foreground">{countPerhatian} unit</div>
                <div className="text-xs text-muted-foreground">{countPerhatianPercent}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-red-50 text-red-500">
                  <Ban className="size-5" />
                </div>
                <span className="font-medium text-sm text-foreground">Maintenance Hold</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-foreground">{maintenanceHold} unit</div>
                <div className="text-xs text-muted-foreground">{maintenanceHoldPercent}%</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Perhatian */}
        <Card className="rounded-xl shadow-none p-5 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">Top Perhatian</span>
              <Info className="size-4 text-muted-foreground/60 cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 justify-center py-3">
            {topPerhatianVehicles.map((v) => {
              const level = healthLevel(v.healthScore);
              const tone = healthTone(level);
              const isCritical = level === "Risiko Tinggi" || ["critical", "high"].includes(v.telemetry?.riskLevel ?? "");

              return (
                <div
                  key={v.id}
                  onClick={() => onOpen(v.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex items-center justify-center size-8.5 rounded-full shrink-0 ${
                      isCritical ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                    }`}>
                      {isCritical ? <AlertTriangle className="size-5" /> : <Activity className="size-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{v.id}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border leading-none scale-95 origin-left ${tone.badge}`}>
                          {level}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                        {getTopPerhatianDesc(v)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 ml-1" />
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Bottom Table Section (Enlarged by 20%) */}
      <Card className="rounded-xl shadow-none">
        <CardContent className="p-6">
          {/* Table Header and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <CardTitle className="text-xl font-bold">Daftar Health Kendaraan Hauling</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-0.5">
                Dispatcher melihat kondisi unit sebelum memilih kendaraan untuk dispatch atau pengganti.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[210px] pl-9 pr-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-background border rounded-lg hover:bg-accent text-foreground shadow-sm">
                <Download className="size-4" />
                Ekspor
              </button>
              <button className="p-2 bg-background border rounded-lg hover:bg-accent text-muted-foreground shadow-sm">
                <Settings className="size-4" />
              </button>
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold text-[13px] py-2.5">Unit</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Status</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Skor Kesehatan</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Tingkat Risiko</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Suhu Mesin</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Getaran</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Tekanan Oli</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Konsumsi BBM</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Kecepatan</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5">Tindakan Berikutnya</TableHead>
                  <TableHead className="font-semibold text-[13px] py-2.5 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((v) => {
                  const level = healthLevel(v.healthScore);
                  const tone = healthTone(level);
                  const isLoader = v.type === "loader";

                  return (
                    <TableRow key={v.id} className="hover:bg-muted/20">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-14 h-10.5 shrink-0 overflow-hidden rounded-lg border bg-muted">
                            <Image
                              alt="Vehicle Thumbnail"
                              src={isLoader ? "/hauling_loader.png" : "/hauling_truck.png"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-[13.5px] font-mono">{v.id}</div>
                            <div className="text-[11.5px] text-muted-foreground font-medium">
                              {isLoader ? "loader" : "hauler"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(v.status)}`}>
                          {statusLabel(v.status)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="min-w-[140px] space-y-1">
                          <div className={`font-semibold text-sm ${tone.text}`}>{v.healthScore}</div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                level === "Aman" ? "bg-emerald-500" :
                                level === "Monitoring" ? "bg-blue-500" :
                                level === "Risiko Sedang" ? "bg-red-500" : "bg-red-600"
                              }`}
                              style={{ width: `${v.healthScore}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${tone.badge}`}>
                          {level}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 tabular-nums text-[13.5px] text-foreground">
                        {v.telemetry?.engineTempC != null ? `${n(v.telemetry.engineTempC).toFixed(0)} C` : "—"}
                      </TableCell>
                      <TableCell className="py-3 tabular-nums text-[13.5px] text-foreground">
                        {v.telemetry?.vibrationLevel != null ? `${n(v.telemetry.vibrationLevel).toFixed(2)} g` : "—"}
                      </TableCell>
                      <TableCell className="py-3 tabular-nums text-[13.5px] text-foreground">
                        {v.telemetry?.oilPressureBar != null ? `${n(v.telemetry.oilPressureBar).toFixed(1)} bar` : "—"}
                      </TableCell>
                      <TableCell className="py-3 tabular-nums text-[13.5px] text-foreground">
                        {v.telemetry?.fuelRateLph != null ? `${n(v.telemetry.fuelRateLph).toFixed(1)} L/h` : "—"}
                      </TableCell>
                      <TableCell className="py-3 tabular-nums text-[13.5px] text-foreground">
                        {v.telemetry?.speedKmh != null ? `${n(v.telemetry.speedKmh).toFixed(0)} km/h` : "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="max-w-[200px] text-xs text-muted-foreground font-medium leading-tight">
                          {deriveNextAction(v)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpen(v.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 h-8.5 text-[13px] border rounded-lg hover:bg-muted font-semibold shadow-sm"
                          >
                            <Eye className="size-4" />
                            Lihat
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex items-center justify-between border-t px-1 py-4 text-[13px] text-muted-foreground mt-4">
            <div>
              Menampilkan 1â€“{filteredVehicles.length} dari {filteredVehicles.length} unit
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 border rounded-md hover:bg-muted disabled:opacity-40" disabled>
                <ChevronRight className="size-4 rotate-180" />
              </button>
              <button className="size-7.5 border rounded-md bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                1
              </button>
              <button className="p-1.5 border rounded-md hover:bg-muted disabled:opacity-40" disabled>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// â”€â”€â”€ Detail screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Sparkline({ values, colorClass }: { values: number[]; colorClass: string }) {
  const width = 120;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((val, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className={colorClass} style={{ overflow: "visible" }}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HealthDonut({ score, trend }: { score: number; trend: string }) {
  const radius = 28;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const strokeColor =
    score >= 85
      ? "stroke-emerald-500"
      : score >= 70
        ? "stroke-blue-500"
        : score >= 50
          ? "stroke-amber-500"
          : "stroke-red-600";

  const isNegative = trend.startsWith("-");
  const trendColor = isNegative ? "text-red-500" : "text-emerald-500";
  const arrow = isNegative ? "â†“" : "â†‘";

  return (
    <div className="flex flex-col items-center justify-center shrink-0">
      <div className="relative flex items-center justify-center size-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-muted/45"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-[20px] font-extrabold text-foreground leading-none">{score}</span>
        </div>
      </div>
      <div className={`text-[10.5px] font-semibold mt-1.5 flex items-center gap-0.5 ${trendColor}`}>
        <span>{arrow} {trend.replace("-", "").replace("+", "")}</span>
        <span className="text-muted-foreground font-normal">vs 7 hari lalu</span>
      </div>
    </div>
  );
}

function generateSparklineData(centerValue: number, count = 15, variance = 3) {
  const result = [];
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i * 1.3) * variance;
    result.push(centerValue + wave);
  }
  // Ensure the last element matches the center value
  result[count - 1] = centerValue;
  return result;
}

const getMockDetails = (id: string) => {
  switch (id) {
    case "DT-05":
      return {
        odometer: "15.932 km",
        jamOperasi: "3.020 jam",
        lokasi: "Pit 1 - Hauling Road",
      };
    case "DT-01":
      return {
        odometer: "12.450 km",
        jamOperasi: "2.150 jam",
        lokasi: "Pit 1 - Hauling Road",
      };
    case "DT-02":
      return {
        odometer: "14.890 km",
        jamOperasi: "2.780 jam",
        lokasi: "Pit 2 - Hauling Road",
      };
    default:
      const lastDigit = parseInt(id.replace(/\D/g, "")) || 3;
      return {
        odometer: `${10 + lastDigit * 1.5}.342 km`,
        jamOperasi: `${2 + lastDigit * 0.3}.150 jam`,
        lokasi: `Pit ${(lastDigit % 3) + 1} - Hauling Road`,
      };
  }
};

const getFormattedTimestamp = (timestamp?: string) => {
  if (!timestamp) return "21 Mei 2025, 08:45 WIB";
  try {
    const date = new Date(timestamp);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${d} ${m} ${y}, ${hh}:${mm} WIB`;
  } catch {
    return "21 Mei 2025, 08:45 WIB";
  }
};

function MaintenanceDetailScreen({
  vehicle,
  onBack,
}: {
  vehicle: VehicleRow;
  onBack: () => void;
}) {
  const level = healthLevel(vehicle.healthScore);
  const tone = healthTone(level);
  const t = vehicle.telemetry;

  const mockData = getMockDetails(vehicle.id);
  const updateTime = getFormattedTimestamp(t?.timestamp);

  // Sparkline data generation
  const tempVal = t ? n(t.engineTempC) : 92;
  const fuelVal = t ? n(t.fuelRateLph) : 42.7;
  const vibVal = t ? n(t.vibrationLevel) : 0.22;
  const speedVal = t ? n(t.speedKmh) : 28;

  const tempSpark = generateSparklineData(tempVal, 15, 2.5);
  const fuelSpark = generateSparklineData(fuelVal, 15, 3.2);
  const vibSpark = generateSparklineData(vibVal, 15, 0.9);
  const speedSpark = generateSparklineData(speedVal, 15, 4.5);

  const isLoader = vehicle.type === "loader";

  // Dynamic component status list
  const components = [
    {
      name: "Mesin",
      status: tempVal > 95 ? "Kritis" : tempVal > 88 ? "Tinggi" : "Aman",
      val: `${tempVal.toFixed(0)}Â°C`,
      tone: tempVal > 95 ? "danger" : tempVal > 88 ? "danger" : "success"
    },
    {
      name: "Sistem Pendingin",
      status: tempVal > 90 ? "Sedang" : "Aman",
      val: `${(tempVal * 0.88).toFixed(0)}Â°C`,
      tone: tempVal > 90 ? "warning" : "success"
    },
    {
      name: "Sistem Hidrolik",
      status: vibVal > 0.55 ? "Kritis" : vibVal > 0.35 ? "Sedang" : "Aman",
      val: "Normal",
      tone: vibVal > 0.55 ? "danger" : vibVal > 0.35 ? "warning" : "success"
    },
    {
      name: "Transmisi",
      status: "Aman",
      val: "Normal",
      tone: "success"
    },
    {
      name: "Rem",
      status: "Aman",
      val: "Normal",
      tone: "success"
    },
    {
      name: "Ban (Rata-rata)",
      status: vehicle.healthScore < 60 ? "Sedang" : "Aman",
      val: vehicle.healthScore < 60 ? "62%" : "Normal",
      tone: vehicle.healthScore < 60 ? "warning" : "success"
    }
  ];

  // Colors mapping for SVG area graphs
  const chartColor =
    vehicle.healthScore >= 85
      ? "#10b981"
      : vehicle.healthScore >= 70
        ? "#3b82f6"
        : vehicle.healthScore >= 50
          ? "#f59e0b"
          : "#dc2626";

  // Trend health history calculations
  const healthHistory = [
    Math.min(100, vehicle.healthScore + 15),
    Math.min(100, vehicle.healthScore + 13),
    Math.min(100, vehicle.healthScore + 11),
    Math.min(100, vehicle.healthScore + 12),
    Math.min(100, vehicle.healthScore + 8),
    Math.min(100, vehicle.healthScore + 5),
    vehicle.healthScore,
  ];

  const pts = healthHistory.map((val, idx) => {
    const x = 30 + idx * 48.3;
    const y = 125 - (val / 100) * 100;
    return { x, y, val };
  });

  const lineD = pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} 125 L ${pts[0].x.toFixed(1)} 125 Z`;

  // Engine temperature trend calculation
  const tempHistory = [80, 83, 81, 84, 85, 87, 85, 89, 91, 89, 90, tempVal];
  const tempPts = tempHistory.map((pVal, idx) => {
    const x = 30 + idx * 26.36;
    const y = 125 - ((pVal - 50) / 70) * 100;
    return { x, y, val: pVal };
  });
  const tempLineD = tempPts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const tempAreaD = `${tempLineD} L ${tempPts[tempPts.length - 1].x.toFixed(1)} 125 L ${tempPts[0].x.toFixed(1)} 125 Z`;
  const threshY = 125 - ((95 - 50) / 70) * 100;

  return (
    <div className="space-y-4">
      {/* â”€â”€â”€ Top Header Card â”€â”€â”€ */}
      <Card className="rounded-xl shadow-sm border border-border p-5 bg-card">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* Left Block: Clickable Image + Title & Details Column */}
          <div className="flex flex-col sm:flex-row gap-5 items-start flex-1 min-w-0">
            {/* Clickable enlarged image */}
            <div
              onClick={onBack}
              className="relative w-56 h-32 shrink-0 overflow-hidden rounded-xl border bg-muted cursor-pointer group shadow-sm"
              title="Kembali ke Daftar"
            >
              <Image
                alt="Vehicle Thumbnail"
                src={isLoader ? "/hauling_loader.png" : "/hauling_truck.png"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <ArrowLeft className="size-6 text-white" />
              </div>
            </div>
            
            {/* Title, Subtitle, and Inline stacked details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-black font-mono tracking-tight text-foreground">{vehicle.id}</h2>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tone.badge}`}>
                    {level}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  {isLoader ? "Loader" : "Dump Truck"} {vehicle.id.replace(/\D/g, "") || "07"} / {vehicle.type}
                </p>
              </div>

              {/* Stacked Info Columns in a horizontal flex/grid row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-3 gap-x-6 pt-3 text-xs border-t border-border/40 mt-3 sm:mt-0">
                {/* Column 1: Tipe Unit */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tipe Unit</span>
                  <span className="text-[13px] font-extrabold text-foreground mt-1">{isLoader ? "Loader" : "Dump Truck"}</span>
                </div>

                {/* Column 2: Kapasitas */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Kapasitas</span>
                  <span className="text-[13px] font-extrabold text-foreground mt-1">{vehicle.capacityTon || 90} Ton</span>
                </div>

                {/* Column 3: Lokasi */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Lokasi</span>
                  <span className="text-[13px] font-extrabold text-foreground mt-1">{mockData.lokasi}</span>
                </div>

                {/* Column 4: Odometer */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Odometer</span>
                  <span className="text-[13px] font-extrabold text-foreground font-mono mt-1">{mockData.odometer}</span>
                </div>

                {/* Column 5: Jam Operasi */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Jam Operasi</span>
                  <span className="text-[13px] font-extrabold text-foreground font-mono mt-1">{mockData.jamOperasi}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Action Button + Status/Last Update stacked vertically */}
          <div className="flex flex-col items-start md:items-end justify-between gap-5 shrink-0 md:text-right min-w-[200px] self-stretch py-0.5 border-t md:border-t-0 pt-4 md:pt-0 border-border/50">
            {/* Button Tandai untuk Maintenance */}
            <Button className="bg-[var(--danger-600)] hover:bg-[var(--danger-700)] text-white font-bold h-10 text-xs flex items-center gap-1.5 shadow-sm px-5 rounded-lg border-0">
              Tandai untuk Maintenance
              <Wrench className="size-4" />
            </Button>
            
            {/* Status and Last Update stacked */}
            <div className="space-y-2.5 mt-auto">
              <div className="flex items-center md:justify-end gap-2 text-xs">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Status</span>
                <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                  vehicle.status === "maintenance"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : vehicle.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {statusLabel(vehicle.status)}
                </span>
              </div>
              <div className="flex flex-col md:items-end">
                <span className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Terakhir Update</span>
                <span className="text-[11.5px] font-semibold text-foreground mt-0.5">{updateTime}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* â”€â”€â”€ Metrics Row (5 Cards) â”€â”€â”€ */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Card 1: Health Score */}
        <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 h-full">
            <div className="flex flex-col justify-between h-full space-y-3 w-full">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skor Kesehatan</p>
                <div className="flex items-baseline mt-1.5">
                  <span className={`text-4xl font-black ${
                    vehicle.healthScore >= 85 ? "text-emerald-500" :
                    vehicle.healthScore >= 70 ? "text-blue-500" :
                    vehicle.healthScore >= 50 ? "text-amber-500" : "text-red-600"
                  }`}>{vehicle.healthScore}</span>
                  <span className="text-xs text-muted-foreground font-medium ml-1">/100</span>
                </div>
                <p className={`text-[11.5px] font-bold mt-1 ${
                  vehicle.healthScore >= 85 ? "text-emerald-600" :
                  vehicle.healthScore >= 70 ? "text-blue-600" :
                  vehicle.healthScore >= 50 ? "text-amber-600" : "text-red-700"
                }`}>{level}</p>
              </div>

              {/* Slider scale */}
              <div className="space-y-1 w-full pt-1">
                <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      vehicle.healthScore >= 85 ? "bg-emerald-500" :
                      vehicle.healthScore >= 70 ? "bg-blue-500" :
                      vehicle.healthScore >= 50 ? "bg-amber-500" : "bg-red-600"
                    }`}
                    style={{ width: `${vehicle.healthScore}%` }}
                  />
                </div>
                <div className="relative text-[9.5px] text-muted-foreground font-semibold h-3">
                  <span className="absolute left-0">0</span>
                  <span className="absolute left-[50%] -translate-x-1/2">50</span>
                  <span className="absolute left-[75%] -translate-x-1/2">75</span>
                  <span className="absolute right-0">100</span>
                </div>
              </div>
            </div>
            
            <HealthDonut
              score={vehicle.healthScore}
              trend={
                vehicle.healthScore >= 85 ? "+2" :
                vehicle.healthScore >= 70 ? "+1" :
                vehicle.healthScore >= 50 ? "-8" : "-15"
              }
            />
          </div>
        </Card>

        {/* Card 2: Engine Temp */}
        <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Thermometer className="size-4.5 text-red-500 shrink-0" />
              <span>Suhu Mesin</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-mono">{tempVal.toFixed(0)}</span>
              <span className="text-xs text-muted-foreground font-semibold">Â°C</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ml-1 ${
                tempVal > 95
                  ? "bg-red-50 text-red-700 border-red-200"
                  : tempVal > 88
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {tempVal > 95 ? "Kritis" : tempVal > 88 ? "Tinggi" : "Normal"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Threshold: 95 Â°C</p>
          </div>
          <div className="flex justify-end pt-3">
            <Sparkline
              values={tempSpark}
              colorClass={tempVal > 88 ? "text-red-500" : "text-emerald-500"}
            />
          </div>
        </Card>

        {/* Card 3: Fuel Rate */}
        <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Fuel className="size-4.5 text-emerald-500 shrink-0" />
              <span>Konsumsi BBM</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-mono">{fuelVal.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground font-semibold">L/jam</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 ml-1">
                Normal
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Rata-rata 24 jam</p>
          </div>
          <div className="flex justify-end pt-3">
            <Sparkline values={fuelSpark} colorClass="text-emerald-500" />
          </div>
        </Card>

        {/* Card 4: Vibration (RMS) */}
        <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Activity className="size-4.5 text-amber-500 shrink-0" />
              <span>Getaran (RMS)</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-mono">{vibVal.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground font-semibold">mm/s</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ml-1 ${
                vibVal > 15
                  ? "bg-red-50 text-red-700 border-red-200"
                  : vibVal > 7
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {vibVal > 15 ? "Tinggi" : vibVal > 7 ? "Sedang" : "Normal"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Threshold: 10 mm/s</p>
          </div>
          <div className="flex justify-end pt-3">
            <Sparkline
              values={vibSpark}
              colorClass={vibVal > 15 ? "text-red-500" : vibVal > 7 ? "text-amber-500" : "text-emerald-500"}
            />
          </div>
        </Card>

        {/* Card 5: Kecepatan */}
        <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Clock3 className="size-4.5 text-emerald-500 shrink-0" />
              <span>Kecepatan</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-mono">{speedVal.toFixed(0)}</span>
              <span className="text-xs text-muted-foreground font-semibold">km/jam</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 ml-1">
                Normal
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Rata-rata 24 jam</p>
          </div>
          <div className="flex justify-end pt-3">
            <Sparkline values={speedSpark} colorClass="text-emerald-500" />
          </div>
        </Card>
      </section>

      {/* â”€â”€â”€ 2-Column Dashboard Grid â”€â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column (2/3 width grid) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card: Tren Health Score */}
            <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm font-extrabold text-foreground">Tren Health Score</span>
                  <select className="text-[11px] font-bold border rounded-lg px-2 py-1 bg-background text-muted-foreground focus:outline-none shadow-sm cursor-pointer">
                    <option>7 Hari Terakhir</option>
                    <option>30 Hari Terakhir</option>
                  </select>
                </div>
                <div className="pt-4 flex items-center justify-center">
                  <svg className="w-full h-[150px]" viewBox="0 0 350 150">
                    <defs>
                      <linearGradient id={`healthGrad-${vehicle.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="30" y1="25" x2="320" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="30" y1="75" x2="320" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="30" y1="125" x2="320" y2="125" stroke="#e2e8f0" strokeWidth="1" />
                    
                    <path d={areaD} fill={`url(#healthGrad-${vehicle.id})`} />
                    <path d={lineD} fill="none" stroke={chartColor} strokeWidth="2.2" strokeLinecap="round" />
                    
                    {pts.map((p, idx) => {
                      const isLast = idx === pts.length - 1;
                      return (
                        <g key={idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isLast ? 4.5 : 3}
                            fill={isLast ? chartColor : "#ffffff"}
                            stroke={chartColor}
                            strokeWidth={isLast ? 2.5 : 1.5}
                          />
                          {isLast && (
                            <text
                              x={p.x + 8}
                              y={p.y + 4}
                              className="text-[11px] font-extrabold"
                              fill={chartColor}
                            >
                              {p.val}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    
                    {["15 Mei", "16 Mei", "17 Mei", "18 Mei", "19 Mei", "20 Mei", "21 Mei"].map((lbl, idx) => (
                      <text
                        key={idx}
                        x={30 + idx * 48.3}
                        y="144"
                        textAnchor="middle"
                        className="fill-muted-foreground text-[8.5px] font-medium"
                      >
                        {lbl}
                      </text>
                    ))}
                    
                    <text x="22" y="28" textAnchor="end" className="fill-muted-foreground text-[8.5px] font-medium">100</text>
                    <text x="22" y="78" textAnchor="end" className="fill-muted-foreground text-[8.5px] font-medium">50</text>
                    <text x="22" y="128" textAnchor="end" className="fill-muted-foreground text-[8.5px] font-medium">0</text>
                  </svg>
                </div>
              </div>
            </Card>

            {/* Card: Tren Suhu Mesin */}
            <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm font-extrabold text-foreground">Tren Suhu Mesin</span>
                  <div className="flex items-center gap-3 text-[10px] font-semibold">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-red-500 rounded" />
                      <span className="text-muted-foreground">Suhu Mesin</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-red-500" />
                      <span className="text-muted-foreground">Ambang Batas</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-center">
                  <svg className="w-full h-[150px]" viewBox="0 0 350 150">
                    <defs>
                      <linearGradient id={`tempGrad-${vehicle.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="30" y1="25" x2="320" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="30" y1="75" x2="320" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="30" y1="125" x2="320" y2="125" stroke="#e2e8f0" strokeWidth="1" />
                    
                    <line
                      x1="30"
                      y1={threshY}
                      x2="320"
                      y2={threshY}
                      stroke="#ef4444"
                      strokeDasharray="4,4"
                      strokeWidth="1.5"
                    />
                    <text x="325" y={threshY + 3} className="fill-red-600 text-[8px] font-extrabold">95Â°C</text>
                    
                    <path d={tempAreaD} fill={`url(#tempGrad-${vehicle.id})`} />
                    <path d={tempLineD} fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
                    
                    {tempPts.map((p, idx) => {
                      const isLast = idx === tempPts.length - 1;
                      if (!isLast) return null;
                      return (
                        <g key={idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="#ef4444"
                            stroke="#ef4444"
                            strokeWidth="2"
                          />
                          <text
                            x={p.x - 22}
                            y={p.y - 6}
                            className="text-[11px] font-extrabold"
                            fill="#ef4444"
                          >
                            {p.val.toFixed(0)}Â°C
                          </text>
                        </g>
                      );
                    })}
                    
                    {["20 Mei 00:00", "20 Mei 12:00", "21 Mei 00:00", "21 Mei 12:00"].map((lbl, idx) => (
                      <text
                        key={idx}
                        x={30 + idx * 96.6}
                        y="144"
                        textAnchor="middle"
                        className="fill-muted-foreground text-[8px] font-semibold"
                      >
                        {lbl}
                      </text>
                    ))}
                    
                    <text x="22" y="28" textAnchor="end" className="fill-muted-foreground text-[8.5px] font-medium">120Â°</text>
                    <text x="22" y="78" textAnchor="end" className="fill-muted-foreground text-[8.5px] font-medium">85Â°</text>
                    <text x="22" y="128" textAnchor="end" className="fill-muted-foreground text-[8.5px] font-medium">50Â°</text>
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card: Status Komponen Utama */}
            <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-border">
                  <span className="text-sm font-extrabold text-foreground">Status Komponen Utama</span>
                </div>
                
                <div className="mt-3 space-y-2.5">
                  {components.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs pb-1.5 border-b border-dashed border-border last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        {comp.name === "Ban (Rata-rata)" ? (
                          <Ban className="size-4 text-muted-foreground" />
                        ) : (
                          <Settings className="size-4 text-muted-foreground" />
                        )}
                        <span className="font-semibold text-foreground">{comp.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          comp.tone === "danger"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : comp.tone === "warning"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {comp.status}
                        </span>
                        <span className="font-mono font-bold text-foreground text-right w-12">{comp.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full flex items-center justify-center py-2.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground mt-4 transition-colors">
                Lihat Detail Komponen
              </button>
            </Card>

            {/* Card: Anomali Terakhir */}
            <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-sm font-extrabold text-foreground">Anomali Terakhir</span>
                  <select className="text-[10px] font-bold border rounded px-1.5 py-0.5 bg-background text-muted-foreground focus:outline-none shadow-sm cursor-pointer">
                    <option>7 Hari Terakhir</option>
                  </select>
                </div>
                
                <div className="mt-3.5 space-y-3">
                  {[
                    { title: "Suhu Mesin Tinggi", date: "20 Mei 2025, 14:32 WIB", count: "2 Kejadian", icon: Thermometer, color: "text-red-500" },
                    { title: "Vibrasi Meningkat", date: "19 Mei 2025, 09:18 WIB", count: "1 Kejadian", icon: Activity, color: "text-amber-500" },
                    { title: "Konsumsi BBM Tidak Normal", date: "18 Mei 2025, 16:05 WIB", count: "1 Kejadian", icon: Fuel, color: "text-red-500" }
                  ].map((anom, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs hover:bg-muted/20 p-1 rounded-lg transition-colors cursor-pointer group">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-muted">
                          <anom.icon className={`size-4 ${anom.color}`} />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{anom.title}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{anom.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-50 text-red-700 border-red-100">
                          {anom.count}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full flex items-center justify-center py-2.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground mt-4 transition-colors">
                Lihat Semua Anomali
              </button>
            </Card>

          </div>
        </div>

        {/* Right Column (1/3 width stacked) */}
        <div className="space-y-4">
          
          {/* Card: Rekomendasi Maintenance */}
          <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-border mb-3">
                <span className="text-sm font-extrabold text-foreground">Rekomendasi Maintenance</span>
              </div>
              
              {/* Alert banner */}
              <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs mb-4">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Inspeksi Segera Disarankan</p>
                  <p className="text-amber-700 font-medium mt-0.5 leading-relaxed">
                    Health score menurun dan suhu mesin mendekati ambang batas.
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                {[
                  { title: "Periksa Sistem Pendingin Mesin", desc: "Suhu mesin mendekati threshold kritis.", priority: "Prioritas Tinggi", tone: "danger" },
                  { title: "Periksa Sistem Filter Udara", desc: "Penurunan performa dapat terjadi.", priority: "Prioritas Sedang", tone: "warning" },
                  { title: "Cek Sistem Hidrolik bucket", desc: "Vibrasi meningkat, periksa kebocoran.", priority: "Prioritas Sedang", tone: "warning" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 text-xs p-1">
                    <div className="flex gap-2.5">
                      <div className="mt-1 flex items-center justify-center size-3.5 rounded-full border border-muted-foreground/35 bg-background text-[9px] shrink-0" />
                      <div>
                        <p className="font-bold text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      item.tone === "danger"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full flex items-center justify-center py-2.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground mt-4 transition-colors">
              Lihat Semua Rekomendasi (5)
            </button>
          </Card>

          {/* Card: Riwayat Inspeksi Terakhir */}
          <Card className="rounded-xl shadow-sm border p-4.5 bg-card flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-border mb-3.5">
                <span className="text-sm font-extrabold text-foreground">Riwayat Inspeksi Terakhir</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { title: "Inspeksi Rutin Harian", date: "21 Mei 2025, 06:45 WIB" },
                  { title: "Inspeksi Sistem Pendingin", date: "19 Mei 2025, 15:20 WIB" },
                  { title: "Inspeksi Sistem Hidrolik", date: "17 Mei 2025, 10:10 WIB" }
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs hover:bg-muted/20 p-1.5 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{log.title}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{log.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                        Selesai
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full flex items-center justify-center py-2.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground mt-4 transition-colors">
              Lihat Semua Riwayat
            </button>
          </Card>

        </div>

      </div>
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function HaulingMaintenanceScreen({
  initialSelectedId = null,
}: {
  initialSelectedId?: string | null;
} = {}) {
  const cc = useCommandCenter();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  const ccTrucksRef = useRef(cc.trucks);
  const ccAssignmentsRef = useRef(cc.assignments);
  useEffect(() => { ccTrucksRef.current = cc.trucks; }, [cc.trucks]);
  useEffect(() => { ccAssignmentsRef.current = cc.assignments; }, [cc.assignments]);

  const fetchData = useCallback(async () => {
    try {
      const [telemetryRes, recsRes] = await Promise.all([
        api.getLatestTelemetry(),
        api.getRecommendations(undefined, "open"),
      ]);

      const rows: VehicleRow[] = ccTrucksRef.current
        .map((truck) => ({
          id: truck.id,
          name: truck.code,
          type: "hauler",
          capacityTon: truck.capacityTon,
          status: truck.status,
          healthScore: truck.healthScore,
          currentNodeId: truck.currentNodeId,
          lat: truck.position.lat,
          lng: truck.position.lng,
          telemetry: telemetryForTruck(telemetryRes, truck, ccAssignmentsRef.current),
          recs: recommendationsForTruck(recsRes, truck.id)
            .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority)),
        }))
        .sort((a, b) => a.healthScore - b.healthScore);

      setVehicles(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data maintenance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = window.setInterval(fetchData, 5_000);
    return () => window.clearInterval(interval);
  }, [fetchData]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-none">
              <CardHeader className="px-5 pb-2 pt-4">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="mt-2 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-xl shadow-none">
          <CardContent className="space-y-2 px-5 py-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
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
          <Button size="sm" variant="ghost" className="ml-auto" onClick={fetchData}>
            Coba lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (selectedVehicle) {
    return <MaintenanceDetailScreen vehicle={selectedVehicle} onBack={() => setSelectedId(null)} />;
  }

  return <MaintenanceListScreen vehicles={vehicles} onOpen={setSelectedId} />;
}
