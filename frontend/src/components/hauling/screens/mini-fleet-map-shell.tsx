"use client";

import dynamic from "next/dynamic";

import type { MiniFleetMapProps } from "./mini-fleet-map";

const MiniFleetMap = dynamic(
  () => import("./mini-fleet-map").then((module) => module.MiniFleetMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-[var(--bg-subtle)] text-xs text-muted-foreground">
        Memuat peta…
      </div>
    ),
  },
);

export function MiniFleetMapShell(props: MiniFleetMapProps) {
  return <MiniFleetMap {...props} />;
}
