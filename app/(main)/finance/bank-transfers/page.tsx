"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, ArrowLeftRight, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
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

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCurrency(currency: AddedCurrency): Currency {
  return {
    id: currency.id,
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol ?? null,
  };
}

export default function AccountTransfersPage() {
  return (
    <ToastProvider>
      <AccountTransfersPageContent />
    </ToastProvider>
  );
}

function AccountTransfersPageContent() {
  const toast = useToast();

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
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
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
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setDescription("");
    setSameAccountError(false);
    setCurrencyMismatch(false);
    setFormError(null);
    setDialogOpen(true);
  }

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
    }
  }

  return (
    <div>
      <PageHeader
        title="انتقال بین حساب‌ها"
        description="انتقال وجه بین حساب‌های هم‌ارز"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            انتقال جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">انتقال‌های اخیر</h2>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>از حساب</TableHead>
              <TableHead>به حساب</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button variant="outline" size="sm" onClick={reload}>
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : transfers.length === 0 ? (
              <TableRow>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{from?.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{to?.name ?? "—"}</TableCell>
                    <TableCell dir="ltr" className="text-muted-foreground">
                      {amount.toLocaleString("fa-IR")} {fc?.code ?? ""}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال انتقال حساب */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>انتقال بین حساب‌ها</DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر را از یک حساب به حساب هم‌ارز دیگر انتقال دهید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
