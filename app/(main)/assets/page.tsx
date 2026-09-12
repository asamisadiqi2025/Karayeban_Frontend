"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Landmark, Loader2 } from "lucide-react";
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
  fetchAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  type Asset,
} from "@/services/asset.service";
import {
  fetchAddedCurrencies,
  type AddedCurrency,
} from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

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

function persianDateToIso(date: DateObject): string {
  const g = new DateObject(date).convert(gregorian);
  return `${g.year}-${pad2(g.month.number)}-${pad2(g.day)}`;
}

const emptyForm = {
  name: "",
  category: "",
  purchasePrice: "",
  currencyId: "",
  lifespanYears: "",
  purchaseDate: "",
  details: "",
};

export default function AssetsPage() {
  return (
    <ToastProvider>
      <AssetsPageContent />
    </ToastProvider>
  );
}

function AssetsPageContent() {
  const toast = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
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
      const [assetsResult, currenciesResult] = await Promise.allSettled([
        fetchAssets(),
        fetchAddedCurrencies(),
      ]);
      setAssets(
        assetsResult.status === "fulfilled"
          ? (Array.isArray(assetsResult.value) ? assetsResult.value : [])
          : [],
      );
      setCurrencies(
        currenciesResult.status === "fulfilled"
          ? (Array.isArray(currenciesResult.value) ? currenciesResult.value : [])
          : [],
      );
      if (assetsResult.status === "rejected") {
        setError(extractApiErrorMessage(assetsResult.reason, "خطا در دریافت دارایی‌ها"));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchAssets(), fetchAddedCurrencies()]).then(
      ([assetsResult, currenciesResult]) => {
        if (cancelled) return;
        setAssets(
          assetsResult.status === "fulfilled"
            ? (Array.isArray(assetsResult.value) ? assetsResult.value : [])
            : [],
        );
        setCurrencies(
          currenciesResult.status === "fulfilled"
            ? (Array.isArray(currenciesResult.value) ? currenciesResult.value : [])
            : [],
        );
        if (assetsResult.status === "rejected") {
          setError(
            extractApiErrorMessage(assetsResult.reason, "خطا در دریافت دارایی‌ها"),
          );
        }
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const currencyName = useCallback(
    (id: string) => currencies.find((c) => c.id === id)?.name ?? "",
    [currencies],
  );

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchesQuery =
        query.trim() === "" ||
        a.name.includes(query) ||
        a.category.includes(query);
      return matchesQuery;
    });
  }, [assets, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      category: asset.category,
      purchasePrice: asset.purchasePrice === 0 ? "" : String(asset.purchasePrice),
      currencyId: asset.currencyId,
      lifespanYears: asset.lifespanYears === 0 ? "" : String(asset.lifespanYears),
      purchaseDate: asset.purchaseDate,
      details: asset.details,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(asset: Asset) {
    setDeletingId(asset.id);
    try {
      await deleteAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success("دارایی با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف دارایی ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("نام دارایی الزامی است");
      return;
    }
    if (!form.category.trim()) {
      setFormError("دسته‌بندی الزامی است");
      return;
    }
    const price = Number(form.purchasePrice);
    if (form.purchasePrice.trim() === "" || !Number.isFinite(price) || price < 0) {
      setFormError("قیمت خرید باید عددی مثبت باشد");
      return;
    }
    if (!form.currencyId) {
      setFormError("انتخاب واحد پولی الزامی است");
      return;
    }
    const lifespan = Number(form.lifespanYears);
    if (form.lifespanYears.trim() === "" || !Number.isFinite(lifespan) || lifespan <= 0) {
      setFormError("عمر مفید باید عددی بزرگ‌تر از صفر باشد");
      return;
    }
    if (!form.purchaseDate) {
      setFormError("تاریخ خرید الزامی است");
      return;
    }

    const basePayload = {
      name: form.name.trim(),
      category: form.category.trim(),
      purchasePrice: price,
      currencyId: form.currencyId,
      lifespanYears: lifespan,
      purchaseDate: form.purchaseDate,
      details: form.details.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAsset(editingId, basePayload);
        setAssets((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        toast.success("دارایی با موفقیت بروزرسانی شد");
      } else {
        const created = await createAsset(basePayload);
        setAssets((prev) => [created, ...prev]);
        toast.success("دارایی جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت دارایی ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="دارایی‌های ثابت"
        description="مدیریت دارایی‌های ثابت سازمان"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن دارایی جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه دارایی‌ها
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
                placeholder="جستجوی نام یا دسته‌بندی..."
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
              <TableHead>نام</TableHead>
              <TableHead>دسته‌بندی</TableHead>
              <TableHead>قیمت خرید</TableHead>
              <TableHead>عمر مفید</TableHead>
              <TableHead>تاریخ خرید</TableHead>
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
                  دارایی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((asset) => (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(asset)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {asset.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.category || "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {asset.purchasePrice > 0
                      ? `${asset.purchasePrice.toLocaleString("fa-IR")} ${currencyName(asset.currencyId)}`
                      : "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {asset.lifespanYears > 0
                      ? `${asset.lifespanYears} سال`
                      : "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {asset.purchaseDate ? isoToDisplay(asset.purchaseDate) : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {asset.details || "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(asset);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === asset.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset);
                        }}
                      >
                        {deletingId === asset.id ? (
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

      {/* مودال ایجاد / ویرایش دارایی */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش دارایی" : "ایجاد دارایی جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات دارایی را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="asset-name">نام دارایی</Label>
                <Input
                  id="asset-name"
                  placeholder="مثلاً: کولر برقی"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="asset-category">دسته‌بندی</Label>
                <Input
                  id="asset-category"
                  placeholder="مثلاً: سخت‌افزار"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="asset-price">قیمت خرید</Label>
                <Input
                  id="asset-price"
                  type="number"
                  step="any"
                  min="0"
                  dir="ltr"
                  placeholder="0"
                  value={form.purchasePrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purchasePrice: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="asset-currency">واحد پولی</Label>
                <Select
                  value={form.currencyId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, currencyId: v ?? "" }))
                  }
                >
                  <SelectTrigger id="asset-currency" className="w-full">
                    <SelectValue placeholder="انتخاب واحد پولی">
                      {(value) =>
                        currencies.find((c) => c.id === value)?.name ??
                        "انتخاب واحد پولی"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        واحد پولی تعریف نشده است
                      </SelectItem>
                    ) : (
                      currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="asset-lifespan">عمر مفید (سال)</Label>
                <Input
                  id="asset-lifespan"
                  type="number"
                  min="1"
                  dir="ltr"
                  placeholder="مثلاً: 5"
                  value={form.lifespanYears}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lifespanYears: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="asset-date">تاریخ خرید</Label>
                <DatePicker
                  calendar={persian}
                  locale={afghanLocale}
                  calendarPosition="bottom-right"
                  containerClassName="w-full"
                  placeholder="تاریخ خرید را انتخاب کنید"
                  value={
                    form.purchaseDate
                      ? isoToPersianDate(form.purchaseDate)
                      : undefined
                  }
                  onChange={(date) => {
                    if (date?.isValid) {
                      setForm((f) => ({
                        ...f,
                        purchaseDate: persianDateToIso(date),
                      }));
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="asset-details">جزییات</Label>
              <Textarea
                id="asset-details"
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
                {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "ثبت دارایی"}
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
