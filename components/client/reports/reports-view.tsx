"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Coins,
  Filter,
  Loader2,
  Percent,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
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
  currentJalaliMonthRange,
  currentJalaliYearRange,
  isoToDisplay,
  isoToDisplayLong,
  isoToPersianDate,
  persianDateToIso,
  previousJalaliMonthRange,
  previousJalaliYearRange,
  todayIso,
} from "@/lib/date-picker";

import {
  fetchDebtAging,
  fetchElectricityCollectionPerformance,
  fetchEquitySummary,
  fetchExpensesBreakdown,
  fetchFinancialBalances,
  fetchFinancialSummary,
  fetchInventoryMovementSummary,
  fetchOccupancySummary,
  fetchRentCollectionPerformance,
  MOVEMENT_TYPES,
  type AccountBalance,
  type AgingBucketKey,
  type ChargeStatus,
  type CollectionCurrency,
  type CollectionPerformanceReport,
  type CurrencyFlow,
  type CurrencyFlowReport,
  type DebtAgingReport,
  type EquitySummaryReport,
  type ExpenseBreakdownNode,
  type ExpensesBreakdownReport,
  type FinancialBalancesReport,
  type MovementSummaryReport,
  type MovementType,
  type OccupancySummaryReport,
  type ShareholderEquityRow,
  type ShopOccupancyStatus,
} from "@/services/financial-report.service";
import { fetchShops, type Shop } from "@/services/shop.service";
import { fetchWarehouses, type Warehouse } from "@/services/warehouse.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

/* ------------------------------------------------------------------ */
/* Filter configuration                                                 */
/* ------------------------------------------------------------------ */

type RangePreset = "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";

interface Filters {
  from: string;
  to: string;
  asOfDate: string;
  currencyId: string;
  shopId: string;
  warehouseId: string;
}

const ALL = "all";

const presets: { value: RangePreset; label: string }[] = [
  { value: "thisMonth", label: "ماه جاری" },
  { value: "lastMonth", label: "ماه گذشته" },
  { value: "thisYear", label: "سال جاری" },
  { value: "lastYear", label: "سال گذشته" },
  { value: "custom", label: "دلخواه" },
];

function presetRange(preset: RangePreset): { from: string; to: string } | null {
  switch (preset) {
    case "thisMonth":
      return currentJalaliMonthRange();
    case "lastMonth":
      return previousJalaliMonthRange();
    case "thisYear":
      return currentJalaliYearRange();
    case "lastYear":
      return previousJalaliYearRange();
    default:
      return null;
  }
}

const initialRange = currentJalaliYearRange();

const initialFilters: Filters = {
  from: initialRange.from,
  to: initialRange.to,
  asOfDate: todayIso(),
  currencyId: ALL,
  shopId: ALL,
  warehouseId: ALL,
};

/* ------------------------------------------------------------------ */
/* Display helpers                                                      */
/* ------------------------------------------------------------------ */

const fa = "fa-AF";

function money(value: number): string {
  return value.toLocaleString(fa);
}

