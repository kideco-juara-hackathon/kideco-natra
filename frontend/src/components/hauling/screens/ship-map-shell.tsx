"use client";

import dynamic from "next/dynamic";

import type { ShipMapProps } from "./ship-map";

const ShipMap = dynamic(
  () => import("./ship-map").then((m) => m.ShipMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-[var(--bg-subtle)] text-xs text-muted-foreground">
        Memuat peta armada kapal…
      </div>
    ),
  },
);

export function ShipMapShell(props: ShipMapProps) {
  return <ShipMap {...props} />;
}
