"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Store, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  fetchShops,
  createShop,
  updateShop,
  deleteShop,
  type Shop,
  type ShopType,
} from "@/services/shop.service";
import { fetchFloors, type Floor } from "@/services/floor.service";
import { extractApiErrorMessage } from "@/services/client";
import { fetchMyMarket } from "@/services/market.service";
import { ToastProvider, useToast } from "@/components/client/toast";
import { useAuth } from "@/contexts/auth-context";

const SHOP_TYPE_LABEL: Record<ShopType, string> = {
  shop: "دوکان",
  unit: "واحد",
  stall: "بساط",
};

const emptyForm = {
  shopNumber: "",
  floorId: "",
  type: "shop" as ShopType,
  area: "",
  location: "",
  details: "",
};

export default function ShopsPage() {
  return (
    <ToastProvider>
      <ShopsPageContent />
    </ToastProvider>
  );
}

function ShopsPageContent() {
  const toast = useToast();
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
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
      const [shopsResult, floorsResult] = await Promise.allSettled([
        fetchShops(),
        fetchFloors(),
      ]);
      setShops(
        shopsResult.status === "fulfilled"
          ? (Array.isArray(shopsResult.value) ? shopsResult.value : [])
          : [],
      );
      setFloors(
        floorsResult.status === "fulfilled"
          ? (Array.isArray(floorsResult.value) ? floorsResult.value : [])
          : [],
      );
      if (shopsResult.status === "rejected") {
        setError(extractApiErrorMessage(shopsResult.reason, "خطا در دریافت دوکان‌ها"));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchShops(), fetchFloors()]).then(
      ([shopsResult, floorsResult]) => {
        if (cancelled) return;
        setShops(
          shopsResult.status === "fulfilled"
            ? (Array.isArray(shopsResult.value) ? shopsResult.value : [])
            : [],
        );
        setFloors(
          floorsResult.status === "fulfilled"
            ? (Array.isArray(floorsResult.value) ? floorsResult.value : [])
            : [],
        );
        if (shopsResult.status === "rejected") {
          setError(
            extractApiErrorMessage(shopsResult.reason, "خطا در دریافت دوکان‌ها"),
          );
        }
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const floorName = useCallback(
    (id: string) => floors.find((f) => f.id === id)?.name,
    [floors],
  );

  const filtered = useMemo(() => {
    return shops.filter((s) => {
      const matchesQuery =
        query.trim() === "" ||
        s.shopNumber.includes(query) ||
        s.location.includes(query);
      return matchesQuery;
    });
  }, [shops, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(shop: Shop) {
    setEditingId(shop.id);
    setForm({
      shopNumber: shop.shopNumber,
      floorId: shop.floorId,
      type: shop.type,
      area: shop.area === 0 ? "" : String(shop.area),
      location: shop.location,
      details: shop.details,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(shop: Shop) {
    setDeletingId(shop.id);
    try {
      await deleteShop(shop.id);
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
      toast.success("دوکان با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف دوکان ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.shopNumber.trim()) {
      setFormError("شماره دوکان الزامی است");
      return;
    }
    if (!form.floorId) {
      setFormError("انتخاب طبقه الزامی است");
      return;
    }
    const area = Number(form.area);
    if (form.area.trim() === "" || !Number.isFinite(area) || area <= 0) {
      setFormError("مساحت باید عددی بزرگ‌تر از صفر باشد");
      return;
    }

    let marketId = user?.marketId;
    if (!marketId && !editingId) {
      try {
        const market = await fetchMyMarket();
        marketId = market.id;
      } catch {
        setFormError("شناسه مارکت یافت نشد");
        return;
      }
    }

    const basePayload = {
      shopNumber: form.shopNumber.trim(),
      floorId: form.floorId,
      type: form.type,
      area,
      location: form.location.trim(),
      details: form.details.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateShop(editingId, basePayload);
        setShops((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        toast.success("دوکان با موفقیت بروزرسانی شد");
      } else {
        const created = await createShop({
          ...basePayload,
          marketId: marketId!,
        });
        setShops((prev) => [created, ...prev]);
        toast.success("دوکان جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت دوکان ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="دوکان‌ها"
        description="مدیریت دوکان‌ها، واحدها و بساط‌های مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن دوکان جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه دوکان‌ها
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
                placeholder="جستجوی شماره دوکان یا موقعیت..."
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
              <TableHead>شماره دوکان</TableHead>
              <TableHead>طبقه</TableHead>
              <TableHead>نوع</TableHead>
              <TableHead>مساحت</TableHead>
              <TableHead>موقعیت</TableHead>
              <TableHead>جزییات</TableHead>
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
                  دوکانی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((shop) => (
                <TableRow
                  key={shop.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(shop)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground" dir="ltr">
                        {shop.shopNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {floorName(shop.floorId) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {SHOP_TYPE_LABEL[shop.type] ?? shop.type}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {shop.area > 0 ? `${shop.area.toLocaleString("fa-IR")} م²` : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {shop.location || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {shop.details || "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(shop);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === shop.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(shop);
                        }}
                      >
                        {deletingId === shop.id ? (
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

      {/* مودال ایجاد / ویرایش دوکان */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش دوکان" : "ایجاد دوکان جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات دوکان، واحد یا بساط را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="shop-number">شماره دوکان</Label>
                <Input
                  id="shop-number"
                  dir="ltr"
                  placeholder="مثلاً: 5"
                  value={form.shopNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, shopNumber: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="shop-floor">طبقه</Label>
                <Select
                  value={form.floorId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, floorId: v ?? "" }))
                  }
                >
                  <SelectTrigger id="shop-floor" className="w-full">
                    <SelectValue placeholder="انتخاب طبقه">
                      {(value) =>
                        floors.find((f) => f.id === value)?.name ??
                        "انتخاب طبقه"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {floors.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        طبقه‌ای تعریف نشده است
                      </SelectItem>
                    ) : (
                      floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="shop-type">نوع دوکان</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as ShopType }))
                  }
                >
                  <SelectTrigger id="shop-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">دوکان</SelectItem>
                    <SelectItem value="unit">واحد</SelectItem>
                    <SelectItem value="stall">بساط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="shop-area">مساحت</Label>
                <div className="relative">
                  <Input
                    id="shop-area"
                    type="number"
                    step="any"
                    min="0"
                    dir="ltr"
                    placeholder="0"
                    className="pl-10"
                    value={form.area}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, area: e.target.value }))
                    }
                    required
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    م²
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="shop-location">موقعیت</Label>
              <Input
                id="shop-location"
                placeholder="مثلاً: ردیف اول"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="shop-details">جزییات</Label>
              <Textarea
                id="shop-details"
                rows={4}
                placeholder="توضیحات تکمیلی..."
                value={form.details}
                onChange={(e) =>
                  setForm((f) => ({ ...f, details: e.target.value }))
                }
              />
            </div>

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <DialogClose render={<Button variant="outline" type="button" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "ثبت دوکان"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}