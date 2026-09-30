"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Loader2,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  isoToDisplayDateTime,
  isoToDisplayLong,
  isoToPersianDate,
  persianDateToIso,
} from "@/lib/date-picker";

import {
  fetchAccountStatement,
  fetchBankAccounts,
  type AccountStatement,
  type BankAccount,
} from "@/services/bank-account.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const ALL = "all";
const PAGE_SIZE = 10;

const initialRange = currentJalaliYearRange();

interface Filters {
  accountId: string;
  from: string;
  to: string;
}

const initialFilters: Filters = {
  accountId: ALL,
  from: initialRange.from,
  to: initialRange.to,
};

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value: string): string {
  return toNumber(value).toLocaleString("fa-AF", { maximumFractionDigits: 4 });
}

export default function AccountStatementPage() {
  return (
    <ToastProvider>
      <AccountStatementPageContent />
    </ToastProvider>
  );
}

function AccountStatementPageContent() {
  const toast = useToast();

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [formError, setFormError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const [statement, setStatement] = useState<AccountStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetchBankAccounts()
      .then((result) => {
        if (!cancelled) setAccounts(result);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(extractApiErrorMessage(err, "خطا در دریافت لیست حساب‌ها"));
        }
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  /** دریافت صورت حساب در بازه فیلترها */
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAccountStatement(filters.accountId, {
        from: filters.from,
        to: filters.to,
      });
      setStatement(result);
    } catch (err) {
      setStatement(null);
      setError(extractApiErrorMessage(err, "خطا در دریافت صورت حساب"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (filters.accountId === ALL) {
      setFormError("یک حساب را انتخاب کنید");
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
    await load();
  }

  function handleReset() {
    setFilters(initialFilters);
    setStatement(null);
    setError(null);
    setFormError(null);
    setSearch("");
    setPage(1);
  }

  const transactions = useMemo(() => statement?.transactions ?? [], [statement]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => t.description.toLowerCase().includes(q));
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const accountName =
    statement?.accountName ||
    accounts.find((a) => a.id === filters.accountId)?.name ||
    "";
  const currencyCode = accounts.find((a) => a.id === filters.accountId)?.currencyCode;

  return (
    <div>
      <PageHeader
        title="صورت حساب بانکی"
        description="گردش ورودی و خروجی یک حساب در بازه تاریخی دلخواه"
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
              <Label>حساب</Label>
              <Select
                value={filters.accountId}
                onValueChange={(v) => setFilters((f) => ({ ...f, accountId: v ?? ALL }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب حساب">
                    {(value) => accounts.find((a) => a.id === value)?.name ?? "انتخاب حساب"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accountsLoading ? (
                    <SelectItem value="__loading__" disabled>
                      در حال بارگذاری...
                    </SelectItem>
                  ) : accounts.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      حسابی ثبت نشده است
                    </SelectItem>
                  ) : (
                    accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
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
              {loading ? "در حال دریافت..." : "نمایش صورت حساب"}
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
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-[13.5px] font-medium text-muted-foreground">موجودی اولیه</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground" dir="ltr">
                {formatNumber(statement.openingBalance)}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[13.5px] font-medium text-muted-foreground">مجموع ورودی</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground" dir="ltr">
                {formatNumber(statement.totalIn)}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[13.5px] font-medium text-muted-foreground">مجموع خروجی</p>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                  <ArrowUpRight className="h-4 w-4 text-rose-600" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground" dir="ltr">
                {formatNumber(statement.totalOut)}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[13.5px] font-medium text-muted-foreground">موجودی نهایی</p>
                {currencyCode && (
                  <Badge variant="outline" dir="ltr">
                    {currencyCode}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground" dir="ltr">
                {formatNumber(statement.closingBalance)}
              </p>
            </Card>
          </div>

          {/* Transactions */}
          <Card className="p-0">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  تراکنش‌ها
                  <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                    ({filtered.length.toLocaleString("fa-AF")} مورد)
                  </span>
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {accountName || "—"} — بازه گزارش:{" "}
                  {isoToDisplayLong(statement.from)} تا {isoToDisplayLong(statement.to)}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="جستجو در شرح..."
                  className="pr-8"
                  aria-label="جستجو در تراکنش‌ها"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">تاریخ</TableHead>
                  <TableHead className="text-right">شرح</TableHead>
                  <TableHead className="text-right">نوع</TableHead>
                  <TableHead className="text-right">مبلغ</TableHead>
                  <TableHead className="text-right">موجودی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      داده‌ای یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((tx) => {
                    const isIn = tx.direction === "IN";
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-right text-muted-foreground">
                          {isoToDisplayDateTime(tx.entryDate)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {tx.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={isIn ? "success" : "danger"}>
                            {isIn ? "ورودی" : "خروجی"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium tabular-nums ${isIn ? "text-emerald-600" : "text-rose-600"}`}
                          dir="ltr"
                        >
                          {isIn ? "+" : "−"}
                          {formatNumber(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground" dir="ltr">
                          {formatNumber(tx.balance)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {filtered.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  نشان دادن{" "}
                  <span className="font-medium text-foreground">
                    {startIndex + 1}
                    {"–"}
                    {Math.min(startIndex + PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  از{" "}
                  <span className="font-medium text-foreground">
                    {filtered.length.toLocaleString("fa-AF")}
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
        </div>
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
