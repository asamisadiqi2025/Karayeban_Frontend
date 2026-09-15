"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Receipt, Loader2 } from "lucide-react";

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
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type Expense,
} from "@/services/expense.service";
import { fetchExpenseCategories, type ExpenseCategory } from "@/services/expense-category.service";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import { fetchBankAccounts, type BankAccount } from "@/services/bank-account.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  categoryId: "",
  amount: "",
  currencyId: "",
  accountId: "",
  description: "",
};

export default function ExpensesPage() {
  return (
    <ToastProvider>
      <ExpensesPageContent />
    </ToastProvider>
  );
}

function ExpensesPageContent() {
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchExpenses();
      setExpenses(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت مصارف"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchExpenses(),
      fetchExpenseCategories(),
      fetchAddedCurrencies(),
      fetchBankAccounts(),
    ]).then(([expResult, catResult, curResult, accResult]) => {
      if (cancelled) return;
      if (expResult.status === "fulfilled") {
        setExpenses(Array.isArray(expResult.value) ? expResult.value : []);
      } else {
        setError(extractApiErrorMessage(expResult.reason, "خطا در دریافت مصارف"));
      }
      if (catResult.status === "fulfilled") setCategories(catResult.value);
      if (curResult.status === "fulfilled") setCurrencies(curResult.value);
      if (accResult.status === "fulfilled") setAccounts(accResult.value);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return expenses.filter((e) =>
      query.trim() === "" || e.description.includes(query),
    );
  }, [expenses, query]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const currencyMap = useMemo(() => {
    const m = new Map<string, string>();
    currencies.forEach((c) => m.set(c.id, `${c.name} (${c.code})`));
    return m;
  }, [currencies]);

  const accountMap = useMemo(() => {
    const m = new Map<string, string>();
    accounts.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [accounts]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      categoryId: expense.categoryId,
      amount: String(expense.amount),
      currencyId: expense.currencyId,
      accountId: expense.accountId,
      description: expense.description,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(expense: Expense) {
    setDeletingId(expense.id);
    try {
      await deleteExpense(expense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
      toast.success("مصرف با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف مصرف ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.categoryId) { setFormError("دسته‌بندی را انتخاب کنید"); return; }
    if (!form.amount || Number(form.amount) <= 0) { setFormError("مبلغ را وارد کنید"); return; }
    if (!form.currencyId) { setFormError("واحد پولی را انتخاب کنید"); return; }
    if (!form.accountId) { setFormError("حساب را انتخاب کنید"); return; }
    if (!form.description.trim()) { setFormError("توضیحات الزامی است"); return; }

    const payload = {
      categoryId: form.categoryId,
      amount: Number(form.amount),
      currencyId: form.currencyId,
      accountId: form.accountId,
      description: form.description.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateExpense(editingId, payload);
        setExpenses((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
        toast.success("مصرف با موفقیت بروزرسانی شد");
      } else {
        const created = await createExpense(payload);
        setExpenses((prev) => [created, ...prev]);
        toast.success("مصرف جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت مصرف ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="مصارف"
        description="مدیریت مصارف"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            مصرف جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه مصارف
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
                placeholder="جستجوی مصرف..."
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
              <TableHead className="text-right">توضیحات</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead className="text-right">واحد پولی</TableHead>
              <TableHead className="text-right">دسته‌بندی</TableHead>
              <TableHead className="text-right">حساب</TableHead>
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
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  مصرفی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(expense)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {expense.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">
                    {expense.amount.toLocaleString("fa-AF")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.currency?.code ?? currencyMap.get(expense.currencyId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.category?.name ?? categoryMap.get(expense.categoryId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.account?.name ?? accountMap.get(expense.accountId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(expense);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === expense.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(expense);
                        }}
                      >
                        {deletingId === expense.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>
                {editingId ? "ویرایش مصرف" : "افزودن مصرف جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات مصرف را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label>دسته‌بندی</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب دسته‌بندی">
                        {(value) => categories.find((c) => c.id === value)?.name ?? "انتخاب دسته‌بندی"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="expense-amount">مبلغ</Label>
                  <Input
                    id="expense-amount"
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
                  <Label>واحد پولی</Label>
                  <Select value={form.currencyId} onValueChange={(v) => setForm((f) => ({ ...f, currencyId: v ?? "" }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب واحد پولی">
                        {(value) => currencies.find((c) => c.id === value) ? `${currencies.find((c) => c.id === value)!.name} (${currencies.find((c) => c.id === value)!.code})` : "انتخاب واحد پولی"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="expense-description">توضیحات</Label>
                <Textarea
                  id="expense-description"
                  rows={3}
                  placeholder="توضیحات مصرف"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
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
                  : editingId
                    ? "ذخیره تغییرات"
                    : "افزودن مصرف"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
