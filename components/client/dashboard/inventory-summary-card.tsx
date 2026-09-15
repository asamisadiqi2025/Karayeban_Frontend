"use client";

import { useEffect, useState } from "react";
import { Warehouse, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchInventorySummary,
  type InventorySummary,
  type InventorySummaryWarehouseCurrency,
} from "@/services/inventory-item.service";
import { extractApiErrorMessage } from "@/services/client";

export function InventorySummaryCard() {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInventorySummary()
      .then((result) => {
        if (!cancelled) setSummary(result);
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
          <CardTitle className="text-base font-semibold text-foreground">خلاصه گدام</CardTitle>
          <p className="text-sm text-muted-foreground">ارزش موجودی انبار</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <Warehouse className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{error}</p>
        ) : !summary || summary.byWarehouseAndCurrency.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {summary.totalItems.toLocaleString("fa-AF")}
              </span>
              <span className="text-xs text-muted-foreground">مورد کل</span>
            </div>
            <div className="space-y-2">
              {summary.byWarehouseAndCurrency.map((item, i) => (
                <WarehouseRow key={`${item.warehouseId}-${item.currencyId}-${i}`} item={item} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WarehouseRow({ item }: { item: InventorySummaryWarehouseCurrency }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {item.currencyName} ({item.currencyCode})
        </p>
        <p className="text-xs text-muted-foreground">
          {item.itemCount.toLocaleString("fa-AF")} جنس
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-foreground" dir="ltr">
        {Number(item.totalValue).toLocaleString("fa-AF")}
      </span>
    </div>
  );
}
