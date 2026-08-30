import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/shared/utils";

export interface SimpleTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  className?: string;
}

export interface SimpleTableProps {
  title?: string;
  description?: string;
  columns: SimpleTableColumn[];
  rows: Record<string, React.ReactNode>[];
  footer?: React.ReactNode;
  action?: React.ReactNode;
}

export function SimpleTable({ title, description, columns, rows, footer, action }: SimpleTableProps) {
  const body = (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "whitespace-nowrap px-5 py-2.5 font-medium",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-5 py-3 align-middle text-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!title) return body;

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      {body}
      {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
    </Card>
  );
}
