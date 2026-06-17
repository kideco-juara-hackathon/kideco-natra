"use client";

import { useMemo } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, ZoomControl } from "react-leaflet";

import type { NodeResponse, VehicleResponse } from "@/lib/api";

// Batu Kajang corridor anchor — used only when no vehicle has a resolvable position.
const FALLBACK_CENTER: [number, number] = [-1.890937, 115.871586];

const STATUS_COLOR: Record<string, string> = {
  active: "#16A34A",
  idle: "#D97706",
  maintenance: "#DC2626",
};

function statusColor(status: string) {
  return STATUS_COLOR[status] ?? "#94A3B8";
}

export type MiniFleetMapProps = {
  vehicles: VehicleResponse[];
  nodes: NodeResponse[];
  latestTelemetry?: Record<string, { speedKmh: number | null }>;
  interactive?: boolean;
};

export function MiniFleetMap({
  vehicles,
  nodes,
  latestTelemetry = {},
  interactive = false,
}: MiniFleetMapProps) {
  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const points = useMemo(() => {
    return vehicles
      .filter((v) => v.type === "hauler")
      .map((v) => {
        const node = v.currentNodeId ? nodeById.get(v.currentNodeId) : undefined;
        const lat = v.lat ?? node?.lat ?? null;
        const lng = v.lng ?? node?.lng ?? null;
        if (lat === null || lng === null) return null;
        return { vehicle: v, lat, lng };
      })
      .filter((p): p is { vehicle: VehicleResponse; lat: number; lng: number } => p !== null);
  }, [vehicles, nodeById]);

  const center: [number, number] =
    points.length > 0
      ? [
          points.reduce((sum, p) => sum + p.lat, 0) / points.length,
          points.reduce((sum, p) => sum + p.lng, 0) / points.length,
        ]
      : FALLBACK_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={13}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
      {interactive && <ZoomControl position="topleft" />}
      {points.map(({ vehicle, lat, lng }) => (
        <CircleMarker
          key={vehicle.id}
          center={[lat, lng]}
          radius={4}
          pathOptions={{
            color: "#ffffff",
            weight: 1.5,
            fillColor: statusColor(vehicle.status),
            fillOpacity: 1,
          }}
        >
          {interactive ? (
            <Tooltip
              direction="top"
              offset={[0, -8]}
              permanent
              className={`custom-map-tooltip border-l-[3.5px] ${
                vehicle.status === "active"
                  ? "border-l-[#16A34A]"
                  : vehicle.status === "idle"
                    ? "border-l-[#D97706]"
                    : "border-l-[#DC2626]"
              }`}
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="font-semibold text-foreground text-[11px]">{vehicle.id}</span>
                <span className="text-[9.5px] text-muted-foreground font-medium">
                  {(() => {
                    const speedKmh = latestTelemetry[vehicle.id]?.speedKmh ?? null;
                    return speedKmh !== null ? `${Math.round(speedKmh)} km/jam` : "0 km/jam";
                  })()}
                </span>
              </div>
            </Tooltip>
          ) : (
            <Tooltip direction="top" offset={[0, -6]}>
              {vehicle.id} · health {vehicle.healthScore}
            </Tooltip>
          )}
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
