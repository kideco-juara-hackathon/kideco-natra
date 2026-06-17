// Command Center event/notification model.
// See components/hauling/command-center/SPEC.md for the full design.

export type CommandEventKind =
  | "truck-ready" // finished unload, idle, needs dispatch
  | "dispatched" // truck sent out
  | "low-fuel" // active truck fuel below threshold
  | "maintenance" // health / vibration alert
  | "pit-low" // a pit's available coal running low
  | "weather"; // BMKG rule trigger

export type CommandEventTone = "info" | "warn" | "danger" | "success";

export type CommandEvent = {
  id: string;
  kind: CommandEventKind;
  truckId?: string;
  title: string;
  detail?: string;
  tone: CommandEventTone;
  actionLabel?: string;
  createdAt: number;
  read: boolean;
  /** Critical events interrupt with a centered modal instead of a toast. */
  critical?: boolean;
};

let eventSeq = 0;

function nextEventId() {
  eventSeq += 1;
  return `EVT-${Date.now().toString(36)}-${eventSeq}`;
}

export function makeEvent(
  input: Omit<CommandEvent, "id" | "createdAt" | "read"> &
    Partial<Pick<CommandEvent, "createdAt" | "read">>,
): CommandEvent {
  return {
    id: nextEventId(),
    createdAt: input.createdAt ?? Date.now(),
    read: input.read ?? false,
    ...input,
  };
}

// Event factories for the common cases the simulation loop fires.

export function truckReadyEvent(truckId: string): CommandEvent {
  return makeEvent({
    kind: "truck-ready",
    truckId,
    title: `${truckId} selesai unload`,
    detail: "Unit kembali ke dispatch — siap diberi rute berikutnya.",
    tone: "success",
    actionLabel: "Dispatch sekarang",
  });
}

export function dispatchedEvent(truckId: string, destinationLabel: string, etaMin: number): CommandEvent {
  return makeEvent({
    kind: "dispatched",
    truckId,
    title: `${truckId} diberangkatkan`,
    detail: `Menuju ${destinationLabel} · ETA ${etaMin} menit.`,
    tone: "info",
  });
}

export function maintenanceEvent(truckId: string, healthScore: number): CommandEvent {
  return makeEvent({
    kind: "maintenance",
    truckId,
    title: `${truckId} perlu inspeksi`,
    detail: `Skor kesehatan ${healthScore} — getaran di atas ambang normal. Unit berisiko gagal di tengah ritase.`,
    tone: "danger",
    actionLabel: "Tinjau unit",
    critical: true,
  });
}

export function lowFuelEvent(truckId: string, fuelPct: number): CommandEvent {
  return makeEvent({
    kind: "low-fuel",
    truckId,
    title: `${truckId} BBM menipis`,
    detail: `Sisa bahan bakar ~${fuelPct}%. Pertimbangkan rute hemat BBM.`,
    tone: "warn",
  });
}

export function pitLowEvent(pitName: string, remainingTon: number): CommandEvent {
  return makeEvent({
    kind: "pit-low",
    title: `${pitName} stok menipis`,
    detail: `Sisa batubara ±${remainingTon} ton. Alihkan unit berikutnya ke pit lain.`,
    tone: "warn",
  });
}

export function toneAccent(tone: CommandEventTone): string {
  switch (tone) {
    case "success":
      return "var(--kideco-red-500)";
    case "danger":
      return "var(--danger-500, #ef4444)";
    case "warn":
      return "#d97706";
    default:
      return "var(--text-subtle, #64748b)";
  }
}
