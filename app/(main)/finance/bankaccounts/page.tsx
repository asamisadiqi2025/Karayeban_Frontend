"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Landmark, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  type BankAccount,
  type BankAccountType,
} from "@/services/bank-account.service";
import type { Currency } from "./types";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

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

const emptyForm = {
  name: "",
  type: "CASH" as BankAccountType,
  currencyId: "",
  openingAmount: "",
  bankName: "",
  accountNumber: "",
};

export default function AccountsPage() {
  return (
    <ToastProvider>
      <AccountsPageContent />
    </ToastProvider>
  );
}

function AccountsPageContent() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | BankAccountType>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // حساب‌ها و ارزها مستقل از هم بارگذاری می‌شوند تا خطای یکی مانع خواندن دیگری نشود
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [accountsResult, currenciesResult] = await Promise.allSettled([
      fetchBankAccounts(),
      fetchAddedCurrencies(),
    ]);
    if (accountsResult.status === "fulfilled") {
      setAccounts(Array.isArray(accountsResult.value) ? accountsResult.value : []);
    } else {
      setError(extractApiErrorMessage(accountsResult.reason, "خطا در دریافت حساب‌ها"));
    }
    setCurrencies(
      currenciesResult.status === "fulfilled"
        ? (Array.isArray(currenciesResult.value) ? currenciesResult.value : []).map(toCurrency)
        : []
    );
    setCurrenciesLoading(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([fetchBankAccounts(), fetchAddedCurrencies()]).then(
      ([accountsResult, currenciesResult]) => {
        if (cancelled) return;
        if (accountsResult.status === "fulfilled") {
          setAccounts(Array.isArray(accountsResult.value) ? accountsResult.value : []);
        } else {
          setError(extractApiErrorMessage(accountsResult.reason, "خطا در دریافت حساب‌ها"));
        }
        setCurrencies(
          currenciesResult.status === "fulfilled"
            ? (Array.isArray(currenciesResult.value) ? currenciesResult.value : []).map(toCurrency)
            : []
        );
        setCurrenciesLoading(false);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchesFilter = filter === "all" || a.type === filter;
      const matchesQuery =
        query.trim() === "" ||
        a.name.includes(query) ||
        a.currencyCode?.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [accounts, query, filter]);

  const selectedCurrency = currencies.find((c) => c.id === form.currencyId);

  function getCurrency(id: string): Currency | undefined {
    return currencies.find((c) => c.id === id);
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(account: BankAccount) {
    setEditingId(account.id);
    setForm({
      name: account.name,
      type: account.type,
      currencyId: account.currencyId,
      openingAmount: String(account.openingBalance),
      bankName: account.bankName ?? "",
      accountNumber: account.accountNumber ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(account: BankAccount) {
    if (account.openingBalance !== 0) {
      toast.error(
        "حذف حساب دارای مبلغ افتتاحیه مجاز نیست؛ ابتدا حساب را به موجودی صفر برسانید"
      );
      return;
    }
    setDeletingId(account.id);
    try {
      await deleteBankAccount(account.id);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      toast.success("حساب با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف حساب ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.currencyId) {
      setFormError("انتخاب ارز حساب الزامی است");
      return;
    }
    // if (toNumber(form.openingAmount) <= 0) {
    //   setFormError("مبلغ افتتاحیه باید بیشتر از صفر باشد");
    //   return;
    // }
    if (form.type === "BANK" && !form.bankName.trim()) {
      setFormError("برای حساب بانکی، نام بانک الزامی است");
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      currencyId: form.currencyId,
      openingBalance: { amount: toNumber(form.openingAmount) },
      ...(form.type === "BANK"
        ? { bankName: form.bankName.trim(), accountNumber: form.accountNumber.trim() || null }
        : {}),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateBankAccount(editingId, {
          name: payload.name,
          ...(payload.type === "BANK"
            ? { bankName: payload.bankName, accountNumber: payload.accountNumber }
            : { bankName: null, accountNumber: null }),
        });
        setAccounts((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        toast.success("حساب با موفقیت بروزرسانی شد");
      } else {
        const created = await createBankAccount(payload);
        setAccounts((prev) => [created, ...prev]);
        toast.success("حساب جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت حساب ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  function formatAmount(amount: number, currencyCode?: string) {
    const value = amount.toLocaleString("fa-IR");
    return currencyCode ? `${value} ${currencyCode}` : value;
  }

  return (
    <div>
      <PageHeader
        title="حساب‌ها"
        description="مدیریت حساب‌های نقدی و بانکی مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن حساب جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه حساب‌ها
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
                placeholder="جستجوی نام حساب یا ارز..."
                className="w-full pr-8 sm:w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="CASH">نقد</TabsTrigger>
                <TabsTrigger value="BANK">بانکی</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام حساب</TableHead>
              <TableHead>نوع</TableHead>
              <TableHead>ارز</TableHead>
              <TableHead>شماره حساب / بانک</TableHead>
              <TableHead>مبلغ افتتاحیه</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
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
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  حسابی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((account) => {
                const currency = getCurrency(account.currencyId);
                return (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openEditDialog(account)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            account.type === "CASH"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          }`}
                        >
                          <Landmark className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.type === "CASH" ? "secondary" : "outline"}>
                        {account.type === "CASH" ? "نقد" : "بانکی"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        dir="ltr"
                        className="inline-flex min-w-[52px] items-center justify-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground"
                      >
                        {currency?.code ?? account.currencyCode ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell dir="ltr" className="max-w-56 truncate text-muted-foreground">
                      {account.type === "BANK"
                        ? `${account.accountNumber ?? "—"} — ${account.bankName ?? "—"}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium tabular-nums text-foreground">
                        {formatAmount(account.openingBalance, currency?.code ?? account.currencyCode)}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(account);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deletingId === account.id || account.openingBalance !== 0}
                          title={
                            account.openingBalance !== 0
                              ? "حذف حساب دارای افتتاحیه مجاز نیست"
                              : "حذف حساب"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(account);
                          }}
                        >
                          {deletingId === account.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال ایجاد / ویرایش حساب */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش حساب" : "ایجاد حساب"}</DialogTitle>
            <DialogDescription>
              اطلاعات حساب نقدی یا بانکی را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
              {/* نام حساب */}
              <div className="space-y-2">
                <Label htmlFor="account-name">نام حساب</Label>
                <Input
                  id="account-name"
                  placeholder="مثلاً: بانک دالر چهارسوق مشهد"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* نوع حساب */}
                <div className="space-y-2">
                  <Label htmlFor="account-type">نوع حساب</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as BankAccountType }))}
                  >
                    <SelectTrigger id="account-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">نقد</SelectItem>
                      <SelectItem value="BANK">حساب بانکی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ارز حساب */}
                <div className="space-y-2">
                  <Label htmlFor="account-currency">ارز حساب</Label>
                  <Select
                    value={form.currencyId}
                    onValueChange={(v) => setForm((f) => ({ ...f, currencyId: v ?? "" }))}
                  >
                    <SelectTrigger id="account-currency" className="w-full">
                      <SelectValue
                        placeholder={
                          currenciesLoading
                            ? "در حال بارگذاری..."
                            : currencies.length
                              ? "انتخاب ارز"
                              : "ارزی در سیستم تعریف نشده"
                        }
                      >
                        {selectedCurrency
                          ? `${selectedCurrency.name} (${selectedCurrency.code})`
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.length === 0 && !currenciesLoading && (
                        <SelectItem value="__none__" disabled>
                          ارزی در سیستم تعریف نشده — ابتدا از تنظیمات ارز، ارز اضافه کنید
                        </SelectItem>
                      )}
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* شماره حساب و نام بانک — فقط برای نوع «حساب بانکی» */}
              {form.type === "BANK" && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">نام بانک</Label>
                    <Input
                      id="bank-name"
                      placeholder="مثلاً: بانک ملی افغان"
                      value={form.bankName}
                      onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">شماره حساب</Label>
                    <Input
                      id="account-number"
                      dir="ltr"
                      placeholder="مثلاً: AF-3390214 (اختیاری)"
                      value={form.accountNumber}
                      onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* افتتاحیه حساب */}
            <div className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="opening-amount" className="text-sm font-semibold text-foreground">
                  مبلغ افتتاحیه
                </Label>
                {selectedCurrency && (
                  <Badge variant="outline" dir="ltr">
                    {selectedCurrency.code}
                  </Badge>
                )}
              </div>
              <Input
                id="opening-amount"
                type="number"
                step="any"
                min="0"
                dir="ltr"
                placeholder="0"
                value={form.openingAmount}
                onChange={(e) => setForm((f) => ({ ...f, openingAmount: e.target.value }))}
                // required
              />
              <p className="text-xs text-muted-foreground">
                موجودی اولیه‌ی حساب هنگام افتتاح به این ارز
              </p>
            </div>

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "ثبت حساب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}