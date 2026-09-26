"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Ruler, Loader2 } from "lucide-react";

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
  fetchInventoryUnits,
  createInventoryUnit,
  updateInventoryUnit,
  deleteInventoryUnit,
  type InventoryUnit,
} from "@/services/inventory-unit.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  name: "",
  symbol: "",
  isActive: true,
};

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-AF", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function InventoryUnitsPage() {
  return (
    <ToastProvider>
      <InventoryUnitsContent />
    </ToastProvider>
  );
}

function InventoryUnitsContent() {
  const toast = useToast();
  const [units, setUnits] = useState<InventoryUnit[]>([]);
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
      const result = await fetchInventoryUnits();
      setUnits(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت واحدات"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchInventoryUnits()
      .then((result) => {
        if (cancelled) return;
        setUnits(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت واحدات"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return units.filter((u) => {
      const matchesQuery =
        query.trim() === "" ||
        u.name.includes(query) ||
        u.symbol.includes(query);
      return matchesQuery;
    });
  }, [units, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(unit: InventoryUnit) {
    setEditingId(unit.id);
    setForm({
      name: unit.name,
      symbol: unit.symbol,
      isActive: unit.isActive,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(unit: InventoryUnit) {
    setDeletingId(unit.id);
    try {
      await deleteInventoryUnit(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      toast.success("واحد با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف واحد ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("نام واحد الزامی است");
      return;
    }
    if (!form.symbol.trim()) {
      setFormError("نماد واحد الزامی است");
      return;
    }

    const payload = {
      name: form.name.trim(),
      symbol: form.symbol.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateInventoryUnit(editingId, {
          ...payload,
          isActive: form.isActive,
        });
        setUnits((prev) =>
          prev.map((u) => (u.id === editingId ? updated : u)),
        );
        toast.success("واحد با موفقیت بروزرسانی شد");
      } else {
        const created = await createInventoryUnit(payload);
        setUnits((prev) => [created, ...prev]);
        toast.success("واحد جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت واحد ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="واحدات اندازه‌گیری"
        description="مدیریت واحدات اندازه‌گیری برای اجناس گدام"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن واحد جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه واحدات
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
                placeholder="جستجوی نام یا نماد واحد..."
                className="w-full pr-8 sm:w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">نام واحد</TableHead>
              <TableHead className="text-right">نماد</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-right">تاریخ ایجاد</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
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
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  واحدی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((unit) => (
                <TableRow
                  key={unit.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(unit)}
                >
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {unit.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    dir="ltr"
                    className="text-right text-muted-foreground"
                  >
                    {unit.symbol}
                  </TableCell>
                  <TableCell className="text-right">
                    {unit.isActive ? (
                      <Badge variant="success">فعال</Badge>
                    ) : (
                      <Badge variant="outline">غیرفعال</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(unit.createdAt)}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(unit);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === unit.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(unit);
                        }}
                      >
                        {deletingId === unit.id ? (
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

      {/* مودال افزودن / ویرایش واحد */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle className="text-right">
                {editingId ? "ویرایش واحد" : "افزودن واحد جدید"}
              </DialogTitle>
              <DialogDescription>
                نام و نماد واحد اندازه‌گیری را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="unit-name">نام واحد</Label>
                  <Input
                    id="unit-name"
                    placeholder="مثلاً: کیلوگرام"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="unit-symbol">نماد</Label>
                  <Input
                    id="unit-symbol"
                    dir="ltr"
                    placeholder="مثلاً: kg"
                    value={form.symbol}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, symbol: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3.5">
                <input
                  id="unit-active"
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
                    در صورت غیرفعال بودن، واحد در انتخاب‌ها نمایش داده نمی‌شود
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
                    : "افزودن واحد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}