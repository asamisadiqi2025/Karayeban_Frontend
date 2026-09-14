"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, Loader2, ShoppingCart, RotateCcw, Truck, Wrench } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchInventoryItems,
  type InventoryItem,
  type InventoryTransaction,
} from "@/services/inventory-item.service";
import { extractApiErrorMessage } from "@/services/client";

interface EnrichedTransaction extends InventoryTransaction {
  itemName: string;
  unit: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof ShoppingCart }> = {
  PURCHASE: { label: "خرید", color: "#16a34a", bg: "#ecfdf5", icon: ShoppingCart },
  SALE: { label: "فروش", color: "#3b82f6", bg: "#eff6ff", icon: Truck },
  ADJUSTMENT: { label: "تنظیم", color: "#f59e0b", bg: "#fff7ed", icon: Wrench },
  RETURN: { label: "برگشت", color: "#a855f7", bg: "#faf5ff", icon: RotateCcw },
  TRANSFER: { label: "انتقال", color: "#6366f1", bg: "#eef2ff", icon: ArrowUpDown },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { label: type, color: "#6b7280", bg: "#f9fafb", icon: ArrowUpDown };
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInventoryItems()
      .then((items) => {
        if (cancelled) return;
        const allTx: EnrichedTransaction[] = [];
        items.forEach((item) => {
          (item.transactions ?? []).forEach((tx) => {
            allTx.push({ ...tx, itemName: item.name, unit: item.unit });
          });
        });
        allTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(allTx.slice(0, 8));
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiErrorMessage(err, "خطا"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">تراکنش‌های اخیر گدام</CardTitle>
          <p className="text-sm text-muted-foreground">آخرین جابجایی‌های موجودی</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50">
          <ArrowUpDown className="h-4 w-4 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">تراکنشی ثبت نشده</p>
        ) : (
          <ul className="space-y-3">
            {transactions.map((tx) => {
              const cfg = getTypeConfig(tx.type);
              const Icon = cfg.icon;
              return (
                <li key={tx.id} className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{tx.itemName}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <span dir="ltr">{Number(tx.quantity).toLocaleString("fa-AF")} {tx.unit}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span dir="ltr">{Number(tx.totalAmount).toLocaleString("fa-AF")}</span>
                      {tx.notes && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="truncate">{tx.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
