"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Warehouse, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  fetchWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  type Warehouse as TWarehouse,
} from "@/services/warehouse.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  name: "",
  location: "",
  details: "",
};

export default function WarehousePage() {
  return (
    <ToastProvider>
      <WarehousePageContent />
    </ToastProvider>
  );
}

function WarehousePageContent() {
  const toast = useToast();
  const [warehouses, setWarehouses] = useState<TWarehouse[]>([]);
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
      const result = await fetchWarehouses();
      setWarehouses(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت گدام‌ها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchWarehouses()
      .then((result) => {
        if (cancelled) return;
        setWarehouses(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت گدام‌ها"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return warehouses.filter((w) => {
      const matchesQuery =
        query.trim() === "" ||
        w.name.includes(query) ||
        w.location.includes(query);
      return matchesQuery;
    });
  }, [warehouses, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(warehouse: TWarehouse) {
    setEditingId(warehouse.id);
    setForm({
      name: warehouse.name,
      location: warehouse.location,
      details: warehouse.details,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(warehouse: TWarehouse) {
    setDeletingId(warehouse.id);
    try {
      await deleteWarehouse(warehouse.id);
      setWarehouses((prev) => prev.filter((w) => w.id !== warehouse.id));
      toast.success("گدام با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف گدام ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("نام گدام الزامی است");
      return;
    }
    if (!form.location.trim()) {
      setFormError("موقعیت گدام الزامی است");
      return;
    }

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      details: form.details.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateWarehouse(editingId, payload);
        setWarehouses((prev) =>
          prev.map((w) => (w.id === editingId ? updated : w)),
        );
        toast.success("گدام با موفقیت بروزرسانی شد");
      } else {
        const created = await createWarehouse(payload);
        setWarehouses((prev) => [created, ...prev]);
        toast.success("گدام جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت گدام ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="گدام‌ها"
        description="مدیریت گدام‌ها"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            گدام جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه گدام‌ها
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
                placeholder="جستجوی گدام..."
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
              <TableHead className="text-right">نام گدام</TableHead>
              <TableHead className="text-right">موقعیت</TableHead>
              <TableHead className="text-right">جزییات</TableHead>
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
                  گدامی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((warehouse) => (
                <TableRow
                  key={warehouse.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(warehouse)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {warehouse.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {warehouse.location}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-muted-foreground">
                    {warehouse.details || "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(warehouse);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === warehouse.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(warehouse);
                        }}
                      >
                        {deletingId === warehouse.id ? (
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

      {/* مودال افزودن / ویرایش گدام */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>
                {editingId ? "ویرایش گدام" : "افزودن گدام جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات گدام را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="warehouse-name">نام گدام</Label>
                  <Input
                    id="warehouse-name"
                    placeholder="مثلاً: گدام بغل"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="warehouse-location">موقعیت</Label>
                  <Input
                    id="warehouse-location"
                    placeholder="مثلاً: طبقه هم کف"
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        location: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="warehouse-details">جزییات</Label>

                <Textarea
                  id="warehouse-details"
                  rows={4}
                  placeholder="توضیحات تکمیلی درباره این گدام"
                  value={form.details}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      details: e.target.value,
                    }))
                  }
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
                    : "افزودن گدام"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
