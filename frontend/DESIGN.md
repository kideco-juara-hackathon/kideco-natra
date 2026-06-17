---
version: alpha
name: Kideco Logistics Control
description: Dense industrial operations dashboard for the KIC 2026 prototype. The product is an AI-IoT decision-support interface for coal logistics across hauling, jetty synchronization, marine route planning, fuel efficiency, and predictive maintenance. The design should feel operational, compact, professional, scan-friendly, and suited for dispatcher or fleet-control workflows.
status: Draft awal
updated: 2026-06-01

project:
  competition: Kideco Innovation Challenge 2026
  category: Hackathon
  theme: AI-Driven Operational Excellence
  domain: Coal logistics optimization
  primary_use_case: Route and logistics optimization for coal transportation using machine learning

visual_direction:
  reference_base: "Operational logistics dashboard similar to reference #2"
  reference_accents: "Selected analytical components from reference #1, especially donut efficiency and compact metric cards"
  personality:
    - dense
    - operational
    - industrial
    - professional
    - analytical
    - decision-support
  avoid:
    - marketing landing page layout
    - oversized hero sections
    - decorative illustration-first composition
    - excessive red surfaces
    - one-note beige, orange, or monochrome palette
    - card spacing that feels too airy
    - dashboard content that reads like generic shipment SaaS

colors:
  kideco-red-25: "#FFF6F7"
  kideco-red-50: "#FFF1F3"
  kideco-red-100: "#FFE1E5"
  kideco-red-200: "#FFC7CE"
  kideco-red-300: "#FF9BA8"
  kideco-red-400: "#F95F72"
  kideco-red-500: "#E81B2D"
  kideco-red-600: "#CC1324"
  kideco-red-700: "#A90F1D"
  kideco-red-800: "#8C111C"
  kideco-red-900: "#73141C"
  kideco-red-950: "#43080D"

  graphite-25: "#FAFAFA"
  graphite-50: "#F4F5F7"
  graphite-100: "#E5E7EB"
  graphite-200: "#D1D5DB"
  graphite-300: "#A1A1A2"
  graphite-400: "#858688"
  graphite-500: "#646567"
  graphite-600: "#4B4C4F"
  graphite-700: "#34363A"
  graphite-800: "#1F2328"
  graphite-900: "#111827"
  graphite-950: "#0D0E0F"

  success-50: "#ECFDF3"
  success-100: "#D1FADF"
  success-500: "#22C55E"
  success-600: "#16A34A"
  success-700: "#15803D"
  warning-50: "#FFFBEB"
  warning-100: "#FEF3C7"
  warning-500: "#FBBF24"
  warning-600: "#F59E0B"
  warning-700: "#B45309"
  danger-50: "#FEF2F2"
  danger-100: "#FEE2E2"
  danger-500: "#EF4444"
  danger-600: "#DC2626"
  danger-700: "#B91C1C"
  info-50: "#EFF6FF"
  info-100: "#DBEAFE"
  info-500: "#3B82F6"
  info-600: "#2563EB"
  info-700: "#1D4ED8"
  idle-50: "#F3F4F6"
  idle-100: "#E5E7EB"
  idle-600: "#6B7280"
  idle-700: "#4B5563"

  chart-blue: "#2563EB"
  chart-teal: "#0F766E"
  chart-purple: "#7C3AED"
  chart-orange: "#EA580C"
  chart-cyan: "#0891B2"
  chart-slate: "#64748B"
  chart-red: "#E81B2D"

  white: "#FFFFFF"
  black: "#0D0E0F"

semantic_colors:
  brand-primary: "{colors.kideco-red-500}"
  brand-primary-hover: "{colors.kideco-red-600}"
  brand-primary-subtle: "{colors.kideco-red-50}"
  bg-default: "{colors.graphite-50}"
  bg-app-frame: "#EEF2F6"
  bg-sidebar: "#F6F7FB"
  bg-surface: "{colors.white}"
  bg-subtle: "{colors.graphite-25}"
  bg-muted: "{colors.graphite-100}"
  bg-inverse: "{colors.graphite-950}"
  bg-critical-subtle: "{colors.kideco-red-50}"
  text-default: "{colors.graphite-900}"
  text-subtle: "{colors.graphite-600}"
  text-muted: "{colors.graphite-500}"
  text-inverse: "{colors.white}"
  text-danger: "{colors.danger-700}"
  border-subtle: "{colors.graphite-100}"
  border-default: "{colors.graphite-200}"
  border-strong: "{colors.graphite-300}"
  focus-ring: "{colors.kideco-red-500}"
  status-ready: "{colors.success-600}"
  status-active: "{colors.info-600}"
  status-monitor: "{colors.warning-600}"
  status-critical: "{colors.danger-600}"
  status-idle: "{colors.idle-600}"

