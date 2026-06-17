import { Badge } from "@/components/ui/badge";

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="grid min-h-[520px] place-items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
      <div className="max-w-md">
        <Badge variant="outline">Iterasi berikutnya</Badge>
        <h2 className="mt-4 text-heading-lg">{title}</h2>
        <p className="mt-3 text-body-sm text-[var(--text-subtle)]">
          Screen ini sengaja belum diimplementasikan. Iterasi saat ini hanya mengunci flow Rencana
          Rute dan Hauling Overview.
        </p>
      </div>
    </div>
  );
}
