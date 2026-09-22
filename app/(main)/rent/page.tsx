"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, ReceiptText, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  fetchRentPayments,
  createRentPayment,
  type RentPayment,
  type PaymentMethod,
} from "@/services/rent-payment.service";
import { fetchContracts, type Contract } from "@/services/contract.service";
import { fetchShops, type Shop } from "@/services/shop.service";
import { fetchTenants, type Tenant } from "@/services/tenant.service";
import { fetchBankAccounts, type BankAccount } from "@/services/bank-account.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const months = [
  { value: 1, label: "جدی" },
  { value: 2, label: "دلو" },
  { value: 3, label: "حوت" },
  { value: 4, label: "حمل" },
  { value: 5, label: "ثور" },
  { value: 6, label: "جوزا" },
  { value: 7, label: "سرطان" },
  { value: 8, label: "اسد" },
  { value: 9, label: "سنبله" },
  { value: 10, label: "میزان" },
  { value: 11, label: "عقرب" },
  { value: 12, label: "قوس" },
];

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
  notes: "",
};

export default function RentPaymentsPage() {
  return (
    <ToastProvider>
      <RentPaymentsPageContent />
    </ToastProvider>
  );
}

function RentPaymentsPageContent() {
  const toast = useToast();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRentPayments();
      setPayments(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت پرداخت‌های اجاره"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchRentPayments(),
      fetchContracts(),
      fetchShops(),
      fetchTenants(),
      fetchBankAccounts(),
    ]).then(([payResult, conResult, shopResult, tenantResult, accResult]) => {
      if (cancelled) return;
      if (payResult.status === "fulfilled") {
        setPayments(Array.isArray(payResult.value) ? payResult.value : []);
      } else {
        setError(extractApiErrorMessage(payResult.reason, "خطا در دریافت پرداخت‌های اجاره"));
      }
      if (conResult.status === "fulfilled") setContracts(conResult.value);
      if (shopResult.status === "fulfilled") setShops(shopResult.value);
      if (tenantResult.status === "fulfilled") setTenants(tenantResult.value);
      if (accResult.status === "fulfilled") setAccounts(accResult.value);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
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
    const m = new Map<string, string>();
    accounts.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [accounts]);

  const filtered = useMemo(() => {
    if (query.trim() === "") return payments;
    return payments.filter((p) => {
      const contract = contractMap.get(p.contractId);
      const shop = contract ? shopMap.get(contract.shopId) : shopMap.get(p.shopId);
      const tenant = contract ? tenantMap.get(contract.tenantId) : tenantMap.get(p.tenantId);
      const searchText = `${shop?.shopNumber ?? ""} ${tenant?.fullName ?? ""} ${p.notes ?? ""}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }, [payments, query, contractMap, shopMap, tenantMap]);

  function getContractLabel(contractId: string): string {
    const contract = contractMap.get(contractId);
    if (!contract) return contractId.slice(0, 8);
    const shop = shopMap.get(contract.shopId);
    const tenant = tenantMap.get(contract.tenantId);
    const shopLabel = shop?.shopNumber ?? "—";
    const tenantLabel = tenant?.fullName ?? "—";
    return `دوکان ${shopLabel} — ${tenantLabel}`;
  }

  function openCreateDialog() {
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.contractId) { setFormError("قرارداد را انتخاب کنید"); return; }
    if (!form.amount || Number(form.amount) <= 0) { setFormError("لطفاً مبلغ پرداخت را وارد کنید"); return; }
    if (!form.accountId) { setFormError("لطفاً حساب پرداخت را انتخاب کنید"); return; }

    const payload = {
      contractId: form.contractId,
      amount: Number(form.amount),
      accountId: form.accountId,
      paymentMethod: form.paymentMethod,
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };

    setSaving(true);
    try {
      const created = await createRentPayment(payload);
      setPayments((prev) => [created, ...prev]);
      toast.success("پرداخت اجاره جدید با موفقیت ثبت شد");
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت پرداخت اجاره ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  function formatMonthYear(month: number, year: number): string {
    if (!month || !year) return "—";
    const monthName = months.find((m) => m.value === month)?.label ?? String(month);
    return `${monthName} ${year}`;
  }

  return (
    <div>
      <PageHeader
        title="پرداخت‌های اجاره"
        description="مدیریت پرداخت‌های اجاره"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            پرداخت جدید
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
                  ({filtered.length.toLocaleString("fa-AF")} مورد)
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی پرداخت..."
                className="w-full pr-8 sm:w-56"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">دوکان / مستأجر</TableHead>
              <TableHead className="text-right">ماه / سال</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead className="text-right">روش پرداخت</TableHead>
              <TableHead className="text-right">تاریخ پرداخت</TableHead>
              <TableHead className="text-right">حساب</TableHead>
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
                  پرداختی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((payment) => {
                const contract = contractMap.get(payment.contractId);
                const shop = contract ? shopMap.get(contract.shopId) : shopMap.get(payment.shopId);
                const tenant = contract ? tenantMap.get(contract.tenantId) : tenantMap.get(payment.tenantId);
                const paymentMethodLabel = paymentMethods.find((m) => m.value === payment.paymentMethod)?.label ?? payment.paymentMethod;

                return (
                <TableRow
                  key={payment.id}
                >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <ReceiptText className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            دوکان {shop?.shopNumber ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tenant?.fullName ?? "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatMonthYear(payment.month, payment.year)}
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">
                      {payment.amount.toLocaleString("fa-AF")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paymentMethodLabel}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString("fa-AF")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {accountMap.get(payment.accountId) ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>
                افزودن پرداخت اجاره جدید
              </DialogTitle>
              <DialogDescription>
                اطلاعات پرداخت اجاره را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label>قرارداد</Label>
                  <Select value={form.contractId} onValueChange={(v) => setForm((f) => ({ ...f, contractId: v ?? "" }))}>
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
                  <Label htmlFor="payment-amount">مبلغ</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0"
                    dir="ltr"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label>حساب</Label>
                  <Select value={form.accountId} onValueChange={(v) => setForm((f) => ({ ...f, accountId: v ?? "" }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب حساب">
                        {(value) => accounts.find((a) => a.id === value)?.name ?? "انتخاب حساب"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label>روش پرداخت</Label>
                  <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: (v as PaymentMethod) ?? "cash" }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب روش پرداخت">
                        {(value) => paymentMethods.find((m) => m.value === value)?.label ?? "انتخاب روش پرداخت"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="payment-notes">توضیحات</Label>
                <Textarea
                  id="payment-notes"
                  rows={3}
                  placeholder="توضیحات پرداخت"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
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
                  <Loader2
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                )}
                {saving
                  ? "در حال ذخیره..."
                  : "افزودن پرداخت"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
