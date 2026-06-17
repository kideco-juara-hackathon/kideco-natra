# Command Center — Build Spec (single source of truth)

> Anchor doc for the Hauling Command Center rebuild. Every edit references this.
> If context is lost, re-read this first. Target: KIC 2026 proposal demo (deadline 20 Jun 2026).

## Concept

One living screen for the dispatcher. The map is always center; everything else reacts on
top of it. Replaces the two separate screens (`Rencana Rute` + `Route Monitor`) with a single
**Command Center** that handles dispatch AND live monitoring at once. It should feel like
orchestrating a real-time strategy game, not browsing an admin panel.

## The core loop (the demo centerpiece)

1. A truck finishes dumping coal at `STOCKPILE-01` (progress reaches 100%).
2. It flips `active -> idle` and parks at `DISPATCH-01`.
3. A notification pops top-right: **"DT-0X selesai unload — siap dispatch"**.
4. Dispatcher clicks the notification (or the truck on the map / fleet rail).
5. Dispatch panel slides in → pick PIT + route → confirm.
6. Truck flips `idle -> active` and animates along the route. Loop repeats.

This continuous rhythm — alerts firing, trucks moving, dispatcher reacting — is what we demo.

## Layout zones

```
TOP        Shift HUD: target tons · hauled tons · active/idle count · on-schedule %
LEFT       Fleet Rail: all 5 trucks, status + health + current task, click to select
CENTER     Live map (RebasedRouteMap): idle trucks at dispatch + active trucks moving
RIGHT-TOP  Notification feed + transient toasts
RIGHT      Dispatch panel (existing) — slides in when an idle truck is selected
```

The map already supports both: `mode="dispatch"` (idle staging) and `mode="operational"`
(animate along `assignment.progress`). Command Center shows BOTH truck sets on one map.

## Fleet (simplified for demo)

Exactly **5 trucks**: `DT-01 … DT-05`. Mixed start state — some idle at dispatch, some active
mid-route. Defined in `data/hauling-screens.ts`.

## Files

```
components/hauling/command-center/
  SPEC.md                     ← this file
  command-center-screen.tsx   ← composes everything; owns shared state
  fleet-rail.tsx              ← left roster
  shift-hud.tsx               ← top KPIs
  notification-feed.tsx       ← right-top feed + toasts
lib/command-center/
  events.ts                   ← event/notification types + factory
  use-command-center.ts       ← simulation loop + state hook (progress, events, selection)
```
Reused as-is: `route/rebased-route-map*`, `hauling/components/dispatch-panel`,
`data/operational-topology`, `data/hauling-screens`.

## Event / notification model (`lib/command-center/events.ts`)

```ts
type CommandEventKind =
  | "truck-ready"      // finished unload, idle, needs dispatch   (action: open dispatch)
  | "dispatched"       // truck sent out                          (info)
  | "low-fuel"         // active truck fuel below threshold        (warn)
  | "maintenance"      // health/vibration alert                   (danger, action: inspect)
  | "pit-low"          // a pit's available coal running low        (warn)
  | "weather";         // BMKG rule trigger                         (info)

type CommandEvent = {
  id: string;
  kind: CommandEventKind;
  truckId?: string;
  title: string;       // Indonesian, short
  detail?: string;
  tone: "info" | "warn" | "danger" | "success";
  actionLabel?: string;
  createdAt: number;
  read: boolean;
};
```

## Design tokens (reuse only — no new palette)

- Surfaces: `--bg-surface`, `--bg-subtle`, borders `--border-default` / `--border-subtle`
- Brand: `--kideco-red-*` (accent, danger uses `--danger-*`)
- Radius: `--radius-md` / `--radius-lg`; Shadow: `--shadow-md` / `--shadow-lg`
- Type scale: `text-caption`, `text-body-sm`, `text-heading-md` (already in use)
- Tone → color: info=text-subtle, warn=amber, danger=`--danger-*`, success=teal/`--kideco`

## Z-index ladder (map is leaflet, panels float above)

- map: base · node tooltips: ~500 · feed/HUD/rail overlays: 500 · dispatch panel: 600 ·
  toasts: 700 · map mode toggle: 1000 (existing)

## Out of scope (leave as-is for now)

- Maintenance screen, Overview screen — separate, no map, different rhythm.
- Marine section — placeholders.
- Real backend `/route` (A*) — Dispatch still uses `getRouteOptions` mock until Dicha ships it.
  Swap point is isolated to `data/hauling-screens.ts`.

## Status / checklist

- [x] 5-truck data
- [x] events.ts + use-command-center hook (sim loop fires truck-ready)
- [x] notification feed + toast
- [x] fleet rail + shift HUD
- [x] command-center-screen assembled + wired into workspace/sidebar (sidebar:
      Route Intelligence → Command Center + Route Monitor; route-intelligence parent
      key now resolves to hauling-command-center)
- [x] `npx tsc --noEmit` clean

### Next refinements (not yet done)
- Active-truck click currently just highlights; could show a compact monitor card.
- Dispatch panel still uses `getRouteOptions` mock — swap to backend A* `/route` when ready.
- Map mode toggle moved to bottom-center; revisit if it clashes with anything.
