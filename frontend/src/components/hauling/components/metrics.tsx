import type { ReactNode } from "react";

export function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3">
      <div className="flex items-center justify-between text-[var(--text-muted)]">
        <span className="text-caption">{label}</span>
        <span className="[&>svg]:size-4">{icon}</span>
      </div>
      <p className="mt-2 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-2">
      <p className="text-caption text-[var(--text-muted)]">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
      <p className="text-caption text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

