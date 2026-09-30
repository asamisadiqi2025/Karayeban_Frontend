"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createAccountTransaction,
  fetchBankAccounts,
  type AccountTransactionType,
  type BankAccount,
} from "@/services/bank-account.service";
import { fetchMyMarket } from "@/services/market.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const ALL = "all";

const transactionTypes: { value: AccountTransactionType; label: string }[] = [
  { value: "DEPOSIT", label: "واریز" },
  { value: "WITHDRAWAL", label: "برداشت" },
];

const emptyForm = {
  accountId: ALL,
  type: "DEPOSIT" as AccountTransactionType,
  amount: "",
  exchangeRate: "",
  details: "",
};

function toNumber(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value: string): string {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString("fa-AF", {
    maximumFractionDigits: 4,
  });
}

export default function AccountTransactionsPage() {
  return (
    <ToastProvider>
      <AccountTransactionsPageContent />
    </ToastProvider>
  );
}

function AccountTransactionsPageContent() {
  const toast = useToast();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [baseCurrencyId, setBaseCurrencyId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchBankAccounts(), fetchMyMarket()]).then(
      ([accountsResult, marketResult]) => {
        if (cancelled) return;
        if (accountsResult.status === "fulfilled") {
          setAccounts(accountsResult.value);
        } else {
          toast.error(
            extractApiErrorMessage(accountsResult.reason, "خطا در دریافت لیست حساب‌ها"),
          );
        }
        if (marketResult.status === "fulfilled") {
          setBaseCurrencyId(marketResult.value.baseCurrencyId);
        }
        setAccountsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === form.accountId) ?? null,
    [accounts, form.accountId],
  );

  /** وقتی ارز حساب با ارز پایه مارکت یکی نیست، نرخ تبدیل الزامی است */
  const needsExchangeRate = useMemo(() => {
    if (!selectedAccount || !baseCurrencyId) return false;
    return selectedAccount.currencyId !== baseCurrencyId;
  }, [selectedAccount, baseCurrencyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLastMessage(null);

    if (form.accountId === ALL) {
      setFormError("یک حساب را انتخاب کنید");
      return;
    }

    const amount = toNumber(form.amount);
    if (form.amount.trim() === "" || amount <= 0) {
      setFormError("مبلغ باید عددی بزرگ‌تر از صفر باشد");
      return;
    }

    let exchangeRate: number | undefined;
    if (needsExchangeRate) {
      exchangeRate = toNumber(form.exchangeRate);
      if (form.exchangeRate.trim() === "" || exchangeRate <= 0) {
        setFormError("نرخ تبدیل باید عددی بزرگ‌تر از صفر باشد");
        return;
      }
    }

    setSaving(true);
    try {
      const result = await createAccountTransaction(form.accountId, {
        type: form.type,
        amount,
        ...(exchangeRate !== undefined ? { exchangeRate } : {}),
        ...(form.details.trim() ? { details: form.details.trim() } : {}),
      });

      const label = transactionTypes.find((t) => t.value === form.type)?.label ?? form.type;
      setLastMessage(
        `${label} با موفقیت ثبت شد؛ موجودی جدید حساب «${result.account.name}»: ${formatNumber(result.account.balance)}`,
      );
      setForm({ ...emptyForm, accountId: form.accountId, type: form.type });
      toast.success(`${label} با موفقیت ثبت شد`);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت تراکنش ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="تراکنش‌ها"
        description="ثبت واریز یا برداشت روی حساب‌های نقدی و بانکی"
      />

      <Card className="mx-auto max-w-2xl p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">ثبت تراکنش جدید</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>حساب</Label>
              <Select
                value={form.accountId}
                onValueChange={(v) => setForm((f) => ({ ...f, accountId: v ?? ALL }))}
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

            <div className="space-y-1.5">
              <Label>نوع تراکنش</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: (v ?? "DEPOSIT") as AccountTransactionType }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) =>
                      transactionTypes.find((t) => t.value === value)?.label ?? "انتخاب نوع"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>مبلغ</Label>
              <Input
                type="number"
                step="any"
                min="0"
                dir="ltr"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>

            {needsExchangeRate && (
              <div className="space-y-1.5">
                <Label>نرخ تبدیل</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  dir="ltr"
                  placeholder="0"
                  value={form.exchangeRate}
                  onChange={(e) => setForm((f) => ({ ...f, exchangeRate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  ارز این حساب با ارز پایه فرق دارد؛ نرخ تبدیل الزامی است
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>توضیحات</Label>
            <Textarea
              rows={3}
              placeholder="مثلاً: واریز نقدی — نرخ امروز صرافی"
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
            />
          </div>

          {formError && (
            <p className="whitespace-pre-line text-sm text-destructive">{formError}</p>
          )}

          {lastMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{lastMessage}</span>
            </div>
          )}

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {saving ? "در حال ثبت..." : "ثبت تراکنش"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
