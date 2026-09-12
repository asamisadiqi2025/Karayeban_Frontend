"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Gauge, Loader2 } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import DateObject from "react-date-object";
import afghanLocale from "@/lib/date-picker/afghan-locale";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  fetchMeters,
  createMeter,
  updateMeter,
  deleteMeter,
  type Meter,
} from "@/services/meter.service";
import { fetchShops, type Shop } from "@/services/shop.service";
import { extractApiErrorMessage } from "@/services/client";
import { fetchMyMarket } from "@/services/market.service";
import { ToastProvider, useToast } from "@/components/client/toast";
import { useAuth } from "@/contexts/auth-context";

const emptyForm = {
  shopNumber: "",
  serialNumber: "",
  location: "",
  lastReading: "",
  lastReadingDate: "",
};

function isoToPersianDate(iso: string): DateObject | undefined {
  const gregorianDate = new DateObject({ calendar: gregorian, date: iso });
  if (!gregorianDate.isValid) return undefined;
  return gregorianDate.convert(persian);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isoToDisplay(iso: string): string {
  const gregorianDate = new DateObject({ calendar: gregorian, date: iso });
  if (!gregorianDate.isValid) return iso;
  const p = gregorianDate.convert(persian);
  return `${p.year}/${pad2(p.month.number)}/${pad2(p.day)}`;
}

function shopNameOf(meter: Meter, shops: Shop[]): string {
  if (meter.shopName) return meter.shopName;
  const byId = shops.find((s) => s.id && String(s.id) === String(meter.shopId));
  if (byId) return byId.name ?? byId.shopNumber ?? meter.shopNumber;
  const byNumber = shops.find(
    (s) => String(s.shopNumber) === String(meter.shopNumber),
  );
  if (byNumber) return byNumber.name ?? byNumber.shopNumber ?? meter.shopNumber;
  return meter.shopNumber || "—";
}

function persianDateToIso(date: DateObject): string {
  const g = new DateObject(date).convert(gregorian);
  return `${g.year}-${pad2(g.month.number)}-${pad2(g.day)}`;
}

export default function MetersPage() {
  return (
    <ToastProvider>
      <MetersPageContent />
    </ToastProvider>
  );
}

function MetersPageContent() {
  const toast = useToast();
  const { user } = useAuth();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
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
      const [shopResult, result] = await Promise.all([fetchShops(), fetchMeters()]);
      setShops(Array.isArray(shopResult) ? shopResult : []);
      setMeters(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت کنتورها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchShops(), fetchMeters()])
      .then(([shopResult, meterResult]) => {
        if (cancelled) return;
        setShops(Array.isArray(shopResult) ? shopResult : []);
        setMeters(Array.isArray(meterResult) ? meterResult : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت کنتورها"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return meters.filter((m) => {
      const name = shopNameOf(m, shops);
      const matchesQuery =
        query.trim() === "" ||
        m.serialNumber.includes(query) ||
        name.includes(query) ||
        m.location.includes(query);
      return matchesQuery;
    });
  }, [meters, query, shops]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(meter: Meter) {
    setEditingId(meter.id);
    setForm({
      shopNumber: meter.shopNumber,
      serialNumber: meter.serialNumber,
      location: meter.location,
      lastReading:
        meter.lastReading === 0 ? "" : String(meter.lastReading),
      lastReadingDate: meter.lastReadingDate,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(meter: Meter) {
    setDeletingId(meter.id);
    try {
      await deleteMeter(meter.id);
      setMeters((prev) => prev.filter((m) => m.id !== meter.id));
      toast.success("کنتور با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف کنتور ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.shopNumber.trim()) {
      setFormError("شماره دکان الزامی است");
      return;
    }
    if (!form.serialNumber.trim()) {
      setFormError("شماره سریال الزامی است");
      return;
    }
    const lastReading = Number(form.lastReading);
    if (form.lastReading.trim() === "" || !Number.isFinite(lastReading)) {
      setFormError("قرائت کنتور باید یک عدد معتبر باشد");
      return;
    }
    if (!form.lastReadingDate) {
      setFormError("تاریخ قرائت الزامی است");
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
      serialNumber: form.serialNumber.trim(),
      location: form.location.trim(),
      lastReading,
      lastReadingDate: form.lastReadingDate,
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateMeter(editingId, basePayload);
        setMeters((prev) =>
          prev.map((m) => (m.id === editingId ? updated : m)),
        );
        toast.success("کنتور با موفقیت بروزرسانی شد");
      } else {
        const created = await createMeter({
          ...basePayload,
          marketId: marketId!,
        });
        setMeters((prev) => [created, ...prev]);
        toast.success("کنتور جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت کنتور ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="میترهای برق"
        description="مدیریت کنتورهای برق دکان‌های مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            میتر جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه میترها
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
                placeholder="جستجوی سریال، شماره دکان یا موقعیت..."
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
              <TableHead>شماره سریال</TableHead>
              <TableHead>شماره دکان</TableHead>
              <TableHead>آخرین قرائت</TableHead>
              <TableHead>تاریخ قرائت</TableHead>
              <TableHead>موقعیت</TableHead>
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
                  میتری یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((meter) => (
                <TableRow
                  key={meter.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(meter)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {meter.serialNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {shopNameOf(meter, shops)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {meter.lastReading !== 0
                      ? meter.lastReading.toLocaleString("fa-IR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {meter.lastReadingDate
                      ? isoToDisplay(meter.lastReadingDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {meter.location || "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(meter);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === meter.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(meter);
                        }}
                      >
                        {deletingId === meter.id ? (
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

      {/* مودال افزودن / ویرایش میتر */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش میتر" : "افزودن میتر جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات کنتور برق و دکان مربوطه را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="serial-number">شماره سریال</Label>
                <Input
                  id="serial-number"
                  placeholder="مثلاً: SN-2026-001"
                  dir="ltr"
                  value={form.serialNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, serialNumber: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="shop-number">دکان</Label>
                <Select
                  value={form.shopNumber}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, shopNumber: value ?? "" }))
                  }
                >
                  <SelectTrigger id="shop-number" className="w-full">
                    <SelectValue placeholder="انتخاب دکان">
                      {(value) => {
                        if (!value) return "انتخاب دکان";
                        const shop = shops.find(
                          (s) => String(s.id) === String(value) || String(s.shopNumber) === String(value),
                        );
                        return shop?.name ?? shop?.shopNumber ?? "انتخاب دکان";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {shops.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        دوکانی تعریف نشده است
                      </SelectItem>
                    ) : (
                      shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.shopNumber}>
                          {shop.name ?? `دکان ${shop.shopNumber}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="last-reading">آخرین قرائت</Label>
                <Input
                  id="last-reading"
                  type="number"
                  step="any"
                  min="0"
                  dir="ltr"
                  placeholder="0"
                  value={form.lastReading}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastReading: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="last-reading-date">تاریخ قرائت</Label>
                <DatePicker
                  calendar={persian}
                  locale={afghanLocale}
                  calendarPosition="bottom-right"
                  placeholder="تاریخ قرائت را انتخاب کنید"
                  value={
                    form.lastReadingDate
                      ? isoToPersianDate(form.lastReadingDate)
                      : undefined
                  }
                  onChange={(date) => {
                    if (date?.isValid) {
                      setForm((f) => ({
                        ...f,
                        lastReadingDate: persianDateToIso(date),
                      }));
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="meter-location">موقعیت کنتور</Label>
              <Input
                id="meter-location"
                placeholder="مثلاً: دیوار بیرونی، کنار درب ورودی"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
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
                {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "افزودن میتر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .rmdp-input {
          width: 100%;
          height: 36px;
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
          background: transparent;
          padding: 0 12px;
          font-size: 14px;
        }
        .rmdp-input:focus {
          outline: none;
          border-color: hsl(var(--ring));
        }
      `}</style>
    </div>
  );
}