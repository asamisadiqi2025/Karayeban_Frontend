"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  ReceiptText,
  Loader2,
  ChevronRight,
  ChevronsRight,
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
  fetchElectricityPayments,
  createElectricityPayment,
  unallocatedAmount,
  type ElectricityPayment,
  type ElectricityPaymentMeta,
  type PaymentMethod,
} from "@/services/electricity-payment.service";
import { fetchContracts, type Contract } from "@/services/contract.service";
import { fetchShops, type Shop } from "@/services/shop.service";
import { fetchTenants, type Tenant } from "@/services/tenant.service";
import { fetchBankAccounts, type BankAccount } from "@/services/bank-account.service";
import {
  fetchAddedCurrencies,
  type AddedCurrency,
} from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";
import { isoToDisplayDateTime } from "@/lib/date-picker";
import { ToastProvider, useToast } from "@/components/client/toast";

const fa = "fa-AF";

const PAGE_SIZE = 20;

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "نقدی" },
  { value: "bank_transfer", label: "انتقال بانکی" },
  { value: "card", label: "کارت" },
  { value: "online", label: "آنلاین" },
];

const emptyForm = {
  contractId: "",
  amount: "",
  accountId: "",
  paymentMethod: "cash" as PaymentMethod,
  receiptNumber: "",
  notes: "",
};

export default function ElectricityPaymentsPage() {
  return (
    <ToastProvider>
      <ElectricityPaymentsPageContent />
    </ToastProvider>
  );
}

