"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, Warehouse } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  fetchInventorySummary,
  type InventorySummary,
} from "@/services/inventory-item.service";
import { fetchWarehouses, type Warehouse as WarehouseType } from "@/services/warehouse.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider } from "@/components/client/toast";

export default function InventorySummaryPage() {
  return (
    <ToastProvider>
      <InventorySummaryPageContent />
    </ToastProvider>
  );
}

function InventorySummaryPageContent() {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchInventorySummary(),
      fetchWarehouses(),
    ]).then(([summaryResult, whResult]) => {
      if (cancelled) return;
      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        setError(extractApiErrorMessage(summaryResult.reason, "خطا در دریافت خلاصه اجناس"));
      }
      if (whResult.status === "fulfilled") setWarehouses(whResult.value);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const warehouseMap = new Map<string, string>();
  warehouses.forEach((w) => warehouseMap.set(w.id, w.name));

  return (
    <div>
      <PageHeader
        title="خلاصه اجناس"
        description="مشاهده خلاصه اجناس بر اساس گدام و واحد پولی"
      />

      {loading ? (
        <Card className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">در حال بارگذاری...</span>
          </div>
        </Card>
      ) : error ? (
        <Card className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              تلاش مجدد
            </Button>
          </div>
        </Card>
      ) : summary ? (
        <div className="space-y-6">
          {/* Total Items Card */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[13.5px] font-medium text-muted-foreground">مجموع اجناس</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {summary.totalItems.toLocaleString("fa-AF")}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[13.5px] font-medium text-muted-foreground">تعداد گدام‌ها</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Warehouse className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {new Set(summary.byWarehouseAndCurrency.map((r) => r.warehouseId)).size.toLocaleString("fa-AF")}
              </p>
            </Card>
          </div>

          {/* Breakdown Table */}
          <Card className="p-0">
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold text-foreground">
                جزئیات بر اساس گدام و واحد پولی
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({summary.byWarehouseAndCurrency.length.toLocaleString("fa-AF")} مورد)
                </span>
              </h2>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">گدام</TableHead>
                  <TableHead className="text-right">واحد پولی</TableHead>
                  <TableHead className="text-right">تعداد اجناس</TableHead>
                  <TableHead className="text-right">مجموع ارزش</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.byWarehouseAndCurrency.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      داده‌ای یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.byWarehouseAndCurrency.map((row, idx) => (
                    <TableRow key={`${row.warehouseId}-${row.currencyId}-${idx}`}>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">
                            {warehouseMap.get(row.warehouseId) ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.currencyName} ({row.currencyCode})
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.itemCount.toLocaleString("fa-AF")}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {Number(row.totalValue).toLocaleString("fa-AF")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
