"use client";

import { useEffect, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import { Filter, Loader2, Package } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import afghanLocale from "@/lib/date-picker/afghan-locale";
import {
  currentJalaliYearRange,
  isoToDisplayLong,
  isoToPersianDate,
  persianDateToIso,
} from "@/lib/date-picker";

import { fetchInventoryItems, type InventoryItem } from "@/services/inventory-item.service";
import {
  fetchItemStockStatement,
  type StockStatementItem,
} from "@/services/stock-statement.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const ALL = "all";

const initialRange = currentJalaliYearRange();

interface Filters {
  itemId: string;
  from: string;
  to: string;
}

const initialFilters: Filters = {
  itemId: ALL,
  from: initialRange.from,
  to: initialRange.to,
};

/** ردیف‌های جزئیات یک جنس: برچسب فارسی و خواندن مقدار از پاسخ API */
const detailRows: {
  key: string;
  label: string;
  read: (item: StockStatementItem) => { quantity: string; amount: string };
}[] = [
  { key: "opening", label: "موجودی اولیه", read: (i) => ({ quantity: i.openingBalance, amount: "" }) },
  { key: "purchased", label: "خریداری شده", read: (i) => i.purchased },
  { key: "sold", label: "فروش رفته", read: (i) => i.sold },
  { key: "consumed", label: "مصرف شده", read: (i) => i.consumed },
  { key: "adjusted", label: "اصلاح شده", read: (i) => i.adjusted },
  { key: "transferredIn", label: "انتقال ورودی", read: (i) => i.transferredIn },
  { key: "transferredOut", label: "انتقال خروجی", read: (i) => i.transferredOut },
  { key: "closing", label: "موجودی نهایی", read: (i) => ({ quantity: i.closingBalance, amount: "" }) },
];

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value: string): string {
  return toNumber(value).toLocaleString("fa-AF", { maximumFractionDigits: 4 });
}

export default function StockBalanceItemPage() {
  return (
    <ToastProvider>
      <StockBalanceItemPageContent />
    </ToastProvider>
  );
}

function StockBalanceItemPageContent() {
  const toast = useToast();

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [formError, setFormError] = useState<string | null>(null);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [detail, setDetail] = useState<StockStatementItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInventoryItems()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(extractApiErrorMessage(err, "خطا در دریافت لیست اجناس"));
        }
      })
      .finally(() => {
        if (!cancelled) setItemsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (filters.itemId === ALL) {
      setFormError("یک جنس را انتخاب کنید");
      return;
    }
    if (filters.from.trim() === "" || filters.to.trim() === "") {
      setFormError("بازه تاریخ را کامل کنید");
      return;
    }
    if (filters.from > filters.to) {
      setFormError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchItemStockStatement({
        itemId: filters.itemId,
        from: filters.from,
        to: filters.to,
      });
      setDetail(result);
    } catch (err) {
      setDetail(null);
      setError(extractApiErrorMessage(err, "خطا در دریافت صورت موجودی"));
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFilters(initialFilters);
    setDetail(null);
    setError(null);
    setFormError(null);
  }

  return (
    <div>
      <PageHeader
        title="صورت موجودی جنس"
        description="گردش و موجودی یک جنس مشخص در بازه تاریخی دلخواه"
      />

      {/* -------------------- Filters -------------------- */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">فیلترها</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>جنس</Label>
              <Select
                value={filters.itemId}
                onValueChange={(v) => setFilters((f) => ({ ...f, itemId: v ?? ALL }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب جنس">
                    {(value) => items.find((i) => i.id === value)?.name ?? "انتخاب جنس"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {itemsLoading ? (
                    <SelectItem value="__loading__" disabled>
                      در حال بارگذاری...
                    </SelectItem>
                  ) : items.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      جنسی ثبت نشده است
                    </SelectItem>
                  ) : (
                    items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="relative z-50 min-w-0 space-y-1.5">
              <Label>از تاریخ</Label>
              <DatePicker
                calendar={persian}
                locale={afghanLocale}
                calendarPosition="bottom-right"
                containerClassName="w-full"
                placeholder="انتخاب تاریخ شروع"
                value={isoToPersianDate(filters.from)}
                onChange={(date) => {
                  if (!date?.isValid) return;
                  setFilters((f) => ({ ...f, from: persianDateToIso(date) }));
                }}
              />
            </div>

            <div className="relative z-50 min-w-0 space-y-1.5">
              <Label>تا تاریخ</Label>
              <DatePicker
                calendar={persian}
                locale={afghanLocale}
                calendarPosition="bottom-right"
                containerClassName="w-full"
                placeholder="انتخاب تاریخ پایان"
                value={isoToPersianDate(filters.to)}
                onChange={(date) => {
                  if (!date?.isValid) return;
                  setFilters((f) => ({ ...f, to: persianDateToIso(date) }));
                }}
              />
            </div>
          </div>

          {formError && (
            <p className="mt-4 whitespace-pre-line text-sm text-destructive">{formError}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {loading ? "در حال دریافت..." : "نمایش صورت موجودی"}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              حذف فیلترها
            </Button>
          </div>
        </form>
      </Card>

      {/* -------------------- Result -------------------- */}
      {loading ? (
        <Card className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">در حال بارگذاری...</span>
          </div>
        </Card>
      ) : error ? (
        <Card className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </Card>
      ) : detail ? (
        <Card className="p-0">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                {detail.itemName}
              </span>
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                {detail.unit?.name ?? "—"} ({detail.unit?.symbol ?? "—"})
              </span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              بازه گزارش: {isoToDisplayLong(filters.from)} تا {isoToDisplayLong(filters.to)}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">شرح</TableHead>
                <TableHead className="text-right">مقدار</TableHead>
                <TableHead className="text-right">مبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailRows.map((row) => {
                const value = row.read(detail);
                return (
                  <TableRow key={row.key}>
                    <TableCell className="text-right font-medium text-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell className="text-right" dir="ltr">
                      {formatNumber(value.quantity)}
                    </TableCell>
                    <TableCell className="text-right" dir="ltr">
                      {value.amount ? formatNumber(value.amount) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className="text-right font-medium text-foreground">
                  بهای تمام شده فروش
                </TableCell>
                <TableCell className="text-right" dir="ltr">
                  —
                </TableCell>
                <TableCell className="text-right" dir="ltr">
                  {formatNumber(detail.sold.costOfGoodsSold)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      ) : null}

      <style jsx global>{`
        .rmdp-input {
          width: 100%;
          height: 32px;
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          background: transparent;
          padding: 0 12px;
          font-size: 14px;
        }
        .rmdp-input:focus {
          outline: none;
          border-color: hsl(var(--ring));
        }
      `}</style>
    </div>
  );
}
