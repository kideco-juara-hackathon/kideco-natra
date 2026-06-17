import { dispatchSeedEdges, dispatchSeedNodes, haulingSeedMetadata } from "./generated/hauling-seeds";

export type OperationalNodeType =
  | "dispatch_point"
  | "pit"
  | "loading_point"
  | "checkpoint"
  | "stockpile"
  | "jetty";

export type OperationalEdgeType = "empty_haul" | "loaded_haul" | "connector" | "terminal_transfer";

const nodeTypeMap = {
  dispatch: "dispatch_point",
  pit: "pit",
  loading_point: "loading_point",
  checkpoint: "checkpoint",
  dump_point: "stockpile",
} as const;

function toOperationalEdgeType(type: string): OperationalEdgeType {
  if (type === "empty_haul" || type === "loaded_haul" || type === "connector") return type;
  return "connector";
}

export const operationalTopology = {
  metadata: {
    source: "MVP hauling seed data derived from internal road segment CSV.",
    center: {
      lat: -1.890937,
      lng: 115.871586,
      label: "Batu Kajang / KIDECO simulation anchor",
    },
    datasetSource: haulingSeedMetadata.source,
    datasetAggregation:
      "Visual nodes are rebased for demo readability; edge distance, speed, ETA, and sample count are generated from the road segment dataset.",
    note: haulingSeedMetadata.note,
  },
  nodes: dispatchSeedNodes.map((node) => ({
    id: node.id,
    name: node.name,
    type: nodeTypeMap[node.type],
    lat: node.visualLat,
    lng: node.visualLng,
    sourceWaypointId: node.sourceWaypointId,
    sourceLoaderId: "sourceLoaderId" in node ? node.sourceLoaderId : undefined,
    description:
      node.type === "dispatch"
        ? "Titik standby kendaraan sebelum dispatcher membuat rencana hauling."
        : node.type === "dump_point"
          ? "Titik bongkar hasil hauling untuk skenario MVP."
          : `Node operasional yang direbase dari ${node.sourceWaypointId}.`,
  })),
  edges: dispatchSeedEdges.map((edge) => ({
    id: edge.id,
    from: edge.fromNodeId,
    to: edge.toNodeId,
    type: toOperationalEdgeType(edge.type),
    riskLevel: edge.riskLevel,
    distanceM: edge.distanceMeter,
    avgSpeedKmh: edge.avgSpeedKmh,
    avgDurationSec: edge.historicalEtaSec,
    sampleCount: edge.sampleCount,
    datasetEdgeIds: edge.sourceEdges,
    metricConfidence: edge.sampleCount >= 100 ? "medium" : "low",
    datasetMethod: "dataset_seed_path_aggregation",
  })),
} as const;
