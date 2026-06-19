import Image from "next/image";

/**
 * Full-screen branded boot/loading state.
 *
 * Used as the Suspense fallback while the workspace mounts and the first
 * operation-state fetch resolves. Reads design tokens so it adapts to
 * light/dark automatically, and leans on the KIDECO red accent so a slow
 * backend/prod config still reads as "starting up" rather than "broken".
 */
export function BrandedLoader({
  message = "Menghubungkan ke command center",
  submessage = "Menyiapkan data operasional KIDECO…",
}: {
  message?: string;
  submessage?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-app-frame)] animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo with a soft brand glow */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 animate-pulse rounded-full bg-[var(--kideco-red-500)]/20 blur-2xl"
          />
          <Image
            alt="NATRA"
            src="/natralogo.png"
            width={200}
            height={56}
            priority
            className="h-auto w-[180px]"
          />
        </div>

        {/* Refined brand ring spinner */}
        <div className="relative size-9" role="status" aria-label="Memuat">
          <div className="absolute inset-0 rounded-full border-[3px] border-[var(--border-default)]" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[var(--kideco-red-500)]"
            style={{ animationDuration: "0.8s" }}
          />
        </div>

        {/* Message hierarchy */}
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-[var(--text-default)]">{message}</p>
          <p className="text-xs text-[var(--text-muted)]">{submessage}</p>
        </div>
      </div>
    </div>
  );
}