function ElectricityPaymentsPageContent() {
  const toast = useToast();
  const [payments, setPayments] = useState<ElectricityPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [meta, setMeta] = useState<ElectricityPaymentMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
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
    fetchElectricityPayments({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setPayments(result.items);
        setMeta(result.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت پرداخت‌های برق"));
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
      fetchContracts(),
      fetchShops(),
      fetchTenants(),
      fetchBankAccounts(),
      fetchAddedCurrencies(),
    ]).then(([contractResult, shopResult, tenantResult, accountResult, currencyResult]) => {
      if (cancelled) return;
      if (contractResult.status === "fulfilled") setContracts(contractResult.value);
      if (shopResult.status === "fulfilled") setShops(shopResult.value);
      if (tenantResult.status === "fulfilled") setTenants(tenantResult.value);
      if (accountResult.status === "fulfilled") setAccounts(accountResult.value);
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

  const accountMap = useMemo(() => {
    const m = new Map<string, BankAccount>();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  const currencyMap = useMemo(() => {
    const m = new Map<string, AddedCurrency>();
    currencies.forEach((c) => m.set(c.id, c));
    return m;
  }, [currencies]);

  const rows = useMemo(() => {
    return payments.map((payment) => {
      const shopNumber =
        payment.shop?.shopNumber ?? shopMap.get(payment.shopId)?.shopNumber ?? "";
      const tenantName = tenantMap.get(payment.tenantId)?.fullName ?? "";
      return { payment, shopNumber, tenantName };
    });
  }, [payments, shopMap, tenantMap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter(({ payment, shopNumber, tenantName }) => {
      const searchText = [
        shopNumber,
        tenantName,
        payment.receiptNumber ?? "",
        payment.notes ?? "",
        accountMap.get(payment.accountId)?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchText.includes(q);
    });
  }, [rows, query, accountMap]);

  const selectedAccount = form.accountId ? accountMap.get(form.accountId) : undefined;

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

  function currencyLabel(currencyId: string): string {
    const currency =
      currencyMap.get(currencyId) ??
      accounts.find((a) => a.currencyId === currencyId) ??
      null;
    if (currency && "code" in currency) return currency.code ?? "";
    return currency?.currencyCode ?? "";
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
    if (!form.accountId) {
      setFormError("حساب دریافت را انتخاب کنید");
      return;
    }

    const contract = contractMap.get(form.contractId);
    if (!contract) {
      setFormError("قرارداد انتخاب شده معتبر نیست");
      return;
    }

    const amount = Number(form.amount);
    if (form.amount.trim() === "" || !Number.isFinite(amount) || amount <= 0) {
      setFormError("مبلغ پرداخت باید عددی بزرگتر از صفر باشد");
      return;
    }

    setSaving(true);
    try {
      await createElectricityPayment({
        shopId: contract.shopId,
        tenantId: contract.tenantId,
        amount,
        accountId: form.accountId,
        paymentMethod: form.paymentMethod,
        ...(form.receiptNumber.trim() ? { receiptNumber: form.receiptNumber.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      toast.success("پرداخت برق جدید با موفقیت ثبت شد");
      setDialogOpen(false);
      setLoading(true);
      setError(null);
      setPage(1);
      setReloadToken((t) => t + 1);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت پرداخت برق ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="دریافت پول برق"
        description="ثبت پرداخت‌های مشتریان بابت قبض‌های برق"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            دریافت پول
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه پرداخت‌ها
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
              className="w-full pr-8 sm:w-56"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">دوکان / مستأجر</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead className="text-right">روش پرداخت</TableHead>
              <TableHead className="text-right">حساب</TableHead>
              <TableHead className="text-right">شماره رسید</TableHead>
              <TableHead className="text-right">تاریخ پرداخت</TableHead>
              <TableHead className="text-right">تخصیص</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
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
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  پرداختی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ payment, shopNumber, tenantName }) => {
                const account = accountMap.get(payment.accountId);
                const code = currencyLabel(payment.currencyId);
                const remaining = unallocatedAmount(payment);
                const methodLabel =
                  paymentMethods.find((m) => m.value === payment.paymentMethod)?.label ??
                  payment.paymentMethod;

                return (
                  <TableRow
                    key={payment.id || `${payment.shopId}:${payment.paymentDate}:${payment.amount}`}
                  >
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
                      <span className="tabular-nums text-foreground" dir="ltr">
                        {payment.amount.toLocaleString(fa)} {code}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {methodLabel}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {account?.name ?? "—"}
                    </TableCell>

                    <TableCell className="text-muted-foreground" dir="ltr">
                      {payment.receiptNumber || "—"}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {payment.paymentDate
                        ? isoToDisplayDateTime(payment.paymentDate)
                        : "—"}
                    </TableCell>

                    <TableCell>
                      {remaining > 0 ? (
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant="danger">تخصیص نیافته</Badge>
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            {remaining.toLocaleString(fa)} {code}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="success">تخصیص یافته</Badge>
                      )}
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
              <DialogTitle>ثبت پرداخت برق جدید</DialogTitle>
              <DialogDescription>
                قرارداد و حساب دریافت را انتخاب کرده و مبلغ پرداخت را وارد کنید
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
                  <Label htmlFor="electricity-payment-amount">مبلغ</Label>
                  <Input
                    id="electricity-payment-amount"
                    type="number"
                    step="any"
                    min="0"
                    dir="ltr"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                  {selectedAccount?.currencyCode && (
                    <p className="text-xs text-muted-foreground">
                      واحد پولی این پرداخت از روی حساب انتخابی تعیین می‌شود:{" "}
                      <span className="font-medium text-foreground">
                        {selectedAccount.currencyCode}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label>حساب دریافت</Label>
                  <Select
                    value={form.accountId}
                    onValueChange={(v) => setForm((f) => ({ ...f, accountId: v ?? "" }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب حساب">
                        {(value) => {
                          const account = value ? accountMap.get(value) : undefined;
                          return account
                            ? `${account.name}${account.currencyCode ? ` (${account.currencyCode})` : ""}`
                            : "انتخاب حساب";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                          {a.currencyCode ? ` (${a.currencyCode})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label>روش پرداخت</Label>
                  <Select
                    value={form.paymentMethod}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        paymentMethod: (v as PaymentMethod) ?? "cash",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب روش پرداخت">
                        {(value) =>
                          paymentMethods.find((m) => m.value === value)?.label ??
                          "انتخاب روش پرداخت"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="electricity-payment-receipt">شماره رسید</Label>
                <Input
                  id="electricity-payment-receipt"
                  dir="ltr"
                  placeholder="اختیاری — در صورت خالی بودن توسط سرور تولید می‌شود"
                  value={form.receiptNumber}
                  onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="electricity-payment-notes">توضیحات</Label>
                <Textarea
                  id="electricity-payment-notes"
                  rows={3}
                  placeholder="توضیحات پرداخت"
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
                {saving ? "در حال ذخیره..." : "ثبت پرداخت"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
