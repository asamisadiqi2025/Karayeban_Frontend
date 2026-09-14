"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeftRight, Loader2 } from "lucide-react";

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

import {
  fetchBankAccounts,
  fetchTransfers,
  transferBetweenAccounts,
  type BankAccount,
  type TransferRecord,
} from "@/services/bank-account.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(amount: number, currencyCode?: string) {
  const value = amount.toLocaleString("fa-IR");
  return currencyCode ? `${value} ${currencyCode}` : value;
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

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingAccounts(true);
    setLoadingTransfers(true);
    setError(null);

    try {
      const [accountsResult, transfersResult] = await Promise.all([
        fetchBankAccounts(),
        fetchTransfers(),
      ]);

      setAccounts(Array.isArray(accountsResult) ? accountsResult : []);
      setTransfers(Array.isArray(transfersResult) ? transfersResult : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت اطلاعات"));
    } finally {
      setLoadingAccounts(false);
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchBankAccounts(), fetchTransfers()])
      .then(([accountsResult, transfersResult]) => {
        if (cancelled) return;

        setAccounts(Array.isArray(accountsResult) ? accountsResult : []);
        setTransfers(Array.isArray(transfersResult) ? transfersResult : []);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(extractApiErrorMessage(err, "خطا در دریافت اطلاعات"));
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAccounts(false);
        setLoadingTransfers(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fromAccount = useMemo(
    () => accounts.find((account) => account.id === form.fromAccountId),
    [accounts, form.fromAccountId],
  );

  const toAccount = useMemo(
    () => accounts.find((account) => account.id === form.toAccountId),
    [accounts, form.toAccountId],
  );

  const toCandidates = useMemo(
    () =>
      accounts.filter(
        (account) => account.id !== fromAccount?.id,
      ),
    [accounts, fromAccount],
  );

  const needsExchangeRate =
    !!fromAccount &&
    !!toAccount &&
    fromAccount.currencyId !== toAccount.currencyId;

  function openCreateDialog() {
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    if (!fromAccount || !toAccount) {
      setFormError("حساب مبدأ یا مقصد پیدا نشد");
      return;
    }

    const amount = toNumber(form.amount);

    if (amount <= 0) {
      setFormError("مبلغ انتقال باید بیشتر از صفر باشد");
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

      toast.success("انتقال با موفقیت انجام شد");

      setDialogOpen(false);
      setForm(emptyForm);

      await load();
    } catch (err) {
      toast.error(
        extractApiErrorMessage(err, "انجام انتقال ناموفق بود"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="انتقال بین حساب‌ها"
        description="انتقال وجه بین دو حساب با ارز یکسان یا ارزهای متفاوت"
        action={
          <Button
            onClick={openCreateDialog}
            disabled={!accounts.length || loadingAccounts}
          >
            <Plus data-icon="inline-start" />
            انتقال جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              انتقال‌های انجام‌شده
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                ({transfers.length.toLocaleString("fa-AF")} مورد)
              </span>
            </h2>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>از حساب</TableHead>
              <TableHead>به حساب</TableHead>
              <TableHead>مبلغ</TableHead>
              <TableHead>نرخ ارز</TableHead>
              <TableHead>تاریخ</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loadingAccounts || loadingTransfers ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error && transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={load}
                    >
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : transfers.length === 0 ? (
              <TableRow>
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
                  (account) => account.id === transfer.fromAccountId,
                );
                const to = accounts.find(
                  (account) => account.id === transfer.toAccountId,
                );

                return (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>

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
                      {formatAmount(
                        transfer.amount,
                        from?.currencyCode,
                      )}
                    </TableCell>

                    <TableCell
                      dir="ltr"
                      className="tabular-nums text-muted-foreground"
                    >
                      {transfer.exchangeRate
                        ? `${transfer.exchangeRate} ${to?.currencyCode ?? ""}`
                        : "—"}
                    </TableCell>

                    <TableCell
                      dir="ltr"
                      className="text-muted-foreground"
                    >
                      {new Date(
                        transfer.createdAt,
                      ).toLocaleDateString("fa-IR")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="text-right">
            <DialogTitle>انتقال بین حساب‌ها</DialogTitle>
            <DialogDescription>
              مبلغ را بین دو حساب با ارز یکسان یا متفاوت منتقل کنید.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="from-account">از حساب</Label>

                <Select
                  value={form.fromAccountId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fromAccountId: value ?? "",
                      toAccountId:
                        current.toAccountId === value
                          ? ""
                          : current.toAccountId,
                      exchangeRate: "",
                    }))
                  }
                >
                  <SelectTrigger id="from-account" className="w-full">
                    <SelectValue placeholder="انتخاب حساب مبدأ">
                      {(value) =>
                        accounts.find(
                          (account) => account.id === value,
                        )?.name ?? "انتخاب حساب مبدأ"
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
                        <SelectItem
                          key={account.id}
                          value={account.id}
                        >
                          {account.name}
                          {account.currencyCode
                            ? ` (${account.currencyCode})`
                            : ""}
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
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      toAccountId: value ?? "",
                      exchangeRate: "",
                    }))
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
                        accounts.find(
                          (account) => account.id === value,
                        )?.name ??
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
                        <SelectItem
                          key={account.id}
                          value={account.id}
                        >
                          {account.name}
                          {account.currencyCode
                            ? ` (${account.currencyCode})`
                            : ""}
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
                  min="0"
                  dir="ltr"
                  placeholder="0"
                  className="pl-14"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                  required
                />

                {fromAccount?.currencyCode && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {fromAccount.currencyCode}
                  </span>
                )}
              </div>
            </div>

            {needsExchangeRate && (
              <div className="space-y-2 rounded-md border p-3 text-right">
                <Label htmlFor="exchange-rate">
                  نرخ ارز (هر {fromAccount.currencyCode} معادل چند{" "}
                  {toAccount.currencyCode})
                </Label>

                <Input
                  id="exchange-rate"
                  type="number"
                  step="any"
                  min="0"
                  dir="ltr"
                  placeholder="0"
                  value={form.exchangeRate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      exchangeRate: e.target.value,
                    }))
                  }
                  required
                />

                <p className="text-xs text-muted-foreground">
                  ۱ {fromAccount.currencyCode} ={" "}
                  {toNumber(form.exchangeRate)}{" "}
                  {toAccount.currencyCode}
                </p>
              </div>
            )}

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <DialogClose
                render={
                  <Button type="button" variant="outline" />
                }
              >
                انصراف
              </DialogClose>

              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                )}
                {saving
                  ? "در حال انجام انتقال..."
                  : "ثبت انتقال"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