typography:
  font-sans:
    fontFamily: "Unica77 LL, Neue Haas Unica, Helvetica Neue, Arial, system-ui, sans-serif"
  font-sans-alt:
    fontFamily: "Unica77 LL, IBM Plex Sans, Inter, system-ui, sans-serif"
  font-mono:
    fontFamily: "Unica77 Mono, JetBrains Mono, SFMono-Regular, Consolas, monospace"

  display-md:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 44px
    letterSpacing: 0
  display-sm:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: 0
  heading-xl:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
    letterSpacing: 0
  heading-lg:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: 0
  heading-md:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 18px
    fontWeight: 650
    lineHeight: 26px
    letterSpacing: 0
  heading-sm:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 15px
    fontWeight: 650
    lineHeight: 22px
    letterSpacing: 0
  body-lg:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0
  body-md:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0
  body-sm:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0
  label:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 12px
    fontWeight: 650
    lineHeight: 16px
    letterSpacing: 0
  caption:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0
  micro:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
    letterSpacing: 0
  metric-xl:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 44px
    letterSpacing: 0
  metric-lg:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 38px
    letterSpacing: 0
  metric-md:
    fontFamily: "{typography.font-sans.fontFamily}"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: 0
  unit-id:
    fontFamily: "{typography.font-mono.fontFamily}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0

rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  card: 12px
  panel: 12px
  pill: 999px
  full: 999px

spacing:
  px: 1px
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
  card-gap: 12px
  page-padding: 16px
  card-padding: 20px
  compact-card-padding: 16px
  sidebar-padding: 16px

elevation:
  flat: none
  xs: "0 1px 2px rgb(17 24 39 / 0.04)"
  sm: "0 8px 20px rgb(17 24 39 / 0.06)"
  md: "0 16px 40px rgb(17 24 39 / 0.10)"
  focus: "0 0 0 3px rgb(232 27 45 / 0.16)"

layout:
  app-shell:
    backgroundColor: "{semantic_colors.bg-app-frame}"
    maxWidth: 1510px
    sidebarWidth: 272px
    topbarHeight: 76px
    pagePadding: "{spacing.page-padding}"
    gridGap: "{spacing.card-gap}"
  sidebar:
    backgroundColor: "{semantic_colors.bg-sidebar}"
    textColor: "{semantic_colors.text-subtle}"
    activeBackground: "{semantic_colors.bg-surface}"
    activeTextColor: "{semantic_colors.brand-primary}"
    activeShadow: "{elevation.xs}"
  main-grid:
    columns: "minmax(0, 1fr) 286px"
    gap: "{spacing.card-gap}"
  chart-grid:
    columns: "minmax(0, 1fr) 330px"
    gap: "{spacing.card-gap}"
  queue-grid:
    columns: "0.92fr 1.08fr"
    gap: "{spacing.card-gap}"

components:
  sidebar-item:
    height: 44px
    rounded: "{rounded.xl}"
    padding: "0 12px"
    iconSize: 20px
    activeBackgroundColor: "{semantic_colors.bg-surface}"
    activeTextColor: "{semantic_colors.brand-primary}"
  topbar:
    height: "{layout.app-shell.topbarHeight}"
    backgroundColor: "{semantic_colors.bg-surface}"
    borderColor: "{semantic_colors.border-default}"
    padding: "0 24px"
  search-input:
    height: 40px
    rounded: "{rounded.xl}"
    backgroundColor: "#F5F6FA"
    borderColor: "{semantic_colors.border-default}"
    iconColor: "{semantic_colors.text-muted}"
  kpi-card:
    backgroundColor: "{semantic_colors.bg-surface}"
    textColor: "{semantic_colors.text-default}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
    shadow: "{elevation.flat}"
    borderColor: "{semantic_colors.border-default}"
    metricTypography: "{typography.metric-lg}"
  analytics-card:
    backgroundColor: "{semantic_colors.bg-surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
    chartHeight: 300px
  efficiency-donut:
    size: 170px
    innerRadius: 54px
    outerRadius: 78px
    centerMetricTypography: "{typography.metric-lg}"
  route-recommendation-card:
    backgroundColor: "{semantic_colors.bg-surface}"
    nestedSurface: "#F4F6F9"
    rounded: "{rounded.card}"
    metricCells: 3
  operation-table:
    rowHeight: 44px
    headerBackground: "{semantic_colors.bg-subtle}"
    borderColor: "{semantic_colors.border-subtle}"
    riskPillRounded: "{rounded.pill}"
  live-tracking-card:
    mapHeight: 156px
    mapBackground: "#EDF1F5"
    routeLineColor: "#BFDBFE"
    markerTruckColor: "{semantic_colors.bg-surface}"
    markerVesselColor: "{semantic_colors.brand-primary}"
  status-timeline:
    iconContainerSize: 36px
    connectorColor: "{semantic_colors.border-default}"
  maintenance-watch:
    backgroundColor: "{semantic_colors.bg-critical-subtle}"
    borderColor: "{colors.kideco-red-100}"
    progressColor: "{semantic_colors.brand-primary}"

