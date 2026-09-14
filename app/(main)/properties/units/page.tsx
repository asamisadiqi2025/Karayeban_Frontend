"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Store, Loader2 } from "lucide-react";

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
  fetchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  type Unit,
  type UnitType,
} from "@/services/unit.service";
import { fetchFloors, type Floor } from "@/services/floor.service";
import { extractApiErrorMessage } from "@/services/client";
import { fetchMyMarket } from "@/services/market.service";
import { ToastProvider, useToast } from "@/components/client/toast";
import { useAuth } from "@/contexts/auth-context";

const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  shop: "دوکان",
  unit: "واحد",
  stall: "بساط",
};

const emptyForm = {
  shopNumber: "",
  floorId: "",
  type: "shop" as UnitType,
  area: "",
  location: "",
  details: "",
};

export default function PropertiesUnitsPage() {
  return (
    <ToastProvider>
      <PropertiesUnitsPageContent />
    </ToastProvider>
  );
}

function PropertiesUnitsPageContent() {
  const toast = useToast();
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
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
      const [unitsResult, floorsResult] = await Promise.allSettled([
        fetchUnits(),
        fetchFloors(),
      ]);
      setUnits(
        unitsResult.status === "fulfilled"
          ? Array.isArray(unitsResult.value) ? unitsResult.value : []
          : [],
      );
      setFloors(
        floorsResult.status === "fulfilled"
          ? Array.isArray(floorsResult.value) ? floorsResult.value : []
          : [],
      );
      if (unitsResult.status === "rejected") {
        setError(
          extractApiErrorMessage(unitsResult.reason, "خطا در دریافت واحدها"),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchUnits(), fetchFloors()]).then(
      ([unitsResult, floorsResult]) => {
        if (cancelled) return;
        setUnits(
          unitsResult.status === "fulfilled"
            ? Array.isArray(unitsResult.value) ? unitsResult.value : []
            : [],
        );
        setFloors(
          floorsResult.status === "fulfilled"
            ? Array.isArray(floorsResult.value) ? floorsResult.value : []
            : [],
        );
        if (unitsResult.status === "rejected") {
          setError(
            extractApiErrorMessage(unitsResult.reason, "خطا در دریافت واحدها"),
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
    return units.filter((u) => {
      const matchesQuery =
        query.trim() === "" ||
        u.shopNumber.includes(query) ||
        u.location.includes(query);
      return matchesQuery;
    });
  }, [units, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(unit: Unit) {
    setEditingId(unit.id);
    setForm({
      shopNumber: unit.shopNumber,
      floorId: unit.floorId,
      type: unit.type,
      area: unit.area === 0 ? "" : String(unit.area),
      location: unit.location,
      details: unit.details,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(unit: Unit) {
    setDeletingId(unit.id);
    try {
      await deleteUnit(unit.id);
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
        const updated = await updateUnit(editingId, basePayload);
        setUnits((prev) =>
          prev.map((u) => (u.id === editingId ? updated : u)),
        );
        toast.success("واحد با موفقیت بروزرسانی شد");
      } else {
        const created = await createUnit({
          ...basePayload,
          marketId: marketId!,
        });
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
        title="املاک و واحدها"
        description="مدیریت دوکان‌ها، واحدها و بساط‌های مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن ملک جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه واحدها
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({filtered.length.toLocaleString("fa-AF")} مورد)
                </span>
              )}
            </h2>
          </div>

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

        <Table>
          <TableHeader className="text-right">
            <TableRow>
              <TableHead className="text-right">شماره دوکان</TableHead>
              <TableHead className="text-right">طبقه</TableHead>
              <TableHead className="text-right">نوع</TableHead>
              <TableHead className="text-right">مساحت</TableHead>
              <TableHead className="text-right">موقعیت</TableHead>
              <TableHead className="text-right">جزییات</TableHead>
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
                  ملکی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((unit) => (
                <TableRow
                  key={unit.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(unit)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground" dir="ltr">
                        {unit.shopNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {floorName(unit.floorId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {UNIT_TYPE_LABEL[unit.type] ?? unit.type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {unit.area > 0
                      ? `${unit.area.toLocaleString("fa-IR")} م²`
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {unit.location || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {unit.details || "—"}
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

      {/* مودال ایجاد / ویرایش ملک */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش ملک" : "ایجاد ملک جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات دوکان، واحد یا بساط را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="unit-number">شماره دوکان</Label>
                <Input
                  id="unit-number"
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
                <Label htmlFor="unit-floor">طبقه</Label>
                <Select
                  value={form.floorId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, floorId: v ?? "" }))
                  }
                >
                  <SelectTrigger id="unit-floor" className="w-full">
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
                <Label htmlFor="unit-type">نوع ملک</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as UnitType }))
                  }
                >
                  <SelectTrigger id="unit-type" className="w-full">
                    <SelectValue placeholder="انتخاب نوع">
                      {(value) =>
                        UNIT_TYPE_LABEL[value as UnitType] ?? "انتخاب نوع"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">دوکان</SelectItem>
                    <SelectItem value="unit">واحد</SelectItem>
                    <SelectItem value="stall">بساط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="unit-area">مساحت</Label>
                <div className="relative">
                  <Input
                    id="unit-area"
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
              <Label htmlFor="unit-location">موقعیت</Label>
              <Input
                id="unit-location"
                placeholder="مثلاً: ردیف اول"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="unit-details">جزییات</Label>
              <Textarea
                id="unit-details"
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
                {saving
                  ? "در حال ذخیره..."
                  : editingId
                    ? "ذخیره تغییرات"
                    : "ثبت ملک"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
