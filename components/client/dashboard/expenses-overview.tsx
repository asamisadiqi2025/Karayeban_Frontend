"use client";

import { useEffect, useState } from "react";
import { Receipt, Loader2, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchExpenses, type Expense } from "@/services/expense.service";
import { fetchExpenseCategories, type ExpenseCategory } from "@/services/expense-category.service";
import { extractApiErrorMessage } from "@/services/client";

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#e11d48", "#a855f7", "#6366f1", "#06b6d4", "#84cc16"];

export function ExpensesOverview() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchExpenses(), fetchExpenseCategories()])
      .then(([expResult, catResult]) => {
        if (cancelled) return;
        if (expResult.status === "fulfilled") setExpenses(expResult.value);
        else setError(extractApiErrorMessage(expResult.reason, "خطا"));
        if (catResult.status === "fulfilled") setCategories(catResult.value);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const byCategory = new Map<string, number>();
  expenses.forEach((e) => {
    const name = categoryMap.get(e.categoryId) ?? "سایر";
    byCategory.set(name, (byCategory.get(name) ?? 0) + e.amount);
  });

  const chartData = Array.from(byCategory.entries())
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">خلاصه مصارف</CardTitle>
          <p className="text-sm text-muted-foreground">مصارف بر حسب دسته‌بندی</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <Receipt className="h-4 w-4 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{error}</p>
        ) : expenses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">مصرفی ثبت نشده</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <span className="text-2xl font-bold text-foreground">
                {totalExpenses.toLocaleString("fa-AF")}
              </span>
              <span className="text-xs text-muted-foreground">مجموع مصارف</span>
            </div>

            {chartData.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="relative h-[120px] w-[120px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={34}
                        outerRadius={54}
                        paddingAngle={3}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {chartData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {chartData.slice(0, 5).map((d) => (
                    <li key={d.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 truncate text-muted-foreground">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="shrink-0 font-medium text-foreground" dir="ltr">
                        {d.value.toLocaleString("fa-AF")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recentExpenses.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground">آخرین مصارف</p>
                {recentExpenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryMap.get(e.categoryId) ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-foreground" dir="ltr">
                      {e.amount.toLocaleString("fa-AF")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
