"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  ReceiptText,
  Loader2,
  ChevronRight,
  ChevronsRight,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  fetchElectricityBills,
  createElectricityBill,
  type ElectricityBill,
  type ElectricityBillMeta,
  type ElectricityBillStatus,
} from "@/services/electricity-bill.service";
import { fetchMeters, type Meter } from "@/services/meter.service";
import { fetchContracts, type Contract } from "@/services/contract.service";
import { fetchShops, type Shop } from "@/services/shop.service";
import { fetchTenants, type Tenant } from "@/services/tenant.service";
import {
  fetchAddedCurrencies,
  type AddedCurrency,
} from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";
import { isoToDisplay, todayPersian } from "@/lib/date-picker";
import { ToastProvider, useToast } from "@/components/client/toast";

const fa = "fa-AF";

const PAGE_SIZE = 20;
const MIN_JALALI_YEAR = 1300;
const MAX_JALALI_YEAR = 1500;
const MAX_PERIOD_NUMBER = 12;

const statusLabels: Record<ElectricityBillStatus, string> = {
  PENDING: "پرداخت نشده",
  PARTIAL: "پرداخت جزوی",
  PAID: "پرداخت شده",
  OVERDUE: "معوق",
};

const statusVariants: Record<
  ElectricityBillStatus,
  "secondary" | "outline" | "success" | "danger"
> = {
  PENDING: "secondary",
  PARTIAL: "outline",
  PAID: "success",
  OVERDUE: "danger",
};

const emptyForm = {
  contractId: "",
  meterId: "",
  year: String(todayPersian().year),
  periodNumber: "1",
  currentReading: "",
  totalAmount: "",
  currencyId: "",
  notes: "",
};

export default function ElectricityBillsPage() {
  return (
    <ToastProvider>
      <ElectricityBillsPageContent />
    </ToastProvider>
  );
}

