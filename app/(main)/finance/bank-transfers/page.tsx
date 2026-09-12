"use client";

<<<<<<< HEAD
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, ArrowLeftRight, Loader2 } from "lucide-react";
=======
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeftRight, Loader2 } from "lucide-react";
>>>>>>> dev

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

<<<<<<< HEAD
import { fetchBankAccounts, type BankAccount } from "@/services/bank-account.service";
import {
  transferBetweenAccounts,
  fetchTransfers,
  type TransferResult,
} from "@/services/account-transfer.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";
import type { Currency } from "../bankaccounts/types";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
=======
import {
  fetchBankAccounts,
  fetchTransfers,
  transferBetweenAccounts,
  type BankAccount,
  type TransferRecord,
} from "@/services/bank-account.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";
>>>>>>> dev

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

<<<<<<< HEAD
function toCurrency(currency: AddedCurrency): Currency {
  return {
    id: currency.id,
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol ?? null,
  };
=======
function formatAmount(amount: number, currencyCode?: string) {
  const value = amount.toLocaleString("fa-IR");
  return currencyCode ? `${value} ${currencyCode}` : value;
>>>>>>> dev
}

const emptyForm = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  exchangeRate: "",
};

export default function AccountTransfersPage() {
  return (
    <ToastProvider>
      <AccountTransfersPageContent />
    </ToastProvider>
  );
}

