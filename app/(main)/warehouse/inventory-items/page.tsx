"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Package, Loader2 } from "lucide-react";

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
  fetchInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
} from "@/services/inventory-item.service";
import { fetchWarehouses, type Warehouse } from "@/services/warehouse.service";
import { fetchInventoryCategories, type InventoryCategory } from "@/services/inventory-category.service";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  name: "",
  unit: "",
  warehouseId: "",
  currencyId: "",
  categoryId: "",
  details: "",
  openingStockQuantity: "",
  openingStockUnitCost: "",
  openingStockNotes: "",
};

export default function InventoryItemsPage() {
  return (
    <ToastProvider>
      <InventoryItemsPageContent />
    </ToastProvider>
  );
}

function InventoryItemsPageContent() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);

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
      const result = await fetchInventoryItems();
      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت اجناس"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchInventoryItems(),
      fetchWarehouses(),
      fetchInventoryCategories(),
      fetchAddedCurrencies(),
    ]).then(([itemsResult, whResult, catResult, curResult]) => {
      if (cancelled) return;
      if (itemsResult.status === "fulfilled") {
        setItems(Array.isArray(itemsResult.value) ? itemsResult.value : []);
      } else {
        setError(extractApiErrorMessage(itemsResult.reason, "خطا در دریافت اجناس"));
      }
      if (whResult.status === "fulfilled") setWarehouses(whResult.value);
      if (catResult.status === "fulfilled") setCategories(catResult.value);
      if (curResult.status === "fulfilled") setCurrencies(curResult.value);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      query.trim() === "" || item.name.includes(query) || item.unit.includes(query),
    );
  }, [items, query]);

  const warehouseMap = useMemo(() => {
    const m = new Map<string, string>();
    warehouses.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [warehouses]);

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

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      unit: item.unit,
      warehouseId: item.warehouseId,
      currencyId: item.currencyId,
      categoryId: item.categoryId,
      details: item.details,
      openingStockQuantity: String(item.openingStock.quantity ?? ""),
      openingStockUnitCost: String(item.openingStock.unitCost ?? ""),
      openingStockNotes: item.openingStock.notes ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(item: InventoryItem) {
    setDeletingId(item.id);
    try {
      await deleteInventoryItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("جنس با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف جنس ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) { setFormError("نام جنس الزامی است"); return; }
    if (!form.unit.trim()) { setFormError("واحد الزامی است"); return; }
    if (!form.warehouseId) { setFormError("گدام را انتخاب کنید"); return; }
    if (!form.currencyId) { setFormError("واحد پولی را انتخاب کنید"); return; }
    if (!form.categoryId) { setFormError("دسته‌بندی را انتخاب کنید"); return; }

    const qty = Number(form.openingStockQuantity);
    const cost = Number(form.openingStockUnitCost);

    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      warehouseId: form.warehouseId,
      currencyId: form.currencyId,
      categoryId: form.categoryId,
      details: form.details.trim(),
      ...(form.openingStockQuantity || form.openingStockUnitCost
        ? {
            openingStock: {
              quantity: Number.isFinite(qty) ? qty : 0,
              unitCost: Number.isFinite(cost) ? cost : 0,
              notes: form.openingStockNotes.trim(),
            },
          }
        : {}),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateInventoryItem(editingId, {
          name: payload.name,
          unit: payload.unit,
          warehouseId: payload.warehouseId,
        });
        setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...updated } : i)));
        toast.success("جنس با موفقیت بروزرسانی شد");
      } else {
        const created = await createInventoryItem(payload);
        const fullItem = { ...created, ...payload, id: created.id };
        setItems((prev) => [fullItem, ...prev]);
        toast.success("جنس جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت جنس ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="اجناس انبار"
        description="مدیریت اجناس انبار"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            جنس جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه اجناس
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
                placeholder="جستجوی جنس..."
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
              <TableHead className="text-right">نام جنس</TableHead>
              <TableHead className="text-right">واحد</TableHead>
              <TableHead className="text-right">گدام</TableHead>
              <TableHead className="text-right">دسته‌بندی</TableHead>
              <TableHead className="text-right">واحد پولی</TableHead>
              <TableHead className="text-right">موجودی اولیه</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
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
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  جنسی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(item)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {item.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {warehouseMap.get(item.warehouseId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {categoryMap.get(item.categoryId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {currencyMap.get(item.currencyId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">
                    {item.openingStock.quantity.toLocaleString("fa-AF")} × {item.openingStock.unitCost.toLocaleString("fa-AF")}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(item);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                      >
                        {deletingId === item.id ? (
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

      {/* مودال افزودن / ویرایش جنس */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>
                {editingId ? "ویرایش جنس" : "افزودن جنس جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات جنس را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* ردیف اول: نام و واحد */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="item-name">نام جنس</Label>
                  <Input
                    id="item-name"
                    placeholder="مثلاً: استبلر سیاه"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="item-unit">واحد</Label>
                  <Input
                    id="item-unit"
                    placeholder="مثلاً: عدد"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* ردیف دوم: گدام و دسته‌بندی */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label>گدام</Label>
                  <Select value={form.warehouseId} onValueChange={(v) => setForm((f) => ({ ...f, warehouseId: v ?? "" }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب گدام">
                        {(value) => warehouses.find((w) => w.id === value)?.name ?? "انتخاب گدام"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              {/* ردیف سوم: واحد پولی */}
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

              {/* جزییات */}
              <div className="space-y-2 text-right">
                <Label htmlFor="item-details">جزییات</Label>
                <Textarea
                  id="item-details"
                  rows={3}
                  placeholder="توضیحات تکمیلی درباره این جنس"
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                />
              </div>

              {/* موجودی اولیه */}
              <div className="rounded-md border p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">موجودی اولیه (اختیاری)</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2 text-right">
                    <Label htmlFor="os-qty">تعداد</Label>
                    <Input
                      id="os-qty"
                      type="number"
                      min="0"
                      dir="ltr"
                      placeholder="0"
                      value={form.openingStockQuantity}
                      onChange={(e) => setForm((f) => ({ ...f, openingStockQuantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="os-cost">فی</Label>
                    <Input
                      id="os-cost"
                      type="number"
                      min="0"
                      dir="ltr"
                      placeholder="0"
                      value={form.openingStockUnitCost}
                      onChange={(e) => setForm((f) => ({ ...f, openingStockUnitCost: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="os-notes">ملاحظات</Label>
                    <Input
                      id="os-notes"
                      placeholder="مثلاً: شمارش اولیه"
                      value={form.openingStockNotes}
                      onChange={(e) => setForm((f) => ({ ...f, openingStockNotes: e.target.value }))}
                    />
                  </div>
                </div>
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
                    : "افزودن جنس"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
