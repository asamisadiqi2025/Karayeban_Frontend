"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Loader2,
  Package,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import {
  fetchStockStatement,
  type StockStatement,
  type StockStatementItem,
} from "@/services/stock-statement.service";
import { fetchWarehouses, type Warehouse } from "@/services/warehouse.service";
import { extractApiErrorMessage } from "@/services/client";
import { cn } from "@/lib/shared/utils";
import { ToastProvider, useToast } from "@/components/client/toast";

const ALL = "all";
const PAGE_SIZE = 10;

const initialRange = currentJalaliYearRange();

interface Filters {
  warehouseId: string;
  from: string;
  to: string;
}

const initialFilters: Filters = {
  warehouseId: ALL,
  from: initialRange.from,
  to: initialRange.to,
};

/** ردیف‌های جزئیات یک جنس: برچسب فارسی و مسیر مقدار در شیء پاسخ */
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

export default function StockBalancePage() {
  return (
    <ToastProvider>
      <StockBalancePageContent />
    </ToastProvider>
  );
}

function StockBalancePageContent() {
  const toast = useToast();

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [formError, setFormError] = useState<string | null>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);

  const [statement, setStatement] = useState<StockStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWarehouses()
      .then((result) => {
        if (!cancelled) setWarehouses(result);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(extractApiErrorMessage(err, "خطا در دریافت لیست گدام‌ها"));
        }
      })
      .finally(() => {
        if (!cancelled) setWarehousesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  /** دریافت صورت موجودی اجناس گدام انتخاب‌شده در بازه فیلترها */
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStockStatement({
        warehouseId: filters.warehouseId,
        from: filters.from,
        to: filters.to,
      });
      setStatement(result);
    } catch (err) {
      setStatement(null);
      setError(extractApiErrorMessage(err, "خطا در دریافت صورت موجودی"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (filters.warehouseId === ALL) {
      setFormError("یک گدام را انتخاب کنید");
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

    setSearch("");
    setPage(1);
    setSelectedItemId(null);
    await load();
  }

  function handleReset() {
    setFilters(initialFilters);
    setStatement(null);
    setError(null);
    setFormError(null);
    setSearch("");
    setPage(1);
    setSelectedItemId(null);
  }

  const items = useMemo(() => statement?.items ?? [], [statement]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.itemName.toLowerCase().includes(q));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

  const selectedItem = useMemo(
    () => items.find((item) => item.itemId === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const reportFrom = statement?.from || filters.from;
  const reportTo = statement?.to || filters.to;
  const reportWarehouse = statement?.warehouseName || "";

  return (
    <div>
      <PageHeader
        title="موجودی انبار"
        description="صورت موجودی اجناس یک گدام در بازه تاریخی دلخواه"
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
              <Label>گدام</Label>
              <Select
                value={filters.warehouseId}
                onValueChange={(v) => setFilters((f) => ({ ...f, warehouseId: v ?? ALL }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب گدام">
                    {(value) => warehouses.find((w) => w.id === value)?.name ?? "انتخاب گدام"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {warehousesLoading ? (
                    <SelectItem value="__loading__" disabled>
                      در حال بارگذاری...
                    </SelectItem>
                  ) : warehouses.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      گدامی ثبت نشده است
                    </SelectItem>
                  ) : (
                    warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
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
            <Button variant="outline" size="sm" onClick={() => void load()}>
              تلاش مجدد
            </Button>
          </div>
        </Card>
      ) : statement ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {reportWarehouse || "—"}
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                ({filteredItems.length.toLocaleString("fa-AF")} جنس)
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              بازه گزارش: {isoToDisplayLong(reportFrom)} تا {isoToDisplayLong(reportTo)}
            </p>
          </div>

          <Card className="p-0">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-foreground">اجناس</h2>

              <div className="relative w-full sm:w-64">
                <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="جستجوی جنس..."
                  className="pr-8"
                  aria-label="جستجوی جنس"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">جنس</TableHead>
                  <TableHead className="text-right">واحد</TableHead>
                  <TableHead className="text-right">اولیه</TableHead>
                  <TableHead className="text-right">خرید</TableHead>
                  <TableHead className="text-right">فروش</TableHead>
                  <TableHead className="text-right">مصرف</TableHead>
                  <TableHead className="text-right">اصلاح</TableHead>
                  <TableHead className="text-right">انتقال ورودی</TableHead>
                  <TableHead className="text-right">انتقال خروجی</TableHead>
                  <TableHead className="text-right">نهایی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      داده‌ای یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((item) => {
                    const active = item.itemId === selectedItemId;
                    return (
                      <tr
                        key={item.itemId}
                        onClick={() => setSelectedItemId(active ? null : item.itemId)}
                        className={cn(
                          "cursor-pointer border-b transition-colors hover:bg-muted/50",
                          active && "bg-secondary",
                        )}
                      >
                        <td className="p-2 align-middle text-right">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground">{item.itemName}</span>
                          </div>
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground">
                          {item.unit?.name ?? "—"}
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground" dir="ltr">
                          {formatNumber(item.openingBalance)}
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground" dir="ltr">
                          {formatNumber(item.purchased.quantity)}
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground" dir="ltr">
                          {formatNumber(item.sold.quantity)}
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground" dir="ltr">
                          {formatNumber(item.consumed.quantity)}
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground" dir="ltr">
                          {formatNumber(item.adjusted.quantity)}
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground" dir="ltr">
                          {formatNumber(item.transferredIn.quantity)}
                        </td>
                        <td className="p-2 align-middle text-right text-muted-foreground" dir="ltr">
                          {formatNumber(item.transferredOut.quantity)}
                        </td>
                        <td className="p-2 align-middle text-right font-medium text-foreground" dir="ltr">
                          {formatNumber(item.closingBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {filteredItems.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  نشان دادن{" "}
                  <span className="font-medium text-foreground">
                    {startIndex + 1}
                    {"–"}
                    {Math.min(startIndex + PAGE_SIZE, filteredItems.length)}
                  </span>{" "}
                  از{" "}
                  <span className="font-medium text-foreground">
                    {filteredItems.length.toLocaleString("fa-AF")}
                  </span>{" "}
                  مورد — صفحه {currentPage.toLocaleString("fa-AF")} از{" "}
                  {totalPages.toLocaleString("fa-AF")}
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage(1)}
                    aria-label="صفحه اول"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="صفحه قبل"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>

                  <span className="mx-1 min-w-[60px] text-center text-xs font-medium text-foreground">
                    {currentPage.toLocaleString("fa-AF")} / {totalPages.toLocaleString("fa-AF")}
                  </span>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="صفحه بعد"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(totalPages)}
                    aria-label="صفحه آخر"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* جزئیات جنس انتخاب‌شده */}
          {selectedItem && (
            <Card className="mt-6 p-0">
              <div className="border-b p-4">
                <h2 className="text-sm font-semibold text-foreground">
                  جزئیات {selectedItem.itemName}
                  <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                    {selectedItem.unit?.name ?? "—"} ({selectedItem.unit?.symbol ?? "—"})
                  </span>
                </h2>
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
                    const value = row.read(selectedItem);
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
                      {formatNumber(selectedItem.sold.costOfGoodsSold)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          )}
        </>
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