function AccountTransfersPageContent() {
  const toast = useToast();
<<<<<<< HEAD

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sameAccountError, setSameAccountError] = useState(false);
  const [currencyMismatch, setCurrencyMismatch] = useState(false);
  const [transfers, setTransfers] = useState<TransferResult[]>([]);

  const loadData = useCallback(async () => {
    const [accountsResult, currenciesResult, transfersResult] = await Promise.allSettled([
      fetchBankAccounts(),
      fetchAddedCurrencies(),
      fetchTransfers(),
    ]);
    if (accountsResult.status === "fulfilled") {
      setAccounts(Array.isArray(accountsResult.value) ? accountsResult.value : []);
    } else {
      setLoadError(extractApiErrorMessage(accountsResult.reason, "خطا در دریافت حساب‌ها"));
    }
    setCurrencies(
      currenciesResult.status === "fulfilled"
        ? (Array.isArray(currenciesResult.value) ? currenciesResult.value : []).map(toCurrency)
        : []
    );
    if (transfersResult.status === "fulfilled") {
      setTransfers(transfersResult.value);
=======
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingAccounts(true);
    setError(null);
    try {
      const [accountsResult, transfersResult] = await Promise.all([
        fetchBankAccounts(),
        fetchTransfers(),
      ]);
      setAccounts(Array.isArray(accountsResult) ? accountsResult : []);
      setTransfers(Array.isArray(transfersResult) ? transfersResult : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت حساب‌ها"));
    } finally {
      setLoadingAccounts(false);
      setLoadingTransfers(false);
>>>>>>> dev
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
<<<<<<< HEAD
    loadData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await loadData();
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  function getCurrency(id: string): Currency | undefined {
    return currencies.find((c) => c.id === id);
  }
=======
    fetchBankAccounts()
      .then((result) => {
        if (cancelled) return;
        setAccounts(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت حساب‌ها"));
      })
      .finally(() => {
        if (!cancelled) setLoadingAccounts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTransfers()
      .then((result) => {
        if (cancelled) return;
        setTransfers(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت انتقال‌ها"));
      })
      .finally(() => {
        if (!cancelled) setLoadingTransfers(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fromAccount = accounts.find((a) => a.id === form.fromAccountId);
  const toAccount = accounts.find((a) => a.id === form.toAccountId);

  // مقصد می‌تواند هر حسابی به‌جز حساب مبدأ باشد
  const toCandidates = useMemo(
    () => accounts.filter((a) => a.id !== fromAccount?.id),
    [accounts, fromAccount],
  );

  // در صورت انتقال بین دو ارز، نرخ ارز الزامی است
  const needsExchangeRate =
    !!fromAccount &&
    !!toAccount &&
    fromAccount.currencyId !== toAccount.currencyId;
>>>>>>> dev

  function getAccount(id: string): BankAccount | undefined {
    return accounts.find((a) => a.id === id);
  }

  const fromAccount = getAccount(fromAccountId);
  const toAccount = getAccount(toAccountId);
  const fromCurrency = fromAccount ? getCurrency(fromAccount.currencyId) : undefined;
  const toCurrencySel = toAccount ? getCurrency(toAccount.currencyId) : undefined;

  // حساب‌های دارای ارز یکسان با حساب مبدأ (برای فیلتر «حساب مقصد»)
  const sameCurrencyAccounts = fromAccount
    ? accounts.filter((a) => a.id !== fromAccount.id && a.currencyId === fromAccount.currencyId)
    : [];

  function openCreateDialog() {
<<<<<<< HEAD
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setDescription("");
    setSameAccountError(false);
    setCurrencyMismatch(false);
=======
    setForm(emptyForm);
>>>>>>> dev
    setFormError(null);
    setDialogOpen(true);
  }

<<<<<<< HEAD
  function handleFromChange(value: string | null) {
    setFromAccountId(value ?? "");
    setSameAccountError(false);
    setCurrencyMismatch(false);
    setToAccountId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSameAccountError(false);
    setCurrencyMismatch(false);

    if (!fromAccountId || !toAccountId) {
      setFormError("حساب مبدأ و مقصد را انتخاب کنید");
      return;
    }
    if (fromAccountId === toAccountId) {
      setSameAccountError(true);
      return;
    }
    if (fromAccount && toAccount && fromAccount.currencyId !== toAccount.currencyId) {
      setCurrencyMismatch(true);
      return;
    }
    const value = toNumber(amount);
    if (value <= 0) {
      setFormError("مبلغ انتقال باید بیشتر از صفر باشد");
      return;
    }

    setSubmitting(true);
    try {
      await transferBetweenAccounts({
        fromAccountId,
        toAccountId,
        amount: value,
      });
      toast.success(
        `انتقال ${value.toLocaleString("fa-IR")} ${fromCurrency?.code ?? ""} با موفقیت انجام شد`
      );
      setDialogOpen(false);
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setDescription("");
      await loadData();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "انتقال وجه ناموفق بود"));
    } finally {
      setSubmitting(false);
=======
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.fromAccountId || !form.toAccountId) {
      setFormError("انتخاب حساب مبدأ و مقصد الزامی است");
      return;
    }
    if (form.fromAccountId === form.toAccountId) {
      setFormError("حساب مبدأ و مقصد نمی‌توانند یکسان باشند");
      return;
    }
    const amount = toNumber(form.amount);
    if (amount <= 0) {
      setFormError("مبلغ انتقال باید بیشتر از صفر باشد");
      return;
    }
    if (!fromAccount || !toAccount) {
      setFormError("انتخاب حساب مبدأ و مقصد الزامی است");
      return;
    }

    let exchangeRate: number | undefined;
    if (fromAccount.currencyId !== toAccount.currencyId) {
      exchangeRate = toNumber(form.exchangeRate);
      if (exchangeRate <= 0) {
        setFormError("برای انتقال بین دو ارز، نرخ ارز باید بیشتر از صفر باشد");
        return;
      }
    }

    setSaving(true);
    try {
      await transferBetweenAccounts({
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount,
        ...(exchangeRate !== undefined ? { exchangeRate } : {}),
      });
      setTransfers((prev) => [
        {
          id: `${Date.now()}`,
          fromAccountId: form.fromAccountId,
          toAccountId: form.toAccountId,
          amount,
          ...(exchangeRate !== undefined ? { exchangeRate } : {}),
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      toast.success("انتقال با موفقیت انجام شد");
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "انجام انتقال ناموفق بود"));
    } finally {
      setSaving(false);
>>>>>>> dev
    }
  }

  return (
    <div>
      <PageHeader
        title="انتقال بین حساب‌ها"
<<<<<<< HEAD
        description="انتقال وجه بین حساب‌های هم‌ارز"
=======
        description="انتقال وجه بین دو حساب با ارز یکسان یا ارزهای متفاوت"
>>>>>>> dev
        action={
          <Button onClick={openCreateDialog} disabled={!accounts.length}>
            <Plus data-icon="inline-start" />
            انتقال جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
<<<<<<< HEAD
            <h2 className="text-sm font-semibold text-foreground">انتقال‌های اخیر</h2>
=======
            <h2 className="text-sm font-semibold text-foreground">
              انتقال‌های انجام‌شده
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                ({transfers.length.toLocaleString("fa-AF")} مورد)
              </span>
            </h2>
>>>>>>> dev
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>از حساب</TableHead>
              <TableHead>به حساب</TableHead>
<<<<<<< HEAD
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10">
=======
              <TableHead>مبلغ</TableHead>
              <TableHead>نرخ ارز</TableHead>
              <TableHead>تاریخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingAccounts || loadingTransfers ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
>>>>>>> dev
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
<<<<<<< HEAD
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button variant="outline" size="sm" onClick={reload}>
=======
            ) : error && transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}>
>>>>>>> dev
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : transfers.length === 0 ? (
              <TableRow>
<<<<<<< HEAD
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  هنوز انتقالی ثبت نشده است
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((t) => {
                const from = getAccount(t.fromAccountId ?? "");
                const to = getAccount(t.toAccountId ?? "");
                const fc = from ? getCurrency(from.currencyId) : undefined;
                const amount = t.amount ?? 0;
                return (
                  <TableRow key={t.id}>
=======
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  هنوز انتقالی انجام نشده است
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((transfer) => {
                const from = accounts.find(
                  (a) => a.id === transfer.fromAccountId,
                );
                const to = accounts.find((a) => a.id === transfer.toAccountId);
                return (
                  <TableRow key={transfer.id}>
>>>>>>> dev
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
<<<<<<< HEAD
                        <span className="font-medium text-foreground">{from?.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{to?.name ?? "—"}</TableCell>
                    <TableCell dir="ltr" className="text-muted-foreground">
                      {amount.toLocaleString("fa-IR")} {fc?.code ?? ""}
=======
                        <span className="font-medium text-foreground">
                          {from?.name ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {to?.name ?? "—"}
                    </TableCell>
                    <TableCell
                      dir="ltr"
                      className="font-medium tabular-nums text-foreground"
                    >
                      {formatAmount(transfer.amount, from?.currencyCode)}
                    </TableCell>
                    <TableCell
                      dir="ltr"
                      className="tabular-nums text-muted-foreground"
                    >
                      {transfer.exchangeRate
                        ? `${transfer.exchangeRate} ${to?.currencyCode ?? ""}`
                        : "—"}
                    </TableCell>
                    <TableCell dir="ltr" className="text-muted-foreground">
                      {new Date(transfer.createdAt).toLocaleDateString("fa-IR")}
>>>>>>> dev
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

<<<<<<< HEAD
      {/* مودال انتقال حساب */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>انتقال بین حساب‌ها</DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر را از یک حساب به حساب هم‌ارز دیگر انتقال دهید
=======
      {/* مودال انتقال */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="text-right">
            <DialogTitle>انتقال بین حساب‌ها</DialogTitle>
            <DialogDescription>
              مبلغ را بین دو حساب (با ارز یکسان یا متفاوت) منتقل کنید
>>>>>>> dev
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
<<<<<<< HEAD
            {/* حساب مبدأ و مقصد */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from-account">از حساب</Label>
                <Select value={fromAccountId} onValueChange={handleFromChange}>
                  <SelectTrigger id="from-account" className="w-full">
                    <SelectValue
                      placeholder={
                        loading
                          ? "در حال بارگذاری..."
                          : accounts.length
                            ? "انتخاب حساب مبدأ"
                            : "حسابی یافت نشد"
                      }
                    >
                      {fromAccount
                        ? `${fromAccount.name} (${fromCurrency?.code ?? ""})`
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => {
                      const c = getCurrency(account.currencyId);
                      return (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({c?.code ?? ""})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-account">به حساب</Label>
                <Select
                  value={toAccountId}
                  onValueChange={(v) => {
                    setToAccountId(v ?? "");
                    setSameAccountError(false);
                    setCurrencyMismatch(false);
                  }}
                >
                  <SelectTrigger id="to-account" className="w-full">
                    <SelectValue
                      placeholder={
                        fromAccountId
                          ? "انتخاب حساب مقصد"
                          : "ابتدا حساب مبدأ را انتخاب کنید"
                      }
                    >
                      {toAccount
                        ? `${toAccount.name} (${toCurrencySel?.code ?? ""})`
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {fromAccountId ? (
                      sameCurrencyAccounts.length > 0 ? (
                        sameCurrencyAccounts.map((account) => {
                          const c = getCurrency(account.currencyId);
                          return (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({c?.code ?? ""})
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="__none__" disabled>
                          حساب هم‌ارزی برای انتقال وجود ندارد
                        </SelectItem>
                      )
                    ) : null}
                  </SelectContent>
                </Select>

                {sameAccountError && (
                  <p className="text-xs text-destructive">
                    حساب مبدأ و مقصد نمی‌توانند یکسان باشند
                  </p>
                )}
                {currencyMismatch && (
                  <p className="text-xs text-destructive">
                    ارز حساب مبدأ ({fromCurrency?.code ?? ""}) با حساب مقصد (
                    {toCurrencySel?.code ?? ""}) متفاوت است. فقط بین حساب‌های هم‌ارز انتقال انجام می‌شود.
                  </p>
                )}
              </div>
            </div>

            {/* مبلغ و توضیحات */}
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">مبلغ</Label>
              <div className="relative">
                <Input
                  id="transfer-amount"
                  type="number"
                  step="any"
                  min="0"
                  dir="ltr"
                  placeholder="0"
                  className="pl-14"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {fromCurrency && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {fromCurrency.code}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-description">توضیحات</Label>
              <Textarea
                id="transfer-description"
                placeholder="مثلاً: انتقال جهت مصارف نقدی ماهانه"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">{formError}</p>
            )}

            {/* دکمه‌ها */}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {submitting ? "در حال انتقال..." : "ثبت انتقال"}
=======
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="from-account">از حساب</Label>

                <Select
                  value={form.fromAccountId}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      fromAccountId: v ?? "",
                      toAccountId:
                        f.toAccountId === v ? "" : f.toAccountId,
                    }))
                  }
                >
                  <SelectTrigger id="from-account" className="w-full">
                    <SelectValue placeholder="انتخاب حساب مبدأ">
                      {(value) =>
                        accounts.find((a) => a.id === value)?.name ??
                        "انتخاب حساب مبدأ"
                      }
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {accounts.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        حسابی موجود نیست
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="to-account">به حساب</Label>
                <Select
                  value={form.toAccountId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, toAccountId: v ?? "" }))
                  }
                  disabled={!fromAccount}
                >
                  <SelectTrigger id="to-account" className="w-full">
                    <SelectValue
                      placeholder={
                        fromAccount
                          ? "انتخاب حساب مقصد"
                          : "ابتدا حساب مبدأ را انتخاب کنید"
                      }
                    >
                      {(value) =>
                        accounts.find((a) => a.id === value)?.name ??
                        (fromAccount
                          ? "انتخاب حساب مقصد"
                          : "ابتدا حساب مبدأ را انتخاب کنید")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {!fromAccount ? (
                      <SelectItem value="__none__" disabled>
                        ابتدا حساب مبدأ را انتخاب کنید
                      </SelectItem>
                    ) : toCandidates.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        حساب دیگری برای مقصد وجود ندارد
                      </SelectItem>
                    ) : (
                      toCandidates.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                          {/* ({account.currencyCode}) */}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="transfer-amount">مبلغ</Label>
              <div className="relative">
                <Input
                  id="transfer-amount"
                  type="number"
                  step="any"
                  dir="ltr"
                  placeholder="0"
                  className="pl-14"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                />
                {fromAccount && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {fromAccount.currencyCode}
                  </span>
                )}
              </div>
            </div>

            {needsExchangeRate && (
              <div className="space-y-2 text-right rounded-md border p-3">
                <Label htmlFor="exchange-rate">
                  نرخ ارز (هر {fromAccount?.currencyCode} معادل چند{" "}
                  {toAccount?.currencyCode})
                </Label>
                <Input
                  id="exchange-rate"
                  type="number"
                  step="any"
                  dir="ltr"
                  placeholder="0"
                  value={form.exchangeRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, exchangeRate: e.target.value }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ۱ {fromAccount?.currencyCode} = {toNumber(form.exchangeRate)}{" "}
                  {toAccount?.currencyCode}
                </p>
              </div>
            )}

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <DialogClose render={<Button type="button" variant="outline" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {saving ? "در حال انجام انتقال..." : "ثبت انتقال"}
>>>>>>> dev
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