shadcn:
  style: new-york
  iconLibrary: lucide
  cssVariables: true
  sourcePath: src/components/ui
  rule: Use shadcn/ui primitives for behavior and accessibility, then apply Kideco visual tokens for product fit.

domain_components:
  kpi-cards:
    purpose: Surface the most important operational metrics.
    examples:
      - Truck Batch ETA
      - Marine Ready
      - Fuel Saved
      - Maintenance Risk
  route-recommendation:
    purpose: Explain the recommended route and its ETA, fuel, and risk impact.
  fuel-eta-analytics:
    purpose: Compare baseline and optimized fuel or ETA trends.
  fleet-efficiency-donut:
    purpose: Show moving, waiting, and maintenance share.
  live-tracking:
    purpose: Show the Pit-Jetty-Vessel corridor and current operational position.
  status-timeline:
    purpose: Synchronize hauling, jetty loading, vessel readiness, and operation completion.
  maintenance-watch:
    purpose: Show vessel or vehicle health score with sensor reason.
  operation-queue:
    purpose: Table of active units, route, ETA, fuel, and risk.

data_visualization:
  chart_rule: Use red only for critical or brand emphasis, not as default data series.
  primary_series: "{colors.chart-teal}"
  secondary_series: "{colors.chart-blue}"
  waiting_series: "{colors.chart-orange}"
  maintenance_series: "{colors.chart-red}"
  neutral_series: "{colors.chart-slate}"
  gridColor: "{semantic_colors.border-subtle}"
  chartBackground: "{semantic_colors.bg-surface}"

responsive:
  desktop:
    sidebar: visible
    rightRail: visible
    contentDensity: high
  tablet:
    sidebar: collapsible
    rightRail: stacks below main content
  mobile:
    sidebar: hidden behind drawer
    kpiCards: single column
    tables: horizontally scrollable
    touchTargetMin: 40px
---

## Overview

Kideco Logistics Control is a dense operations dashboard for KIC 2026. It is not a marketing site and should not feel like a generic consumer logistics app.

The interface helps operational users scan:

- active hauling units,
- vessel readiness,
- ETA synchronization,
- route recommendation,
- fuel efficiency,
- maintenance risk,
- current operation queue.

The first screen should look closer to an operational dispatch dashboard than a presentation page.

## Colors

### Brand

KIDECO red is the main brand accent. Use it for active navigation, primary actions, route markers, and critical emphasis. Do not flood the dashboard with red.

### Surfaces

Use a light operational shell:

- app frame: pale blue-gray,
- sidebar: soft gray,
- cards: white,
- nested metric surfaces: very light gray.

This keeps the interface close to the second dashboard reference: practical, readable, and dashboard-first.

### Semantic Status

Use color by operational meaning:

- green for safe, ready, efficient,
- blue for active, in-progress, informational,
- amber for monitoring or delay risk,
- red for critical maintenance or high operational impact,
- gray for idle or unavailable state.

## Typography

Use Unica77 LL as the main UI font. It should feel modern and technical without becoming decorative.

Metrics use tabular numbers and heavier weight. Body text stays small and practical. Avoid viewport-scaled typography and avoid negative letter spacing.

If Unica77 medium or bold cuts are not available, browser-synthesized weights are acceptable for prototype, but production should include proper font files.

## Layout

### App Shell

Use the second dashboard reference as the primary layout direction:

- light left sidebar,
- compact topbar,
- KPI cards at top,
- large analytics card in the main column,
- right rail with live tracking and timeline,
- operation table or queue below.

