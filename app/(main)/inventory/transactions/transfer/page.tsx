"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Loader2, Package, Warehouse } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchInventoryItems,
  transferInventoryItem,
  type InventoryItem,
} from "@/services/inventory-item.service";
import { fetchWarehouses, type Warehouse as WarehouseType } from "@/services/warehouse.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  itemId: "",
  fromWarehouseId: "",
  toWarehouseId: "",
  quantity: "",
  notes: "",
};

export default function InventoryTransferPage() {
  return (
    <ToastProvider>
      <InventoryTransferPageContent />
    </ToastProvider>
  );
}

function InventoryTransferPageContent() {
  const toast = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsResult, whResult] = await Promise.all([
        fetchInventoryItems(),
        fetchWarehouses(),
      ]);
      setItems(Array.isArray(itemsResult) ? itemsResult : []);
      setWarehouses(Array.isArray(whResult) ? whResult : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت اطلاعات"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === form.itemId),
    [items, form.itemId],
  );

  const fromWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === form.fromWarehouseId),
    [warehouses, form.fromWarehouseId],
  );

  const toCandidates = useMemo(
    () =>
      warehouses.filter(
        (warehouse) => warehouse.id !== fromWarehouse?.id,
      ),
    [warehouses, fromWarehouse],
  );

  const availableQuantity = useMemo(
    () =>
      selectedItem
        ? Number(selectedItem.quantity) || Math.max(0, selectedItem.openingStock.quantity) || 0
        : 0,
    [selectedItem],
  );

  function selectItem(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    setForm((current) => ({
      ...current,
      itemId,
      fromWarehouseId: item?.warehouseId ?? current.fromWarehouseId,
      toWarehouseId:
        current.toWarehouseId === item?.warehouseId
          ? ""
          : current.toWarehouseId,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!form.itemId) {
      setFormError("جنس را انتخاب کنید");
      return;
    }
    if (!form.fromWarehouseId) {
      setFormError("گدام مبدأ را انتخاب کنید");
      return;
    }
    if (!form.toWarehouseId) {
      setFormError("گدام مقصد را انتخاب کنید");
      return;
    }
    if (form.fromWarehouseId === form.toWarehouseId) {
      setFormError("گدام مبدأ و مقصد نمی‌توانند یکسان باشند");
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("تعداد انتقال باید بیشتر از صفر باشد");
      return;
    }
    if (quantity > availableQuantity) {
      setFormError(
        `موجودی کافی نیست؛ موجودی فعلی ${availableQuantity.toLocaleString("fa-AF")} است`,
      );
      return;
    }

    setSaving(true);
    try {
      await transferInventoryItem({
        itemId: form.itemId,
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        quantity,
        notes: form.notes.trim(),
      });
      toast.success("انتقال با موفقیت انجام شد");
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "انجام انتقال ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="انتقال بین گدام‌ها"
        description="انتقال یک جنس بین دو گدام"
      />

      {loading ? (
        <Card className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">در حال بارگذاری...</span>
          </div>
        </Card>
      ) : error && !items.length ? (
        <Card className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            تلاش مجدد
          </Button>
        </Card>
      ) : (
        <Card className="mx-auto max-w-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-right">
              <Label htmlFor="transfer-item">جنس</Label>
              <Select value={form.itemId} onValueChange={(value) => selectItem(value ?? "")}>
                <SelectTrigger id="transfer-item" className="w-full">
                  <SelectValue placeholder="انتخاب جنس">
                    {(value) =>
                      items.find((item) => item.id === value)?.name ?? "انتخاب جنس"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {items.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      جنسی موجود نیست
                    </SelectItem>
                  ) : (
                    items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <Package data-icon="inline-start" className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.name}
                        <span className="text-muted-foreground">
                          ({Number(item.quantity) || 0} {item.unit})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                موجودی فعلی این جنس در گدام «{selectedItem.warehouse?.name ?? selectedItem.warehouseId}»:
                <span className="font-medium text-foreground" dir="ltr">
                  {" "}
                  {(Number(selectedItem.quantity) || 0).toLocaleString("fa-AF")} {selectedItem.unit}
                </span>
              </p>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="from-warehouse">از گدام</Label>
                <Select
                  value={form.fromWarehouseId}
                  disabled={!selectedItem}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fromWarehouseId: value ?? "",
                      toWarehouseId:
                        current.toWarehouseId === value
                          ? ""
                          : current.toWarehouseId,
                    }))
                  }
                >
                  <SelectTrigger id="from-warehouse" className="w-full">
                    <SelectValue
                      placeholder={
                        selectedItem ? "انتخاب گدام مبدأ" : "ابتدا جنس را انتخاب کنید"
                      }
                    >
                      {(value) =>
                        warehouses.find((warehouse) => warehouse.id === value)?.name ??
                        "انتخاب گدام مبدأ"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {!selectedItem ? (
                      <SelectItem value="__none__" disabled>
                        ابتدا جنس را انتخاب کنید
                      </SelectItem>
                    ) : (
                      warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <Warehouse data-icon="inline-start" className="h-3.5 w-3.5 text-muted-foreground" />
                          {warehouse.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="to-warehouse">به گدام</Label>
                <Select
                  value={form.toWarehouseId}
                  disabled={!fromWarehouse}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, toWarehouseId: value ?? "" }))
                  }
                >
                  <SelectTrigger id="to-warehouse" className="w-full">
                    <SelectValue
                      placeholder={
                        fromWarehouse ? "انتخاب گدام مقصد" : "ابتدا گدام مبدأ را انتخاب کنید"
                      }
                    >
                      {(value) =>
                        warehouses.find((warehouse) => warehouse.id === value)?.name ??
                        "انتخاب گدام مقصد"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {!fromWarehouse ? (
                      <SelectItem value="__none__" disabled>
                        ابتدا گدام مبدأ را انتخاب کنید
                      </SelectItem>
                    ) : toCandidates.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        گدام دیگری برای مقصد وجود ندارد
                      </SelectItem>
                    ) : (
                      toCandidates.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <Warehouse data-icon="inline-start" className="h-3.5 w-3.5 text-muted-foreground" />
                          {warehouse.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="transfer-quantity">تعداد</Label>
              <div className="relative">
                <Input
                  id="transfer-quantity"
                  type="number"
                  step="any"
                  min="0"
                  dir="ltr"
                  placeholder="0"
                  className="pl-20"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, quantity: e.target.value }))
                  }
                  required
                />
                {selectedItem?.unit && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {selectedItem.unit}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="transfer-notes">ملاحظات</Label>
              <Textarea
                id="transfer-notes"
                rows={3}
                placeholder="مثلاً: انتقال تخته به گدام شماره ۲"
                value={form.notes}
                onChange={(e) =>
                  setForm((current) => ({ ...current, notes: e.target.value }))
                }
              />
            </div>

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving || loading}>
                {saving && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                <ArrowLeftRight data-icon="inline-start" />
                {saving ? "در حال انتقال..." : "ثبت انتقال"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}