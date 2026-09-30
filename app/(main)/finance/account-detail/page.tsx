"use client";

import { useEffect, useState } from "react";
import { Filter, Landmark, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchBankAccount,
  fetchBankAccounts,
  type BankAccount,
} from "@/services/bank-account.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const ALL = "all";

function formatAmount(value: number): string {
  return value.toLocaleString("fa-AF", { maximumFractionDigits: 4 });
}

export default function AccountDetailPage() {
  return (
    <ToastProvider>
      <AccountDetailPageContent />
    </ToastProvider>
  );
}

function AccountDetailPageContent() {
  const toast = useToast();

  const [accountId, setAccountId] = useState<string>(ALL);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  /** دریافت اطلاعات حساب انتخاب‌شده */
  async function load() {
    setLoading(true);
    setError(null);
    try {
      setAccount(await fetchBankAccount(accountId));
    } catch (err) {
      setAccount(null);
      setError(extractApiErrorMessage(err, "خطا در دریافت اطلاعات حساب"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (accountId === ALL) {
      setFormError("یک حساب را انتخاب کنید");
      return;
    }

    await load();
  }

  function handleReset() {
    setAccountId(ALL);
    setAccount(null);
    setError(null);
    setFormError(null);
  }

  return (
    <div>
      <PageHeader
        title="جزئیات حساب"
        description="مشاهده مشخصات کامل یک حساب نقدی یا بانکی"
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
              <Select value={accountId} onValueChange={(v) => setAccountId(v ?? ALL)}>
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
          </div>

          {formError && (
            <p className="mt-4 whitespace-pre-line text-sm text-destructive">{formError}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {loading ? "در حال دریافت..." : "نمایش حساب"}
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
      ) : account ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-[13.5px] font-medium text-muted-foreground">نام حساب</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                <Landmark className="h-4 w-4 text-sky-600" />
                {account.name || "—"}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-[13.5px] font-medium text-muted-foreground">نوع حساب</p>
              <div className="mt-2">
                <Badge variant={account.type === "CASH" ? "secondary" : "outline"}>
                  {account.type === "CASH" ? "نقد" : "بانکی"}
                </Badge>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-[13.5px] font-medium text-muted-foreground">موجودی افتتاحیه</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground" dir="ltr">
                {formatAmount(account.openingBalance)}
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">مشخصات حساب</h2>

            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">شناسه حساب</dt>
                <dd className="text-sm font-medium text-foreground" dir="ltr">
                  {account.id || "—"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">ارز</dt>
                <dd className="text-sm font-medium text-foreground" dir="ltr">
                  {account.currencyCode || "—"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">نام بانک</dt>
                <dd className="text-sm font-medium text-foreground">
                  {account.bankName || "—"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">شماره حساب</dt>
                <dd className="text-sm font-medium text-foreground" dir="ltr">
                  {account.accountNumber || "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