The dashboard should be dense. Default spacing between cards should be 12px, not large marketing-style gaps.

### Sidebar

Sidebar is a primary visual anchor. It should be light, calm, and stable.

Active navigation uses a white pill with KIDECO red text/icon. Inactive items are muted and become darker on hover.

### Right Rail

Right rail is for context:

- live tracking,
- status timeline,
- maintenance watch,
- alerts or quick decision context.

Do not place primary decision tables in the right rail.

## Components

### shadcn/ui

Use shadcn/ui as the component baseline for:

- Button,
- Card,
- Badge,
- Input,
- Select,
- Checkbox,
- Switch,
- Tabs,
- Table,
- Alert,
- Progress,
- Skeleton,
- Tooltip,
- Sheet or Dialog when needed.

shadcn provides behavior and accessibility. Kideco tokens provide product identity.

### KPI Card

KPI cards should show one metric only. Keep them compact and scannable.

Good KPI examples:

- Truck Batch ETA,
- Marine Ready,
- Fuel Saved,
- Maintenance Risk,
- Jetty Queue,
- Waiting Time.

### Route Recommendation

Route recommendation must explain the decision, not just show a route name.

Each route card should include:

- route name,
- ETA,
- fuel estimate,
- risk,
- short reason,
- recommended action.

### Operation Queue

Use table for repeated operational records. Columns should prioritize:

- unit,
- route,
- ETA,
- fuel,
- status,
- risk.

Avoid too many decorative cells. Operators should be able to scan the table quickly.

### Live Tracking

The map preview can be schematic for MVP. It only needs to communicate operational position and route relationship clearly.

For MVP, real maps are optional. A schematic route panel is acceptable if it supports the story.

### Fleet Efficiency Donut

The donut is borrowed from reference #1 because it communicates fleet distribution quickly. Use it for moving, waiting, and maintenance share.

Keep it secondary to the main analytics chart.

## Data Visualization

Charts should support operational decisions. Avoid decorative charts that do not answer a decision question.

Recommended chart uses:

- baseline vs optimized fuel,
- ETA trend,
- waiting time trend,
- maintenance health trend,
- before-after comparison.

Use chart colors consistently. Red means critical or brand emphasis, not default series.

## Content Rules

Use operational language:

- "Hold DT-04 dispatch for 12 minutes"
- "Use TB-01 with Sea Route B"
- "Fuel forecast lower by 9%"
- "TB-02 requires monitoring"

Avoid vague product copy:

- "Powerful insights"
- "Optimize your workflow"
- "Seamless experience"
- "Unlock value"

## Do's and Don'ts

### Do

- Keep card spacing compact.
- Use tables for operational queues.
- Put recommendations near their supporting metrics.
- Show reason and impact for every recommendation.
- Use red with restraint.
- Keep the first screen immediately useful.
- Use icons for navigation and dense controls.
- Keep mobile layouts readable, even if desktop is the priority.

### Don't

- Do not create a landing-page hero.
- Do not turn the dashboard into a generic shipping template.
- Do not make all charts red.
- Do not use oversized cards for small metrics.
- Do not hide decision context behind too many modals.
- Do not use decorative illustration as the main value signal.

## Responsive Behavior

Desktop is the primary demo target. The sidebar and right rail should be visible on desktop.

On tablet, the right rail can stack below the analytics area. On mobile, sidebar should collapse into a drawer and tables should scroll horizontally.

Minimum touch target is 40px. Text inside controls must not overflow.

## Implementation Notes

Current implementation:

- React + Vite,
- Tailwind CSS v4,
- shadcn/ui components in `src/components/ui`,
- domain components in `src/components/domain`,
- static design-system preview in `styleguide.html`,
- static tokens in `styles/tokens.css`,
- static component CSS in `styles/components.css`,
- local icon registry in `build/icons.js`.

Update order:

```text
DESIGN.md -> styles/tokens.css -> styles/components.css -> src/index.css -> src/App.tsx -> styleguide.html
```

## Iteration Guide

Next design iterations should focus on:

- making the main dashboard closer to the operational reference,
- improving route recommendation clarity,
- adding before-after comparison,
- making maintenance risk more explainable,
- defining empty, loading, error, and stale-data states,
- deciding whether the final prototype needs a real map or schematic map.

## Known Gaps

- Target user details are not fully validated with industry users.
- Final product name is not locked.
- Real IoT data availability is not locked.
- Map implementation is still schematic.
- Unica77 medium, bold, and mono cuts may need license review before public use.
