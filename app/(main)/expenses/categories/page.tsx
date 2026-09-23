"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Tag, FolderTree, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  fetchExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseCategory,
} from "@/services/expense-category.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  name: "",
  isActive: true,
};

export default function ExpenseCategoriesPage() {
  return (
    <ToastProvider>
      <ExpenseCategoriesPageContent />
    </ToastProvider>
  );
}

function ExpenseCategoriesPageContent() {
  const toast = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
      const result = await fetchExpenseCategories();
      setCategories(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت دسته‌بندی‌ها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchExpenseCategories()
      .then((result) => {
        if (cancelled) return;
        setCategories(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت دسته‌بندی‌ها"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return categories.filter((c) =>
      query.trim() === "" || c.name.includes(query),
    );
  }, [categories, query]);

  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: ExpenseCategory) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      isActive: category.isActive,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(category: ExpenseCategory) {
    setDeletingId(category.id);
    try {
      await deleteExpenseCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success("دسته‌بندی با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف دسته‌بندی ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("نام دسته‌بندی الزامی است");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateExpenseCategory(editingId, {
          name: form.name.trim(),
          isActive: form.isActive,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)),
        );
        toast.success("دسته‌بندی با موفقیت بروزرسانی شد");
      } else {
        const created = await createExpenseCategory({
          name: form.name.trim(),
        });
        setCategories((prev) => [created, ...prev]);
        toast.success("دسته‌بندی جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت دسته‌بندی ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="دسته‌بندی مصارف"
        description="مدیریت دسته‌بندی‌های سلسله‌مراتبی مصارف"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            دسته‌بندی جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه دسته‌بندی‌ها
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
                placeholder="جستجوی دسته‌بندی..."
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
              <TableHead className="text-right">نام دسته‌بندی</TableHead>
              <TableHead className="text-right">دسته‌بندی والد</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10">
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
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  دسته‌بندی‌ای یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((category) => (
                <TableRow
                  key={category.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(category)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {category.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {category.parentId ? (
                      <span className="flex items-center gap-1.5">
                        <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                        {parentNameById.get(category.parentId) ?? "—"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">بدون والد</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {category.isActive ? (
                      <Badge variant="success">فعال</Badge>
                    ) : (
                      <Badge variant="outline">غیرفعال</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(category);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === category.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category);
                        }}
                      >
                        {deletingId === category.id ? (
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
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle className="text-right">
                {editingId ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات دسته‌بندی را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2 text-right">
                <Label htmlFor="category-name">نام دسته‌بندی</Label>
                <Input
                  id="category-name"
                  placeholder="مثلاً: مارکر"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3.5">
                <input
                  id="category-active"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                <div className="space-y-0.5">
                  <span className="block text-sm font-medium text-foreground">
                    وضعیت فعال
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    در صورت غیرفعال بودن، دسته‌بندی در انتخاب‌ها نمایش داده
                    نمی‌شود
                  </span>
                </div>
              </label>
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
                    : "افزودن دسته‌بندی"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}