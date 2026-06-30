"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { divIcon } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
} from "react-leaflet";

import {
  SHIP_NODES,
  SHIP_ROUTE_WAYPOINTS,
  type ShipNode,
  type ShipRow,
} from "@/data/ship-data";

export type ShipMapProps = {
  ships: ShipRow[];
  selectedShipId?: string | null;
  onShipSelect?: (id: string) => void;
};

// Center between Balikpapan (-1.28, 116.85) and Tarahan (-5.48, 105.28) → midpoint ~(-3.4, 111.1)
const MAP_CENTER: [number, number] = [-3.4, 111.1];
const MAP_ZOOM = 6;

// SVG icon strings for each ship status
const SHIP_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1C7 22 7 20 9.5 20s2.4 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 3v4"/></svg>`;
const ANCHOR_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`;
const WRENCH_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
const ANCHOR_SM_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`;
const WRENCH_SM_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;

function healthColor(score: number) {
  if (score >= 85) return "#16a34a";
  if (score >= 70) return "#2563eb";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function shipMarkerIcon(ship: ShipRow, selected: boolean) {
  const bg =
    ship.status === "berlayar" ? "#0284C7"
    : ship.status === "sandar" ? "#059669"
    : "#DC2626";

  const statusLabel =
    ship.status === "berlayar" ? "Berlayar"
    : ship.status === "sandar" ? "Sandar"
    : "Perawatan";

  const statusBg =
    ship.status === "berlayar" ? "#f0f9ff"
    : ship.status === "sandar" ? "#f0fdf4"
    : "#fef2f2";

  const statusColor =
    ship.status === "berlayar" ? "#0369a1"
    : ship.status === "sandar" ? "#15803d"
    : "#b91c1c";

  const iconSvg =
    ship.status === "sandar" ? ANCHOR_SVG
    : ship.status === "perawatan" ? WRENCH_SVG
    : SHIP_SVG;

  const glow = selected
    ? `box-shadow:0 0 0 2.5px white,0 0 0 5px ${bg};`
    : "";

  return divIcon({
    className: "ship-map-marker-wrapper",
    html: `<div class="ship-map-marker">
      <div class="ship-map-icon" style="background:${bg};${glow}">${iconSvg}</div>
      <div class="ship-map-label">
        <div class="ship-map-label__row">
          <span class="ship-map-label__id">${ship.id}</span>
          <span class="ship-map-label__health" style="color:${healthColor(ship.healthScore)}">${ship.healthScore}</span>
        </div>
        <span class="ship-map-label__status" style="background:${statusBg};color:${statusColor}">${statusLabel}</span>
      </div>
    </div>`,
    iconAnchor: [20, 20],
    iconSize: [210, 44],
  });
}

function nodeMarkerIcon(node: ShipNode) {
  const isDockyard = node.type === "dockyard";
  const bg = isDockyard ? "#DC2626" : node.type === "dermaga" ? "#0284C7" : "#7C3AED";
  const svg = isDockyard ? WRENCH_SM_SVG : ANCHOR_SM_SVG;
  return divIcon({
    className: "ship-node-marker-wrapper",
    html: `<div class="ship-node-marker" style="background:${bg}">${svg}</div>`,
    iconAnchor: [14, 14],
    iconSize: [28, 28],
  });
}

function routeColor(routeId: string, isActive: boolean) {
  if (isActive) return "#0284C7";
  if (routeId === "R-DOCKYARD") return "#DC2626";
  return "#94A3B8";
}

export function ShipMap({ ships, selectedShipId, onShipSelect }: ShipMapProps) {
  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");

  const selectedShip = ships.find((s) => s.id === selectedShipId) ?? null;
  const selectedRouteId = selectedShip?.routeId ?? null;

  return (
    <div className="route-osm-map relative h-full w-full">
      {/* Layer toggle */}
      <div className="absolute right-3 top-[56px] z-[500]">
        <button
          aria-label="Toggle map layer"
          className="grid size-10 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-subtle)] shadow-[var(--shadow-sm)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-default)] transition"
          onClick={() => setMapMode((m) => (m === "street" ? "satellite" : "street"))}
          type="button"
        >
          <Layers className="size-5" />
        </button>
      </div>

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        scrollWheelZoom
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomControl position="topright" />

        {mapMode === "street" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* Route polylines */}
        {Object.entries(SHIP_ROUTE_WAYPOINTS).map(([routeId, positions]) => {
          const active = routeId === selectedRouteId;
          const color = routeColor(routeId, active);
          const isDockyard = routeId === "R-DOCKYARD";
          return (
            <Polyline
              key={routeId}
              positions={positions}
              pathOptions={{
                color,
                weight: active ? 4 : 2.5,
                opacity: active ? 0.9 : 0.45,
                dashArray: isDockyard ? "8 6" : active ? undefined : "10 7",
              }}
            />
          );
        })}

        {/* Waypoint dots along R-TARAHAN (intermediate points only) */}
        {(SHIP_ROUTE_WAYPOINTS["R-TARAHAN"] ?? [])
          .slice(1, -1)
          .map((pos, i) => (
            <CircleMarker
              key={`tarahan-wp-${i}`}
              center={pos}
              radius={3.5}
              pathOptions={{
                color: selectedRouteId === "R-TARAHAN" ? "#0284C7" : "#94A3B8",
                fillColor: "#ffffff",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}

        {/* Node markers (anchor / wrench icons) */}
        {SHIP_NODES.map((node) => (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={nodeMarkerIcon(node)}
            zIndexOffset={100}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <span className="font-semibold text-[11px]">{node.label}</span>
            </Tooltip>
          </Marker>
        ))}

        {/* Ship markers */}
        {ships.map((ship) => {
          const selected = ship.id === selectedShipId;
          return (
            <Marker
              key={ship.id}
              position={[ship.lat, ship.lng]}
              icon={shipMarkerIcon(ship, selected)}
              zIndexOffset={selected ? 500 : 200}
              eventHandlers={{ click: () => onShipSelect?.(ship.id) }}
            />
          );
        })}
      </MapContainer>

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-1/2 z-[500] -translate-x-1/2">
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/95 px-4 py-2 text-[10.5px] shadow-[var(--shadow-md)] backdrop-blur-sm">
          <LegendLine color="#0284C7" label="Rute Aktif" />
          <LegendLine color="#DC2626" dashed label="Perawatan" />
          <div className="h-3.5 w-px bg-border" />
          <LegendNode color="#0284C7" label="Dermaga" />
          <LegendNode color="#DC2626" label="Dockyard" />
          <LegendDot label="Waypoint" />
        </div>
      </div>
    </div>
  );
}

function LegendLine({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="22" height="6">
        <line
          x1="0" y1="3" x2="22" y2="3"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? "5 3" : undefined}
        />
      </svg>
      <span className="text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function LegendNode({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="size-4 rounded-full border-2 border-white shadow-sm"
        style={{ background: color }}
      />
      <span className="text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function LegendDot({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="size-3 rounded-full border-2 border-[#94A3B8] bg-white" />
      <span className="text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

