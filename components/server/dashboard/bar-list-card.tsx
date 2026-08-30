import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/shared/utils";

export interface BarListItem {
  label: string;
  value: number;
  display: string;
  color?: string;
}

export function BarListCard({
  title,
  description,
  items,
  max = 100,
}: {
  title: string;
  description: string;
  items: BarListItem[];
  max?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-3">
        {items.map((it) => {
          const pct = Math.min(100, Math.round((it.value / max) * 100));
          const over = it.value > max;
          return (
            <div key={it.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{it.label}</span>
                <span className={cn("text-muted-foreground", over && "font-medium text-rose-600")}>
                  {it.display}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full", over ? "bg-rose-500" : "bg-primary")}
                  style={{ width: `${pct}%`, backgroundColor: it.color }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
