"use client";

import dynamic from "next/dynamic";

import type { HaulingMapProps } from "./rebased-route-map";

const RebasedRouteMap = dynamic(
  () => import("./rebased-route-map").then((module) => module.RebasedRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[620px] place-items-center bg-[var(--bg-subtle)] text-body-sm text-[var(--text-subtle)]">
        Loading OpenStreetMap layer...
      </div>
    ),
  },
);

export function RebasedRouteMapShell(props: HaulingMapProps) {
  return <RebasedRouteMap {...props} />;
}
