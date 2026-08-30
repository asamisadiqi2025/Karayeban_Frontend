import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface GoalItem {
  label: string;
  current: number;
  target: number;
  format?: (v: number) => string;
}

export function GoalProgress({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: GoalItem[];
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-3">
        {items.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const fmt = goal.format ?? ((v: number) => v.toLocaleString());

          return (
            <div key={goal.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{goal.label}</span>
                <span className="text-muted-foreground">
                  {fmt(goal.current)} <span className="text-muted-foreground/60">/ {fmt(goal.target)}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