function ElectricityBillsPageContent() {
  const toast = useToast();
  const [bills, setBills] = useState<ElectricityBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [meta, setMeta] = useState<ElectricityBillMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [meters, setMeters] = useState<Meter[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchElectricityBills({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setBills(result.items);
        setMeta(result.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت قبض‌های برق"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, reloadToken]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchMeters(),
      fetchContracts(),
      fetchShops(),
      fetchTenants(),
      fetchAddedCurrencies(),
    ]).then(([meterResult, contractResult, shopResult, tenantResult, currencyResult]) => {
      if (cancelled) return;
      if (meterResult.status === "fulfilled") setMeters(meterResult.value);
      if (contractResult.status === "fulfilled") setContracts(contractResult.value);
      if (shopResult.status === "fulfilled") setShops(shopResult.value);
      if (tenantResult.status === "fulfilled") setTenants(tenantResult.value);
      if (currencyResult.status === "fulfilled") setCurrencies(currencyResult.value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const contractMap = useMemo(() => {
    const m = new Map<string, Contract>();
    contracts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contracts]);

  const shopMap = useMemo(() => {
    const m = new Map<string, Shop>();
    shops.forEach((s) => m.set(s.id, s));
    return m;
  }, [shops]);

  const tenantMap = useMemo(() => {
    const m = new Map<string, Tenant>();
    tenants.forEach((t) => m.set(t.id, t));
    return m;
  }, [tenants]);

  const meterMap = useMemo(() => {
    const m = new Map<string, Meter>();
    meters.forEach((x) => m.set(x.id, x));
    return m;
  }, [meters]);

  const currencyMap = useMemo(() => {
    const m = new Map<string, AddedCurrency>();
    currencies.forEach((c) => m.set(c.id, c));
    return m;
  }, [currencies]);

  const rows = useMemo(() => {
    return bills.map((bill) => {
      const contract = contractMap.get(bill.contractId);
      const meter = meterMap.get(bill.meterId);
      const shop = shopMap.get(contract?.shopId ?? bill.shopId);
      return {
        bill,
        meter,
        shopNumber: shop?.shopNumber ?? meter?.shopNumber ?? "",
        tenantName: tenantMap.get(contract?.tenantId ?? bill.tenantId)?.fullName ?? "",
      };
    });
  }, [bills, contractMap, shopMap, tenantMap, meterMap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter(({ bill, shopNumber, tenantName, meter }) => {
      const searchText = [
        shopNumber,
        tenantName,
        meter?.serialNumber ?? "",
        bill.notes ?? "",
        bill.year,
        bill.periodNumber,
      ]
        .join(" ")
        .toLowerCase();
      return searchText.includes(q);
    });
  }, [rows, query]);

  function goToPage(next: number) {
    if (next === page || next < 1 || next > meta.totalPages) return;
    setLoading(true);
    setError(null);
    setPage(next);
  }

  function getContractLabel(contractId: string | null): string {
    const contract = contractId ? contractMap.get(contractId) : undefined;
    if (!contract) return contractId ? contractId.slice(0, 8) : "انتخاب قرارداد";
    const shop = shopMap.get(contract.shopId);
    const tenant = tenantMap.get(contract.tenantId);
    return `دوکان ${shop?.shopNumber ?? "—"} — ${tenant?.fullName ?? "—"}`;
  }

  function getMeterLabel(meterId: string | null): string {
    const meter = meterId ? meterMap.get(meterId) : undefined;
    if (!meter) return meterId ? meterId.slice(0, 8) : "انتخاب میتر";
    const parts = [meter.shopNumber ? `دوکان ${meter.shopNumber}` : "", meter.serialNumber];
    return parts.filter(Boolean).join(" — ") || meterId?.slice(0, 8) || "";
  }

  const selectedMeter = form.meterId ? meterMap.get(form.meterId) : undefined;
  const previousReading = selectedMeter?.lastReading ?? 0;
  const currentReadingValue = form.currentReading.trim() === "" ? null : Number(form.currentReading);
  const projectedConsumption =
    currentReadingValue !== null && Number.isFinite(currentReadingValue)
      ? Math.max(0, currentReadingValue - previousReading)
      : null;

  function handleMeterChange(meterId: string | null) {
    const meter = meterId ? meterMap.get(meterId) : undefined;
    setForm((f) => ({
      ...f,
      meterId: meterId ?? "",
      currentReading: meter ? String(meter.lastReading) : f.currentReading,
    }));
  }

  function openCreateDialog() {
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.contractId) {
      setFormError("قرارداد را انتخاب کنید");
      return;
    }
    if (!form.meterId) {
      setFormError("میتر را انتخاب کنید");
      return;
    }
    if (!form.currencyId) {
      setFormError("واحد پولی را انتخاب کنید");
      return;
    }

    const year = Number(form.year);
    if (form.year.trim() === "" || !Number.isInteger(year)) {
      setFormError("سال باید یک عدد صحیح باشد");
      return;
    }
    if (year < MIN_JALALI_YEAR || year > MAX_JALALI_YEAR) {
      setFormError(`سال باید بین ${MIN_JALALI_YEAR} تا ${MAX_JALALI_YEAR} باشد`);
      return;
    }

    const periodNumber = Number(form.periodNumber);
    if (
      form.periodNumber.trim() === "" ||
      !Number.isInteger(periodNumber) ||
      periodNumber < 1 ||
      periodNumber > MAX_PERIOD_NUMBER
    ) {
      setFormError(`شماره دوره باید عددی بین ۱ تا ${MAX_PERIOD_NUMBER} باشد`);
      return;
    }

    const reading = Number(form.currentReading);
    if (form.currentReading.trim() === "" || !Number.isFinite(reading) || reading < 0) {
      setFormError("قرائت فعلی باید عددی نامنفی باشد");
      return;
    }

    const totalAmount = Number(form.totalAmount);
    if (form.totalAmount.trim() === "" || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      setFormError("مبلغ کل باید عددی بزرگتر از صفر باشد");
      return;
    }

    setSaving(true);
    try {
      await createElectricityBill({
        contractId: form.contractId,
        year,
        periodNumber,
        totalAmount,
        meterId: form.meterId,
        currentReading: reading,
        currencyId: form.currencyId,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      toast.success("قبض برق جدید با موفقیت ثبت شد");
      setDialogOpen(false);
      setLoading(true);
      setError(null);
      setPage(1);
      setReloadToken((t) => t + 1);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت قبض برق ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="قبض‌های برق"
        description="صدور و پیگیری قبض‌های برق دوکان‌ها بر اساس دوره‌های قرائت میتر"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            قبض جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه قبض‌ها
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({meta.total.toLocaleString(fa)} مورد)
                </span>
              )}
            </h2>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو در این صفحه..."
              className="w-full pr-8 sm:w-52"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">دوکان / مستأجر</TableHead>
              <TableHead className="text-right">میتر</TableHead>
              <TableHead className="text-right">دوره</TableHead>
              <TableHead className="text-right">قرائت / مصرف</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}>
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  قبضی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ bill, meter, shopNumber, tenantName }) => {
                const currency = currencyMap.get(bill.currencyId);
                return (
                  <TableRow key={bill.id || `${bill.meterId}:${bill.year}:${bill.periodNumber}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <ReceiptText className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            دوکان {shopNumber || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tenantName || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          {meter?.serialNumber || "—"}
                        </span>
                        {meter?.location && (
                          <span className="text-xs text-muted-foreground">
                            {meter.location}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          سال {bill.year.toLocaleString(fa)} — دوره{" "}
                          {bill.periodNumber.toLocaleString(fa)}
                        </span>
                        {bill.periodStart && bill.periodEnd && (
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            {isoToDisplay(bill.periodStart)} →{" "}
                            {isoToDisplay(bill.periodEnd)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="tabular-nums text-foreground" dir="ltr">
                          {bill.previousReading.toLocaleString(fa)} →{" "}
                          {bill.currentReading.toLocaleString(fa)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          مصرف {bill.consumption.toLocaleString(fa)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="tabular-nums text-foreground" dir="ltr">
                          {bill.totalAmount.toLocaleString(fa)}{" "}
                          {currency?.code ?? ""}
                        </span>
                        {bill.paidAmount > 0 && (
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            پرداخت {bill.paidAmount.toLocaleString(fa)} — باقیمانده{" "}
                            {bill.remainingAmount.toLocaleString(fa)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={statusVariants[bill.status]}>
                          {statusLabels[bill.status]}
                        </Badge>
                        {bill.isOpeningEntry && (
                          <span className="text-xs text-muted-foreground">سند افتتاحیه</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {!loading && !error && meta.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              نشان دادن{" "}
              <span className="font-medium text-foreground">
                {(meta.page - 1) * meta.limit + 1}
                {"–"}
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{" "}
              از <span className="font-medium text-foreground">{meta.total.toLocaleString(fa)}</span>{" "}
              مورد — صفحه {meta.page.toLocaleString(fa)} از{" "}
              {meta.totalPages.toLocaleString(fa)}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasPrevPage}
                onClick={() => goToPage(1)}
                aria-label="صفحه اول"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasPrevPage}
                onClick={() => goToPage(meta.page - 1)}
                aria-label="صفحه قبل"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <span className="mx-1 min-w-[60px] text-center text-xs font-medium text-foreground">
                {meta.page.toLocaleString(fa)} / {meta.totalPages.toLocaleString(fa)}
              </span>

              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasNextPage}
                onClick={() => goToPage(meta.page + 1)}
                aria-label="صفحه بعد"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasNextPage}
                onClick={() => goToPage(meta.totalPages)}
                aria-label="صفحه آخر"
              >
                <ChevronsRight className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[700px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>افزودن قبض برق جدید</DialogTitle>
              <DialogDescription>
                قرارداد، میتر و دوره قرائت را انتخاب کرده و مبلغ قبض را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label>قرارداد</Label>
                  <Select
                    value={form.contractId}
                    onValueChange={(v) => setForm((f) => ({ ...f, contractId: v ?? "" }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب قرارداد">
                        {(value) => getContractLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {getContractLabel(c.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label>میتر</Label>
                  <Select value={form.meterId} onValueChange={handleMeterChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب میتر">
                        {(value) => getMeterLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {meters.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {getMeterLabel(m.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2 text-right">
                  <Label htmlFor="bill-year">سال</Label>
                  <Input
                    id="bill-year"
                    type="number"
                    step="1"
                    min={MIN_JALALI_YEAR}
                    max={MAX_JALALI_YEAR}
                    dir="ltr"
                    placeholder="1405"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="bill-period">شماره دوره</Label>
                  <Input
                    id="bill-period"
                    type="number"
                    step="1"
                    min="1"
                    max={MAX_PERIOD_NUMBER}
                    dir="ltr"
                    placeholder="1"
                    value={form.periodNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodNumber: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="bill-currency">واحد پولی</Label>
                  <Select
                    value={form.currencyId}
                    onValueChange={(v) => setForm((f) => ({ ...f, currencyId: v ?? "" }))}
                  >
                    <SelectTrigger id="bill-currency" className="w-full">
                      <SelectValue placeholder="انتخاب واحد">
                        {(value) =>
                          currencyMap.get(value)
                            ? `${currencyMap.get(value)?.name} (${currencyMap.get(value)?.code})`
                            : "انتخاب واحد پولی"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="bill-current-reading">قرائت فعلی</Label>
                  <Input
                    id="bill-current-reading"
                    type="number"
                    step="any"
                    min="0"
                    dir="ltr"
                    placeholder="0"
                    value={form.currentReading}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currentReading: e.target.value }))
                    }
                    required
                  />
                  {selectedMeter && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 shrink-0" />
                      <span>
                        قرائت قبلی میتر:{" "}
                        <span className="tabular-nums" dir="ltr">
                          {previousReading.toLocaleString(fa)}
                        </span>
                        {projectedConsumption !== null && (
                          <>
                            {" — "}
                            مصرف این دوره:{" "}
                            <span className="tabular-nums" dir="ltr">
                              {projectedConsumption.toLocaleString(fa)}
                            </span>
                          </>
                        )}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="bill-total-amount">مبلغ کل قبض</Label>
                  <Input
                    id="bill-total-amount"
                    type="number"
                    step="any"
                    min="0"
                    dir="ltr"
                    placeholder="0"
                    value={form.totalAmount}
                    onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="bill-notes">توضیحات</Label>
                <Textarea
                  id="bill-notes"
                  rows={3}
                  placeholder="توضیحات قبض"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    انصراف
                  </Button>
                }
              />

              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {saving ? "در حال ذخیره..." : "افزودن قبض"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