function percent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toLocaleString(fa, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}٪`;
}

const chargeStatusLabels: Record<ChargeStatus, string> = {
  PENDING: "در انتظار",
  PARTIAL: "پرداخت جزئی",
  PAID: "پرداخت شده",
  OVERDUE: "سررسید گذشته",
};

const chargeStatusVariant: Record<ChargeStatus, "default" | "secondary" | "outline" | "success" | "danger"> = {
  PENDING: "secondary",
  PARTIAL: "outline",
  PAID: "success",
  OVERDUE: "danger",
};

const chargeStatusOrder: ChargeStatus[] = ["PENDING", "PARTIAL", "PAID", "OVERDUE"];

const occupancyLabels: Record<ShopOccupancyStatus, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  empty: "خالی",
  pending: "در انتظار",
  rented: "استیجاری",
};

const occupancyOrder: ShopOccupancyStatus[] = [
  "rented",
  "empty",
  "pending",
  "active",
  "inactive",
];

const agingLabels: Record<AgingBucketKey, string> = {
  current: "جاری",
  d1_30: "۱ تا ۳۰ روز",
  d31_60: "۳۱ تا ۶۰ روز",
  d61_90: "۶۱ تا ۹۰ روز",
  d90_plus: "بیش از ۹۰ روز",
};

const agingOrder: AgingBucketKey[] = ["current", "d1_30", "d31_60", "d61_90", "d90_plus"];

/* ------------------------------------------------------------------ */
/* Report registry                                                      */
/* ------------------------------------------------------------------ */

export type ReportKey =
  | "financials"
  | "balances"
  | "expenses"
  | "rent"
  | "electricity"
  | "occupancy"
  | "debtAging"
  | "equity"
  | "inventoryMovement";

interface ReportMeta {
  title: string;
  description: string;
  /** Report is scoped by the from/to range. */
  needsRange?: boolean;
  /** Report is a point-in-time snapshot taken at asOfDate. */
  needsAsOf?: boolean;
  /** Report can be narrowed to a single shop. */
  needsShop?: boolean;
  /** Report can be narrowed to a single warehouse. */
  needsWarehouse?: boolean;
  /** Report is broken down by currency. */
  needsCurrency?: boolean;
}

export const REPORT_META: Record<ReportKey, ReportMeta> = {
  financials: {
    title: "خلاصه مالی",
    description: "ورودی، خروجی و خالص جریان مالی به تفکیک واحد پولی",
    needsRange: true,
    needsCurrency: true,
  },
  balances: {
    title: "موجودی حساب‌ها",
    description: "موجودی حساب‌های نقدی و بانکی تا تاریخ مشخص",
    needsAsOf: true,
    needsCurrency: true,
  },
  expenses: {
    title: "تفکیک مصارف",
    description: "مصارف ثبت‌شده به تفکیک واحد پولی",
    needsRange: true,
    needsCurrency: true,
  },
  rent: {
    title: "عملکرد وصول اجاره",
    description: "مبلغ صورت‌حساب، وصول و مانده معوق اجاره",
    needsRange: true,
    needsShop: true,
    needsCurrency: true,
  },
  electricity: {
    title: "عملکرد وصول برق",
    description: "مبلغ صورت‌حساب، وصول و مانده معوق برق",
    needsRange: true,
    needsShop: true,
    needsCurrency: true,
  },
  occupancy: {
    title: "اشغال دکان‌ها",
    description: "وضعیت اشغال و آزاد بودن دکان‌ها",
  },
  debtAging: {
    title: "اقساط بدهی",
    description: "مانده بدهی مستأجرین بر اساس سن بدهی",
    needsCurrency: true,
  },
  equity: {
    title: "خلاصه سهام",
    description: "سهم، برداشت و مانده هر سهامدار",
  },
  inventoryMovement: {
    title: "گردش گدام",
    description: "خرید، فروش، مصرف، تعدیل و انتقال اجناس به تفکیک نوع حرکت",
    needsRange: true,
    needsWarehouse: true,
    needsCurrency: true,
  },
};

const errorLabels: Record<ReportKey, string> = {
  financials: "خطا در دریافت خلاصه مالی",
  balances: "خطا در دریافت موجودی حساب‌ها",
  expenses: "خطا در دریافت تفکیک مصارف",
  rent: "خطا در دریافت عملکرد وصول اجاره",
  electricity: "خطا در دریافت عملکرد وصول برق",
  occupancy: "خطا در دریافت خلاصه اشغال",
  debtAging: "خطا در دریافت اقساط بدهی",
  equity: "خطا در دریافت خلاصه سهام",
  inventoryMovement: "خطا در دریافت خلاصه گردش گدام",
};

/* ------------------------------------------------------------------ */
/* Page shell                                                           */
/* ------------------------------------------------------------------ */

export default function ReportsView({ report }: { report: ReportKey }) {
  return (
    <ToastProvider>
      <ReportsContent report={report} />
    </ToastProvider>
  );
}

function ReportsContent({ report }: { report: ReportKey }) {
  const toast = useToast();

  const meta = REPORT_META[report];
  const useRange = !!meta.needsRange;
  const useAsOf = !!meta.needsAsOf;
  const useShop = !!meta.needsShop;
  const useCurrency = !!meta.needsCurrency;
  const useWarehouse = !!meta.needsWarehouse;

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [preset, setPreset] = useState<RangePreset>("thisYear");

  const [shops, setShops] = useState<Shop[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(true);
  const [failures, setFailures] = useState<Record<string, string>>({});

  const [summary, setSummary] = useState<CurrencyFlowReport | null>(null);
  const [expenses, setExpenses] = useState<ExpensesBreakdownReport | null>(null);
  const [balances, setBalances] = useState<FinancialBalancesReport | null>(null);
  const [rentPerf, setRentPerf] = useState<CollectionPerformanceReport | null>(null);
  const [elecPerf, setElecPerf] = useState<CollectionPerformanceReport | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancySummaryReport | null>(null);
  const [aging, setAging] = useState<DebtAgingReport | null>(null);
  const [equity, setEquity] = useState<EquitySummaryReport | null>(null);
  const [movement, setMovement] = useState<MovementSummaryReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (useShop) {
      fetchShops()
        .then((list) => {
          if (!cancelled) setShops(list);
        })
        .catch(() => {
          if (!cancelled) setShops([]);
        });
    }
    if (useWarehouse) {
      fetchWarehouses()
        .then((list) => {
          if (!cancelled) setWarehouses(list);
        })
        .catch(() => {
          if (!cancelled) setWarehouses([]);
        });
    }
    return () => { cancelled = true; };
  }, [useShop, useWarehouse]);

  useEffect(() => {
    let cancelled = false;
    const active = applied;
    const shopParam = active.shopId === ALL ? null : active.shopId;
    const warehouseParam = active.warehouseId === ALL ? null : active.warehouseId;
    const range = { from: active.from, to: active.to };

    const tasks: Array<[ReportKey, () => Promise<unknown>]> = [];
    if (report === "financials") tasks.push(["financials", () => fetchFinancialSummary(range)]);
    if (report === "expenses") tasks.push(["expenses", () => fetchExpensesBreakdown(range)]);
    if (report === "balances") tasks.push(["balances", () => fetchFinancialBalances(active.asOfDate)]);
    if (report === "rent") tasks.push(["rent", () => fetchRentCollectionPerformance({ ...range, shopId: shopParam })]);
    if (report === "electricity") tasks.push(["electricity", () => fetchElectricityCollectionPerformance({ ...range, shopId: shopParam })]);
    if (report === "occupancy") tasks.push(["occupancy", () => fetchOccupancySummary()]);
    if (report === "debtAging") tasks.push(["debtAging", () => fetchDebtAging()]);
    if (report === "equity") tasks.push(["equity", () => fetchEquitySummary()]);
    if (report === "inventoryMovement") tasks.push(["inventoryMovement", () => fetchInventoryMovementSummary({ ...range, warehouseId: warehouseParam })]);

    Promise.allSettled(
      tasks.map(([, run]) => run()),
    ).then((results) => {
      if (cancelled) return;

      const next: Record<string, string> = {};

      results.forEach((result, index) => {
        const key = tasks[index][0];
        if (result.status === "rejected") {
          next[key] = extractApiErrorMessage(result.reason, errorLabels[key]);
          return;
        }
        switch (key) {
          case "financials":
            setSummary(result.value as CurrencyFlowReport);
            break;
          case "expenses":
            setExpenses(result.value as ExpensesBreakdownReport);
            break;
          case "balances":
            setBalances(result.value as FinancialBalancesReport);
            break;
          case "rent":
            setRentPerf(result.value as CollectionPerformanceReport);
            break;
          case "electricity":
            setElecPerf(result.value as CollectionPerformanceReport);
            break;
          case "occupancy":
            setOccupancy(result.value as OccupancySummaryReport);
            break;
          case "debtAging":
            setAging(result.value as DebtAgingReport);
            break;
          case "equity":
            setEquity(result.value as EquitySummaryReport);
            break;
          case "inventoryMovement":
            setMovement(result.value as MovementSummaryReport);
            break;
        }
      });

      setFailures(next);
      if (Object.keys(next).length > 0) {
        toast.error("بخشی از گزارش‌ها بارگذاری نشد");
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [applied, toast, report]);

  function applyPreset(next: RangePreset) {
    setPreset(next);
    const range = presetRange(next);
    if (!range) return;
    setFilters((f) => ({ ...f, from: range.from, to: range.to }));
    setLoading(true);
    setFailures({});
    setApplied((prev) => ({ ...prev, from: range.from, to: range.to }));
  }

  function applyFilters() {
    if (!filters.from || !filters.to) {
      toast.error("لطفاً بازه زمانی را کامل انتخاب کنید");
      return;
    }
    if (filters.from > filters.to) {
      toast.error("تاریخ شروع نباید بعد از تاریخ پایان باشد");
      return;
    }
    setLoading(true);
    setFailures({});
    setApplied({ ...filters });
  }

  function resetFilters() {
    setPreset("thisYear");
    setFilters(initialFilters);
    setLoading(true);
    setFailures({});
    setApplied(initialFilters);
  }

  const currencyFilter = applied.currencyId;
  const matchesCurrency = useCallback(
    (row: { currencyId: string }) => currencyFilter === ALL || row.currencyId === currencyFilter,
    [currencyFilter],
  );

  const shopLabel = useMemo(() => {
    if (applied.shopId === ALL) return "همه دوکان‌ها";
    return shops.find((s) => s.id === applied.shopId)?.shopNumber ?? "همه دوکان‌ها";
  }, [applied.shopId, shops]);

  const warehouseLabel = useMemo(() => {
    if (applied.warehouseId === ALL) return "همه گدام‌ها";
    return (
      warehouses.find((w) => w.id === applied.warehouseId)?.name ?? "همه گدام‌ها"
    );
  }, [applied.warehouseId, warehouses]);

  const filterCount =
    (useRange ? 2 : 0) +
    (useAsOf ? 1 : 0) +
    (useCurrency ? 1 : 0) +
    (useShop ? 1 : 0) +
    (useWarehouse ? 1 : 0);
  const hasFilters = filterCount > 0;
  const gridCols =
    filterCount >= 5 ? "lg:grid-cols-5" : filterCount >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  const scopeParts: string[] = [];
  if (useRange) {
    scopeParts.push(
      `بازه گزارش: ${isoToDisplayLong(applied.from)} تا ${isoToDisplayLong(applied.to)}`,
    );
  }
  if (useAsOf) scopeParts.push(`محاسبه تا: ${isoToDisplayLong(applied.asOfDate)}`);
  if (useShop) scopeParts.push(shopLabel);
  if (useWarehouse) scopeParts.push(warehouseLabel);

  return (
    <div>
      <PageHeader title={meta.title} description={meta.description} />

      {/* -------------------- Filters (top) -------------------- */}
      {hasFilters && (
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">فیلترها</h2>
        </div>

        <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${gridCols}`}>
          {useRange && (
            <>
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
                    setPreset("custom");
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
                    setPreset("custom");
                    setFilters((f) => ({ ...f, to: persianDateToIso(date) }));
                  }}
                />
              </div>
            </>
          )}

          {useAsOf && (
            <div className="relative z-50 min-w-0 space-y-1.5">
              <Label>تاریخ محاسبه موجودی</Label>
              <DatePicker
                calendar={persian}
                locale={afghanLocale}
                calendarPosition="bottom-right"
                containerClassName="w-full"
                placeholder="انتخاب تاریخ"
                value={isoToPersianDate(filters.asOfDate)}
                onChange={(date) => {
                  if (!date?.isValid) return;
                  setFilters((f) => ({ ...f, asOfDate: persianDateToIso(date) }));
                }}
              />
            </div>
          )}

          {useCurrency && (
            <div className="space-y-1.5">
              <Label>واحد پولی</Label>
              <Select
                value={filters.currencyId}
                onValueChange={(v) => setFilters((f) => ({ ...f, currencyId: v ?? ALL }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه واحدهای پولی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>همه واحدهای پولی</SelectItem>
                  {collectCurrencies(summary, expenses, balances, rentPerf, elecPerf, aging, movement).map(
                    (c) => (
                      <SelectItem key={c.currencyId} value={c.currencyId}>
                        {c.currencyCode}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {useShop && (
            <div className="space-y-1.5">
              <Label>دوکان</Label>
              <Select
                value={filters.shopId}
                onValueChange={(v) => setFilters((f) => ({ ...f, shopId: v ?? ALL }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه دوکان‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>همه دوکان‌ها</SelectItem>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      دوکان {s.shopNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {useWarehouse && (
            <div className="space-y-1.5">
              <Label>گدام</Label>
              <Select
                value={filters.warehouseId}
                onValueChange={(v) => setFilters((f) => ({ ...f, warehouseId: v ?? ALL }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه گدام‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>همه گدام‌ها</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          {/* {useRange ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {presets.map((p) => (
                <Button
                  key={p.value}
                  variant={preset === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(p.value)}
                  disabled={loading}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          ) : (
            <div />
          )} */}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters} disabled={loading}>
              <RefreshCw data-icon="inline-start" />
              بازنشانی
            </Button>
            <Button size="sm" onClick={applyFilters} disabled={loading}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" data-icon="inline-start" />
              ) : null}
              اعمال فیلتر
            </Button>
          </div>
        </div>

        {scopeParts.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">{scopeParts.join(" — ")}</p>
        )}
      </Card>
      )}

      {/* -------------------- Data (bottom) -------------------- */}
      <div className="space-y-6">
        {report === "financials" && (
        <FlowSection
          title="خلاصه مالی"
          description={`${isoToDisplay(applied.from)} تا ${isoToDisplay(applied.to)}`}
          rows={summary?.byCurrency ?? []}
          matchesCurrency={matchesCurrency}
          loading={loading}
          error={failures.financials}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        )}

        {report === "expenses" && (
        <ExpenseBreakdownSection
          report={expenses}
          matchesCurrency={matchesCurrency}
          loading={loading}
          error={failures.expenses}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        )}

        {report === "balances" && (
        <BalancesSection
          report={balances}
          matchesCurrency={matchesCurrency}
          loading={loading}
          error={failures.balances}
          icon={<Wallet className="h-4 w-4" />}
        />
        )}

        {report === "rent" && (
        <CollectionSection
          title="عملکرد وصول اجاره"
          report={rentPerf}
          matchesCurrency={matchesCurrency}
          loading={loading}
          error={failures.rent}
          icon={<Building2 className="h-4 w-4" />}
        />
        )}

        {report === "electricity" && (
        <CollectionSection
          title="عملکرد وصول برق"
          report={elecPerf}
          matchesCurrency={matchesCurrency}
          loading={loading}
          error={failures.electricity}
          icon={<Coins className="h-4 w-4" />}
        />
        )}

        {report === "occupancy" && (
        <OccupancySection
          report={occupancy}
          loading={loading}
          error={failures.occupancy}
          icon={<Building2 className="h-4 w-4" />}
        />
        )}

        {report === "debtAging" && (
        <AgingSection
          report={aging}
          matchesCurrency={matchesCurrency}
          loading={loading}
          error={failures.debtAging}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        )}

        {report === "equity" && (
        <EquitySection
          report={equity}
          loading={loading}
          error={failures.equity}
          icon={<Percent className="h-4 w-4" />}
        />
        )}

        {report === "inventoryMovement" && (
        <MovementSection
          report={movement}
          matchesCurrency={matchesCurrency}
          loading={loading}
          error={failures.inventoryMovement}
          icon={<WarehouseIcon className="h-4 w-4" />}
        />
        )}
      </div>

      <style jsx global>{`
        .rmdp-container,
        .rmdp-input {
          width: 100% !important;
          box-sizing: border-box;
        }
        .rmdp-input {
          height: 32px;
          padding: 0 10px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--foreground);
        }
        .rmdp-input:focus {
          border-color: var(--ring);
          outline: none;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Currency option list for the filter                                  */
/* ------------------------------------------------------------------ */

function collectCurrencies(...reports: unknown[]): { currencyId: string; currencyCode: string }[] {
  const seen = new Map<string, string>();
  const push = (row: { currencyId?: string; currencyCode?: string }) => {
    if (!row?.currencyId || seen.has(row.currencyId)) return;
    seen.set(row.currencyId, row.currencyCode || row.currencyId.slice(0, 3));
  };

  for (const report of reports) {
    const rec = report as {
      byCurrency?: { currencyId: string; currencyCode: string }[];
      totalsByCurrency?: { currencyId: string; currencyCode: string }[];
      grandTotal?: { currencyId: string; currencyCode: string }[];
      accounts?: AccountBalance[];
    } | null;
    if (!rec) continue;
    rec.byCurrency?.forEach(push);
    rec.totalsByCurrency?.forEach(push);
    rec.grandTotal?.forEach(push);
    rec.accounts?.forEach((a) => push({ currencyId: a.currencyId, currencyCode: a.currencyCode }));
  }

  return Array.from(seen, ([currencyId, currencyCode]) => ({ currencyId, currencyCode })).sort(
    (a, b) => a.currencyCode.localeCompare(b.currencyCode),
  );
}

/* ------------------------------------------------------------------ */
/* Shared section chrome                                                */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  description,
  icon,
  loading,
  error,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  loading: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <div className="flex items-start justify-between gap-3 border-b p-5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {icon}
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
      </div>

      {error ? (
        <div className="flex items-center gap-2 p-5 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  );
}

function AmountCell({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <TableCell className={`text-right tabular-nums ${muted ? "text-muted-foreground" : ""}`} dir="ltr">
      {money(value)}
    </TableCell>
  );
}

/* ------------------------------------------------------------------ */
/* 1) Financial summary / expenses breakdown                            */
/* ------------------------------------------------------------------ */

function FlowSection({
  title,
  description,
  rows,
  matchesCurrency,
  loading,
  error,
  icon,
}: {
  title: string;
  description: string;
  rows: CurrencyFlow[];
  matchesCurrency: (row: { currencyId: string }) => boolean;
  loading: boolean;
  error?: string;
  icon?: React.ReactNode;
}) {
  const visible = rows.filter(matchesCurrency);

  return (
    <SectionCard title={title} description={description} icon={icon} loading={loading} error={error}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">واحد پولی</TableHead>
            <TableHead className="text-right">ورودی</TableHead>
            <TableHead className="text-right">خروجی</TableHead>
            <TableHead className="text-right">خالص</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <EmptyRow colSpan={4} text="داده‌ای برای نمایش وجود ندارد" />
          ) : (
            visible.map((row) => (
              <TableRow key={row.currencyId || row.currencyCode}>
                <TableCell className="text-right font-medium">{row.currencyCode || "—"}</TableCell>
                <AmountCell value={row.totalIn} />
                <AmountCell value={row.totalOut} muted />
                <AmountCell value={row.net} />
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* تفکیک مصارف — category tree from /expenses/breakdown                  */
/* ------------------------------------------------------------------ */

function ExpenseBreakdownSection({
  report,
  matchesCurrency,
  loading,
  error,
  icon,
}: {
  report: ExpensesBreakdownReport | null;
  matchesCurrency: (row: { currencyId: string }) => boolean;
  loading: boolean;
  error?: string;
  icon: React.ReactNode;
}) {
  const grand = (report?.grandTotal ?? []).filter((g) => matchesCurrency(g));
  const categories = report?.categories ?? [];
  const hasData = grand.length > 0 || categories.length > 0;

  return (
    <SectionCard
      title="تفکیک مصارف"
      description={
        report
          ? `${isoToDisplay(report.fromDate)} تا ${isoToDisplay(report.toDate)}`
          : undefined
      }
      icon={icon}
      loading={loading}
      error={error}
    >
      {!loading && !error && !hasData ? (
        <EmptyRowWrapper text="مصرفی در این بازه ثبت نشده است" />
      ) : (
        <div className="space-y-5">
          {grand.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {grand.map((g) => (
                <div
                  key={g.currencyId}
                  className="rounded-lg border bg-muted/40 px-4 py-3"
                >
                  <p className="text-xs text-muted-foreground">
                    مجموع کل ({g.currencyCode})
                  </p>
                  <p className="tabular-nums text-lg font-semibold" dir="ltr">
                    {money(g.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {g.count.toLocaleString(fa)} سند
                  </p>
                </div>
              ))}
            </div>
          )}

          {categories.length > 0 && (
            <div className="space-y-1">
              {categories.map((node) => (
                <ExpenseNodeRow
                  key={node.categoryId}
                  node={node}
                  depth={0}
                  matchesCurrency={matchesCurrency}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function ExpenseNodeRow({
  node,
  depth,
  matchesCurrency,
}: {
  node: ExpenseBreakdownNode;
  depth: number;
  matchesCurrency: (row: { currencyId: string }) => boolean;
}) {
  // Prefer the node total; child nodes from the API have no `total`.
  const own = (node.total ?? node.direct).filter((l) => matchesCurrency(l));
  const amount = own.reduce((sum, l) => sum + l.amount, 0);
  const count = own.reduce((sum, l) => sum + l.count, 0);

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40"
        style={{ paddingInlineStart: `${depth * 1.25 + 0.5}rem` }}
      >
        <span className="min-w-0 truncate text-sm">
          {node.name || "بدون نام"}
          {count > 0 && (
            <span className="ms-2 text-xs text-muted-foreground">
              {count.toLocaleString(fa)} سند
            </span>
          )}
        </span>
        <span className="shrink-0">
          {amount === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <span className="tabular-nums text-sm font-medium" dir="ltr">
              {money(amount)}
            </span>
          )}
        </span>
      </div>
      {node.children?.map((child) => (
        <ExpenseNodeRow
          key={child.categoryId}
          node={child}
          depth={depth + 1}
          matchesCurrency={matchesCurrency}
        />
      ))}
    </>
  );
}

function EmptyRowWrapper({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
  );
}

/* ------------------------------------------------------------------ */
/* گردش گدام — /inventory/movement-summary                              */
/* ------------------------------------------------------------------ */

const movementLabels: Record<MovementType, string> = {
  PURCHASE: "خرید",
  SALE: "فروش",
  CONSUMPTION: "مصرف",
  ADJUSTMENT: "تعدیل",
  TRANSFER_OUT: "انتقال به خارج",
  TRANSFER_IN: "انتقال به داخل",
};

function MovementSection({
  report,
  matchesCurrency,
  loading,
  error,
  icon,
}: {
  report: MovementSummaryReport | null;
  matchesCurrency: (row: { currencyId: string }) => boolean;
  loading: boolean;
  error?: string;
  icon: React.ReactNode;
}) {
  const rows = (report?.byCurrency ?? []).filter((r) => matchesCurrency(r));

  return (
    <SectionCard
      title="گردش گدام"
      description={
        report
          ? `${isoToDisplay(report.from)} تا ${isoToDisplay(report.to)}`
          : undefined
      }
      icon={icon}
      loading={loading}
      error={error}
    >
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.currencyId} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{row.currencyCode}</span>
              {row.grossProfitFromSales !== 0 && (
                <span className="text-xs text-muted-foreground">
                  سود ناخالص فروش:{" "}
                  <span className="tabular-nums" dir="ltr">
                    {money(row.grossProfitFromSales)}
                  </span>
                </span>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نوع حرکت</TableHead>
                  <TableHead className="text-right">تعداد</TableHead>
                  <TableHead className="text-right">مبلغ</TableHead>
                  <TableHead className="text-right">بهای تمام‌شده</TableHead>
                  <TableHead className="text-right">اسناد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOVEMENT_TYPES.filter((t) => row.byType[t].count > 0 || row.byType[t].amount !== 0).map(
                  (type) => (
                    <TableRow key={type}>
                      <TableCell className="text-right font-medium">
                        {movementLabels[type]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums" dir="ltr">
                        {money(row.byType[type].quantity)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums" dir="ltr">
                        {money(row.byType[type].amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground" dir="ltr">
                        {money(row.byType[type].costOfGoodsSold)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground" dir="ltr">
                        {row.byType[type].count.toLocaleString(fa)}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        ))}
        {!loading && !error && rows.length === 0 && (
          <EmptyRowWrapper text="گردشی در این بازه ثبت نشده است" />
        )}
      </div>
    </SectionCard>
  );
}

function BalancesSection({
  report,
  matchesCurrency,
  loading,
  error,
  icon,
}: {
  report: FinancialBalancesReport | null;
  matchesCurrency: (row: { currencyId: string }) => boolean;
  loading: boolean;
  error?: string;
  icon?: React.ReactNode;
}) {
  const accounts = (report?.accounts ?? []).filter(matchesCurrency);
  const totals = (report?.totalsByCurrency ?? []).filter(matchesCurrency);

  return (
    <SectionCard
      title="موجودی حساب‌ها"
      description={report ? `تا تاریخ ${isoToDisplayLong(report.asOfDate)}` : undefined}
      icon={icon}
      loading={loading}
      error={error}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">حساب</TableHead>
            <TableHead className="text-right">نوع</TableHead>
            <TableHead className="text-right">واحد پولی</TableHead>
            <TableHead className="text-right">وضعیت</TableHead>
            <TableHead className="text-right">موجودی</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <EmptyRow colSpan={5} text="حسابی برای نمایش وجود ندارد" />
          ) : (
            accounts.map((account) => (
              <TableRow key={account.accountId}>
                <TableCell className="text-right font-medium">{account.name || "—"}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {account.type === "CASH" ? "نقدی" : account.type === "BANK" ? "بانکی" : account.type || "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {account.currencyCode || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={account.isActive ? "success" : "secondary"}>
                    {account.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </TableCell>
                <AmountCell value={account.balance} />
              </TableRow>
            ))
          )}
        </TableBody>
        {totals.length > 0 && (
          <tfoot>
            <TableRow className="border-t bg-muted/50 font-medium">
              <TableCell className="text-right" colSpan={4}>
                مجموع موجودی
              </TableCell>
              <TableCell className="text-right" colSpan={1}>
                <div className="flex flex-col items-end gap-0.5">
                  {totals.map((t) => (
                    <span key={t.currencyId} className="tabular-nums" dir="ltr">
                      {t.currencyCode}: {money(t.total)}
                    </span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          </tfoot>
        )}
      </Table>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* 3) Collection performance (rent / electricity)                       */
/* ------------------------------------------------------------------ */

function CollectionSection({
  title,
  report,
  matchesCurrency,
  loading,
  error,
  icon,
}: {
  title: string;
  report: CollectionPerformanceReport | null;
  matchesCurrency: (row: { currencyId: string }) => boolean;
  loading: boolean;
  error?: string;
  icon?: React.ReactNode;
}) {
  const currencies = (report?.byCurrency ?? []).filter(matchesCurrency);
  const allCurrencies = report?.byCurrency ?? [];
  // Distinguish "no data in range" from "a currency filter hid everything".
  const emptyText =
    allCurrencies.length > 0
      ? "واحد پولی انتخاب‌شده در این گزارش وجود ندارد"
      : "در این بازه زمانی داده‌ای ثبت نشده است";

  if (report && currencies.length === 0) {
    return (
      <SectionCard
        title={title}
        icon={icon}
        loading={loading}
        error={error}
      >
        <p className="p-5 text-sm text-muted-foreground">{emptyText}</p>
      </SectionCard>
    );
  }

  return (
    <>
      {currencies.map((currency: CollectionCurrency) => (
        <SectionCard
          key={currency.currencyId || currency.currencyCode}
          title={`${title} — ${currency.currencyCode}`}
          description={`${isoToDisplay(report?.from ?? "")} تا ${isoToDisplay(report?.to ?? "")} — ${currency.chargesCount.toLocaleString(fa)} قلم`}
          icon={icon}
          loading={loading}
          error={error}
        >
          <div className="space-y-4 p-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">نرخ وصول</span>
                <span className="font-medium text-foreground">{percent(currency.collectionRate)}</span>
              </div>
              <Progress value={Math.min(100, Math.max(0, currency.collectionRate * 100))} />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">تعداد</TableHead>
                  <TableHead className="text-right">مبلغ کل</TableHead>
                  <TableHead className="text-right">تخفیف</TableHead>
                  <TableHead className="text-right">خالص</TableHead>
                  <TableHead className="text-right">پرداخت شده</TableHead>
                  <TableHead className="text-right">باقی مانده</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargeStatusOrder.map((status) => {
                  const row = currency.byStatus.find((s) => s.status === status);
                  if (!row) return null;
                  return (
                    <TableRow key={status}>
                      <TableCell className="text-right">
                        <Badge variant={chargeStatusVariant[status]}>
                          {chargeStatusLabels[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.count.toLocaleString(fa)}
                      </TableCell>
                      <AmountCell value={row.sums.grossAmount} />
                      <AmountCell value={row.sums.discountAmount} muted />
                      <AmountCell value={row.sums.netAmount} />
                      <AmountCell value={row.sums.paidAmount} />
                      <AmountCell value={row.sums.remainingAmount} muted />
                    </TableRow>
                  );
                })}
                {currency.byStatus.length === 0 && (
                  <EmptyRow colSpan={7} text="داده‌ای برای نمایش وجود ندارد" />
                )}
              </TableBody>
              <tfoot>
                <TableRow className="border-t bg-muted/50 font-medium">
                  <TableCell className="text-right" colSpan={2}>
                    مجموع
                  </TableCell>
                  <TableCell className="text-right tabular-nums" dir="ltr">{money(currency.totals.grossAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums" dir="ltr">{money(currency.totals.discountAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums" dir="ltr">{money(currency.totals.netAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums" dir="ltr">{money(currency.totals.paidAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums" dir="ltr">{money(currency.totals.remainingAmount)}</TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </div>
        </SectionCard>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 4) Shop occupancy                                                    */
/* ------------------------------------------------------------------ */

function OccupancySection({
  report,
  loading,
  error,
  icon,
}: {
  report: OccupancySummaryReport | null;
  loading: boolean;
  error?: string;
  icon?: React.ReactNode;
}) {
  return (
    <SectionCard title="اشغال دوکان‌ها" icon={icon} loading={loading} error={error}>
      <div className="space-y-4 p-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">نرخ اشغال</span>
            <span className="font-medium text-foreground">
              {report ? percent(report.totals.occupancyRate) : "—"}
            </span>
          </div>
          <Progress
            value={report ? Math.min(100, Math.max(0, report.totals.occupancyRate * 100)) : 0}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">طبقه</TableHead>
              {occupancyOrder.map((s) => (
                <TableHead key={s} className="text-right">
                  {occupancyLabels[s]}
                </TableHead>
              ))}
              <TableHead className="text-right">مجموع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(report?.byFloor ?? []).length === 0 ? (
              <EmptyRow colSpan={7} text="طبقه‌ای برای نمایش وجود ندارد" />
            ) : (
              (report?.byFloor ?? []).map((floor) => (
                <TableRow key={floor.floorId}>
                  <TableCell className="text-right font-medium">
                    {floor.floorName || `طبقه ${floor.floorNumber}`}
                  </TableCell>
                  {occupancyOrder.map((s) => (
                    <TableCell
                      key={s}
                      className="text-right tabular-nums text-muted-foreground"
                    >
                      {floor.byStatus[s].toLocaleString(fa)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular-nums font-medium">
                    {floor.total.toLocaleString(fa)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {report && (
            <tfoot>
              <TableRow className="border-t bg-muted/50 font-medium">
                <TableCell className="text-right">مجموع کل</TableCell>
                {occupancyOrder.map((s) => (
                  <TableCell key={s} className="text-right tabular-nums" dir="ltr">
                    {report.totals.byStatus[s].toLocaleString(fa)}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums" dir="ltr">
                  {report.totals.total.toLocaleString(fa)}
                </TableCell>
              </TableRow>
            </tfoot>
          )}
        </Table>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* 5) Debt aging                                                        */
/* ------------------------------------------------------------------ */

function AgingSection({
  report,
  matchesCurrency,
  loading,
  error,
  icon,
}: {
  report: DebtAgingReport | null;
  matchesCurrency: (row: { currencyId: string }) => boolean;
  loading: boolean;
  error?: string;
  icon?: React.ReactNode;
}) {
  const currencies = (report?.byCurrency ?? []).filter(matchesCurrency);

  return (
    <SectionCard
      title="اقساط بدهی اجاره"
      description={report?.asOf ? `تا ${isoToDisplayLong(report.asOf.slice(0, 10))}` : undefined}
      icon={icon}
      loading={loading}
      error={error}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">واحد پولی</TableHead>
            {agingOrder.map((key) => (
              <TableHead key={key} className="text-right">
                {agingLabels[key]}
              </TableHead>
            ))}
            <TableHead className="text-right">مجموع</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currencies.length === 0 ? (
            <EmptyRow colSpan={7} text="بدهی سررسیدشده‌ای وجود ندارد" />
          ) : (
            currencies.map((currency) => (
              <TableRow key={currency.currencyId || currency.currencyCode}>
                <TableCell className="text-right font-medium">
                  {currency.currencyCode || "—"}
                </TableCell>
                {agingOrder.map((key) => (
                  <TableCell
                    key={key}
                    className="text-right tabular-nums text-muted-foreground"
                    title={`${currency.buckets[key].count.toLocaleString(fa)} قلم`}
                  >
                    {money(currency.buckets[key].amount)}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums font-medium">
                  {money(currency.totalAmount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {currencies.length > 0 && (
          <tfoot>
            <TableRow className="border-t bg-muted/50 font-medium">
              <TableCell className="text-right">تعداد کل</TableCell>
              {agingOrder.map((key) => (
                <TableCell key={key} className="text-right tabular-nums text-muted-foreground" dir="ltr">
                  {currencies
                    .reduce((sum, c) => sum + c.buckets[key].count, 0)
                    .toLocaleString(fa)}
                </TableCell>
              ))}
              <TableCell className="text-right tabular-nums" dir="ltr">
                {currencies.reduce((sum, c) => sum + c.totalCount, 0).toLocaleString(fa)}
              </TableCell>
            </TableRow>
          </tfoot>
        )}
      </Table>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* 6) Shareholder equity                                                */
/* ------------------------------------------------------------------ */

function EquitySection({
  report,
  loading,
  error,
  icon,
}: {
  report: EquitySummaryReport | null;
  loading: boolean;
  error?: string;
  icon?: React.ReactNode;
}) {
  return (
    <SectionCard title="خلاصه سهام" icon={icon} loading={loading} error={error}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">سهامدار</TableHead>
            <TableHead className="text-right">درصد سهم</TableHead>
            <TableHead className="text-right">وضعیت</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(report?.shareholders ?? []).length === 0 ? (
            <EmptyRow colSpan={3} text="سهامداری ثبت نشده است" />
          ) : (
            (report?.shareholders ?? []).map((row: ShareholderEquityRow) => (
              <TableRow key={row.shareholderId}>
                <TableCell className="text-right font-medium">{row.fullName || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {percent(row.currentPercentage / 100)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={row.isActive ? "success" : "secondary"}>
                    {row.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {report && (
          <tfoot>
            <TableRow className="border-t bg-muted/50 font-medium">
              <TableCell className="text-right">مجموع درصدها</TableCell>
              <TableCell className="text-right tabular-nums">
                {percent(report.equityPercentageSum / 100)}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={report.isBalanced ? "success" : "danger"}>
                  {report.isBalanced ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" data-icon="inline-start" />
                      متوازن
                    </>
                  ) : (
                    "نامتوازن"
                  )}
                </Badge>
              </TableCell>
            </TableRow>
          </tfoot>
        )}
      </Table>
    </SectionCard>
  );
}
