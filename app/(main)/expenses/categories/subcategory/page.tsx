"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, FolderTree, Tags, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  deleteExpenseCategory,
  type ExpenseCategory,
} from "@/services/expense-category.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  parentId: "",
  name: "",
  isActive: true,
};

export default function ExpenseSubCategoriesPage() {
  return (
    <ToastProvider>
      <ExpenseSubCategoriesContent />
    </ToastProvider>
  );
}

function ExpenseSubCategoriesContent() {
  const toast = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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

  const subCategories = useMemo(() => {
    return categories.filter((c) => c.parentId);
  }, [categories]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.parentId) {
      setFormError("دسته‌بندی والد را انتخاب کنید");
      return;
    }
    if (!form.name.trim()) {
      setFormError("نام زیردسته الزامی است");
      return;
    }

    setSaving(true);
    try {
      const created = await createExpenseCategory({
        name: form.name.trim(),
        parentId: form.parentId,
      });
      setCategories((prev) => [created, ...prev]);
      setForm(emptyForm);
      toast.success("زیردسته جدید با موفقیت ثبت شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت زیردسته ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: ExpenseCategory) {
    setDeletingId(category.id);
    try {
      await deleteExpenseCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success("زیردسته با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف زیردسته ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="زیردسته مصارف"
        description="افزودن زیردسته‌های مصارف به‌عنوان زیرمجموعه دسته‌بندی‌ها"
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2 text-right">
              <Label htmlFor="subcategory-parent">دسته‌بندی والد</Label>
              <Select
                value={form.parentId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, parentId: v ?? "" }))
                }
              >
                <SelectTrigger id="subcategory-parent" className="w-full">
                  <SelectValue placeholder="ابتدا یک دسته‌بندی والد انتخاب کنید">
                    {form.parentId ? nameById.get(form.parentId) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="subcategory-name">نام زیردسته</Label>
              <Input
                id="subcategory-name"
                placeholder="مثلاً: مارکر"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
          </div>

         

          {formError && (
            <p className="whitespace-pre-line text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <Plus data-icon="inline-start" />
            )}
            {saving ? "در حال ذخیره..." : "افزودن زیردسته"}
          </Button>
        </form>
      </Card>

      <Card className="mt-6 p-0">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold text-foreground">
            زیردسته‌های موجود
            {!loading && (
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                ({subCategories.length.toLocaleString("fa-AF")} مورد)
              </span>
            )}
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">نام زیردسته</TableHead>
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
            ) : subCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  زیردسته‌ای ثبت نشده است
                </TableCell>
              </TableRow>
            ) : (
              subCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Tags className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {category.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                      {nameById.get(category.parentId ?? "") ?? "—"}
                    </span>
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
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === category.id}
                        onClick={() => handleDelete(category)}
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
    </div>
  );
}