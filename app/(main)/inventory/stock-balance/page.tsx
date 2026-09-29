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
  Wallet,
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

import { fetchInventoryItems, type InventoryItem } from "@/services/inventory-item.service";
import {
  fetchStockStatement,
  type StockStatement,
  type StockStatementItem,
} from "@/services/stock-statement.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const ALL = "all";
const PAGE_SIZE = 10;

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

/** ستون‌های صورت موجودی: برچسب فارسی و کلید خواندن مقدار از پاسخ API */
const statementRows: { key: keyof StockStatementItem; label: string }[] = [
  { key: "openingBalance", label: "موجودی اولیه" },
  { key: "purchased", label: "خریداری شده" },
  { key: "sold", label: "فروش رفته" },
  { key: "consumed", label: "مصرف شده" },
  { key: "adjusted", label: "اصلاح شده" },
  { key: "transferredIn", label: "انتقال ورودی" },
  { key: "transferredOut", label: "انتقال خروجی" },
  { key: "closingBalance", label: "موجودی نهایی" },
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

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [statement, setStatement] = useState<StockStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  /** دریافت صورت موجودی جنس انتخاب‌شده در بازه فیلترها */
  async function load() {
    setStatementLoading(true);
    setStatementError(null);
    try {
      const result = await fetchStockStatement({
        itemId: filters.itemId,
        from: filters.from,
        to: filters.to,
      });
      setStatement(result);
    } catch (err) {
      setStatement(null);
      setStatementError(extractApiErrorMessage(err, "خطا در دریافت صورت موجودی"));
    } finally {
      setStatementLoading(false);
    }
  }

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

    await load();
  }

  function handleReset() {
    setFilters(initialFilters);
    setStatement(null);
    setStatementError(null);
    setFormError(null);
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

  const detail = statement?.item ?? null;

  return (
    <div>
      <PageHeader
        title="موجودی انبار"
        description="صورت موجودی یک جنس در بازه تاریخی دلخواه"
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
            <Button type="submit" disabled={statementLoading}>
              {statementLoading && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {statementLoading ? "در حال دریافت..." : "نمایش صورت موجودی"}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              حذف فیلترها
            </Button>
          </div>
        </form>
      </Card>

      {/* -------------------- Result -------------------- */}
      {statementLoading ? (
        <Card className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">در حال بارگذاری...</span>
          </div>
        </Card>
      ) : statementError ? (
        <Card className="mb-6 flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-destructive">{statementError}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              تلاش مجدد
            </Button>
          </div>
        </Card>
      ) : detail ? (
        <Card className="p-0">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold text-foreground">
              {detail.itemName}
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                {detail.unit?.name ?? "—"} ({detail.unit?.symbol ?? "—"})
              </span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              بازه گزارش: {isoToDisplayLong(statement?.from ?? filters.from)} تا{" "}
              {isoToDisplayLong(statement?.to ?? filters.to)}
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
              {statementRows.map((row) => {
                const cell = detail[row.key] as unknown as Record<string, string>;
                const isBalance = row.key === "openingBalance" || row.key === "closingBalance";
                const value = isBalance ? { quantity: String(cell), amount: "" } : cell;

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

      {/* -------------------- All items -------------------- */}
      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            همه اجناس
            <span className="mr-1.5 text-xs font-normal text-muted-foreground">
              ({filteredItems.length.toLocaleString("fa-AF")} مورد)
            </span>
          </h2>

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
              <TableHead className="text-right">دسته بندی</TableHead>
              <TableHead className="text-right">گدام</TableHead>
              <TableHead className="text-right">مقدار فعلی</TableHead>
              <TableHead className="text-right">قیمت متوسط</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  داده‌ای یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.unit || "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.warehouse?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground" dir="ltr">
                    {formatNumber(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground" dir="ltr">
                    {item.currency?.code ? (
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        {formatNumber(item.averageCost)}
                      </span>
                    ) : (
                      formatNumber(item.averageCost)
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!itemsLoading && filteredItems.length > 0 && (
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
