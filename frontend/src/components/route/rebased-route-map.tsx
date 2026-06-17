"use client";

import { useMemo, useState } from "react";
import { divIcon } from "leaflet";
import { ImageIcon, MapIcon, Layers } from "lucide-react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
} from "react-leaflet";

import type { RouteAssignment, Truck } from "@/data/hauling-screens";
import { operationalTopology } from "@/data/operational-topology";

export type HaulingMapProps = {
  mode: "dispatch" | "operational";
  trucks: Truck[];
  assignments: RouteAssignment[];
  selectedTruckId?: string | null;
  onTruckSelect?: (truckId: string) => void;
  /** Hide the built-in top-left info label (Command Center supplies its own chrome). */
  showInfoLabel?: boolean;
  shiftControlsLeft?: boolean;
};

const nodeById = new Map<string, (typeof operationalTopology.nodes)[number]>(
  operationalTopology.nodes.map((node) => [node.id, node]),
);
const dispatchPoint = operationalTopology.nodes.find((node) => node.type === "dispatch_point");

function nodeColor(type: string) {
  if (type === "dispatch_point") return "#111827";
  if (type === "pit") return "#7C3AED";
  if (type === "loading_point") return "#0F766E";
  if (type === "stockpile") return "#EA580C";
  return "#64748B";
}

function nodeRadius(type: string) {
  if (type === "dispatch_point" || type === "stockpile") return 8;
  if (type === "loading_point") return 6;
  return 4;
}

function edgeStyle(type: string) {
  if (type === "loaded_haul") return { color: "#E81B2D", weight: 3, opacity: 0.26 };
  if (type === "empty_haul") return { color: "#2563EB", weight: 2, opacity: 0.24, dashArray: "8 8" };
  return { color: "#64748B", weight: 2, opacity: 0.2 };
}

function routePositions(routeNodes: string[]) {
  return routeNodes
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .map((node) => [node.lat, node.lng] as [number, number]);
}

function positionAlongRoute(routeNodes: string[], progress: number): [number, number] {
  const positions = routePositions(routeNodes);
  if (positions.length === 0) {
    const center = operationalTopology.metadata.center;
    return [center.lat, center.lng];
  }
  if (positions.length === 1) return positions[0];

  const boundedProgress = Math.max(0, Math.min(progress, 99.5)) / 100;
  const scaled = boundedProgress * (positions.length - 1);
  const segmentIndex = Math.min(Math.floor(scaled), positions.length - 2);
  const segmentProgress = scaled - segmentIndex;
  const start = positions[segmentIndex];
  const end = positions[segmentIndex + 1];

  return [
    start[0] + (end[0] - start[0]) * segmentProgress,
    start[1] + (end[1] - start[1]) * segmentProgress,
  ];
}

function truckMarkerIcon({
  healthScore,
  status,
  selected,
}: {
  healthScore: number;
  status: Truck["status"];
  selected: boolean;
}) {
  // Idle/ready trucks are colored by health so the dispatcher can pick the
  // healthiest available unit at a glance; active trucks read as operational.
  const colorClass = selected
    ? "is-selected"
    : status === "idle"
      ? healthScore >= 85
        ? "is-ready"
        : healthScore >= 70
          ? "is-watch"
          : "is-risk"
      : "is-operational";

  return divIcon({
    className: "truck-map-marker-wrapper",
    html: `<div class="truck-map-marker ${colorClass}"><span class="truck-map-marker__icon" aria-hidden="true"></span><span class="truck-map-marker__score">${healthScore}</span></div>`,
    iconAnchor: [20, 20],
    iconSize: [40, 40],
    tooltipAnchor: [0, -18],
  });
}

export function RebasedRouteMap({
  mode,
  trucks,
  assignments,
  selectedTruckId,
  onTruckSelect,
  showInfoLabel = true,
  shiftControlsLeft = false,
}: HaulingMapProps) {
  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const center = operationalTopology.metadata.center;
  const assignmentByTruck = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.truckId, assignment])),
    [assignments],
  );

  return (
    <div className={`route-osm-map relative ${shiftControlsLeft ? "shift-controls-left" : ""}`}>
      <div className={`absolute top-[92px] z-[500] ${shiftControlsLeft ? "right-[472px]" : "right-3"} transition-all duration-200`}>
        <button
          aria-label="Toggle map mode"
          className="grid size-10 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-subtle)] shadow-[var(--shadow-sm)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-default)] transition"
          onClick={() => setMapMode((current) => (current === "street" ? "satellite" : "street"))}
          type="button"
        >
          <Layers className="size-5" />
        </button>
      </div>

      {showInfoLabel ? (
        <div className="absolute left-16 top-3 z-[500] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-caption shadow-[var(--shadow-sm)]">
          {mode === "dispatch"
            ? `${trucks.length} truk menunggu assignment`
            : `${trucks.length} truk aktif dalam monitoring`}
        </div>
      ) : null}

      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom zoomControl={false}>
        <ZoomControl position="topright" />
        {mapMode === "street" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {operationalTopology.edges.map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) return null;

          return (
            <Polyline
              key={edge.id}
              positions={[
                [from.lat, from.lng],
                [to.lat, to.lng],
              ]}
              pathOptions={edgeStyle(edge.type)}
            />
          );
        })}

        {assignments.map((assignment) => (
          <Polyline
            key={assignment.tripId}
            positions={routePositions(assignment.routeNodes)}
            pathOptions={{
              color: assignment.truckId === selectedTruckId ? "#E81B2D" : "#0F766E",
              opacity: assignment.truckId === selectedTruckId ? 0.95 : 0.62,
              weight: assignment.truckId === selectedTruckId ? 5 : 3,
            }}
          />
        ))}

        {dispatchPoint ? (
          <Circle
            center={[dispatchPoint.lat, dispatchPoint.lng]}
            pathOptions={{
              color: "#111827",
              dashArray: "7 7",
              fillColor: "#111827",
              fillOpacity: 0.08,
              opacity: 0.55,
              weight: 2,
            }}
            radius={190}
          >
            <Tooltip direction="top">Dispatch staging radius</Tooltip>
          </Circle>
        ) : null}

        {operationalTopology.nodes
          .filter((node) =>
            mode === "dispatch"
              ? ["dispatch_point", "pit", "loading_point", "stockpile", "checkpoint"].includes(node.type)
              : true,
          )
          .map((node) => (
            <CircleMarker
              key={node.id}
              center={[node.lat, node.lng]}
              pathOptions={{
                color: "#FFFFFF",
                fillColor: nodeColor(node.type),
                fillOpacity: 0.82,
                opacity: 0.9,
                weight: 2,
              }}
              radius={nodeRadius(node.type)}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {node.name}
              </Tooltip>
            </CircleMarker>
          ))}

        {trucks.map((truck) => {
          const assignment = assignmentByTruck.get(truck.id);
          const position =
            mode === "operational" && assignment
              ? positionAlongRoute(assignment.routeNodes, assignment.progress)
              : ([truck.position.lat, truck.position.lng] as [number, number]);
          const selected = truck.id === selectedTruckId;

          return (
            <Marker
              icon={truckMarkerIcon({ healthScore: truck.healthScore, status: truck.status, selected })}
              key={truck.id}
              position={position}
              eventHandlers={{
                click: () => onTruckSelect?.(truck.id),
              }}
            >
              <Tooltip direction="top" permanent>
                {truck.id}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
