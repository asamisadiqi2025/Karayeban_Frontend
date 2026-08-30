import { cn } from "@/lib/shared/utils";

const styles: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  done: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  won: "bg-emerald-50 text-emerald-700",
  active: "bg-emerald-50 text-emerald-700",
  "on track": "bg-emerald-50 text-emerald-700",
  low: "bg-emerald-50 text-emerald-700",

  processing: "bg-blue-50 text-blue-700",
  interviewing: "bg-blue-50 text-blue-700",
  due: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",

  pending: "bg-amber-50 text-amber-700",
  sourcing: "bg-amber-50 text-amber-700",
  "at risk": "bg-amber-50 text-amber-700",
  offer: "bg-violet-50 text-violet-700",

  cancelled: "bg-rose-50 text-rose-700",
  overdue: "bg-rose-50 text-rose-700",
  late: "bg-rose-50 text-rose-700",
  lost: "bg-rose-50 text-rose-700",
  high: "bg-rose-50 text-rose-700",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        styles[key] ?? "bg-secondary text-secondary-foreground"
      )}
    >
      {status}
    </span>
  );
}
