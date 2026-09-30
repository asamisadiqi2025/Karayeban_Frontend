"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  Loader2,
  Pencil,
  Save,
  Tag,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { isoToDisplay, isoToDisplayDateTime } from "@/lib/date-picker";
import { ToastProvider, useToast } from "@/components/client/toast";
import {
  AssetFormFields,
  AssetStatusBadge,
  DatePickerStyles,
  toAssetBody,
  validateAssetForm,
  type AssetFormValues,
} from "@/components/client/assets/asset-form";

import {
  fetchAsset,
  updateAsset,
  deleteAsset,
  type Asset,
  type DepreciationEvent,
} from "@/services/asset.service";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";

function formatAmount(value: number): string {
  return value.toLocaleString("fa-AF", { maximumFractionDigits: 2 });
}

function eventCell(event: DepreciationEvent, keys: string[]): string {
  for (const key of keys) {
    const value = event[key];
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "number") {
      return value.toLocaleString("fa-AF", { maximumFractionDigits: 2 });
    }
    return String(value);
  }
  return "—";
}

/**
 * جهت نمایش مقدار کارت.
 *
 * مقدارهای متنی فارسی (مثل «۸ میزان ۱۴۰۵ — ساعت ۱۱:۱۰» یا «۵ سال») باید در
 * پایه‌ی راست‌به‌چپ چیده شوند، وگرنه بخش‌های راست‌به‌چپ جابه‌جا می‌شوند.
 * فقط مقدارهای کاملاً عددی/لاتین (مثل «۹٬۰۰۰ USD») به پایه‌ی چپ‌به‌راست نیاز دارند.
 */
function valueDir(value: React.ReactNode): "rtl" | "ltr" {
  if (typeof value !== "string") return "rtl";
  return /[\u0600-\u06FF]/.test(value) ? "rtl" : "ltr";
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div
        dir={valueDir(value)}
        className="text-right text-sm font-medium text-foreground"
      >
        {value}
      </div>
    </Card>
  );
}

export default function AssetDetailPage() {
  return (
    <ToastProvider>
      <AssetDetailContent />
    </ToastProvider>
  );
}

function AssetDetailContent() {
  const toast = useToast();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AssetFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * وضعیت loading در هندلر کاربر ست می‌شود، نه داخل افکت، تا
   * react-hooks/set-state-in-effect رعایت شود.
   */
  useEffect(() => {
    let cancelled = false;
    fetchAsset(id)
      .then((result) => {
        if (cancelled) return;
        setAsset(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setAsset(null);
        setError(extractApiErrorMessage(err, "خطا در دریافت دارایی"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  useEffect(() => {
    let cancelled = false;
    fetchAddedCurrencies()
      .then((result) => {
        if (!cancelled) setCurrencies(Array.isArray(result) ? result : []);
      })
      .catch(() => {
        if (!cancelled) setCurrencies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function reload() {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }

  function startEdit() {
    if (!asset) return;
    setForm({
      name: asset.name,
      category: asset.category,
      purchasePrice: asset.purchasePrice === 0 ? "" : String(asset.purchasePrice),
      currencyId: asset.currencyId,
      lifespanYears: asset.lifespanYears === 0 ? "" : String(asset.lifespanYears),
      purchaseDate: asset.purchaseDate,
      status: asset.status,
      details: asset.details,
    });
    setFormError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !asset) return;

    setFormError(null);
    const validationError = validateAssetForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAsset(asset.id, {
        ...toAssetBody(form),
        status: form.status,
      });
      setAsset((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success("دارایی با موفقیت بروزرسانی شد");
      setEditing(false);
      setForm(null);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "بروزرسانی دارایی ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!asset) return;
    setDeleting(true);
    try {
      await deleteAsset(asset.id);
      toast.success("دارایی با موفقیت حذف شد");
      router.push("/assets");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف دارایی ناموفق بود"));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="جزییات دارایی" description="در حال بارگذاری..." />
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div>
        <PageHeader title="جزییات دارایی" description="خطا" />
        <Card className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">{error ?? "دارایی یافت نشد"}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reload}>
              تلاش مجدد
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/assets" />}
            >
              بازگشت به فهرست دارایی‌ها
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currencyLabel = asset.currency?.name || asset.currency?.code || "—";
  const totalDepreciation = asset.purchasePrice - asset.currentBookValue;

  return (
    <div>
      <PageHeader
        title={asset.name}
        description={`جزییات دارایی «${asset.name}»`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/assets" />}
            >
              <ArrowRight data-icon="inline-start" />
              بازگشت
            </Button>
            {editing ? (
              <Button type="button" onClick={cancelEdit} disabled={saving}>
                <X data-icon="inline-start" />
                انصراف
              </Button>
            ) : (
              <Button onClick={startEdit}>
                <Pencil data-icon="inline-start" />
                ویرایش
              </Button>
            )}
          </div>
        }
      />

      {editing && form ? (
        <Card className="p-5">
          <form onSubmit={handleSave} className="max-w-3xl">
            <AssetFormFields
              values={form}
              onChange={setForm}
              currencies={currencies}
              showStatus
              idPrefix="asset"
            />

            {formError && (
              <p className="mt-5 whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <div className="mt-6 flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard icon={<Tag className="h-4 w-4" />} label="نام دارایی" value={asset.name} />
            <InfoCard
              icon={<Tag className="h-4 w-4" />}
              label="دسته‌بندی"
              value={asset.category || "—"}
            />
            <InfoCard
              icon={<Wallet className="h-4 w-4" />}
              label="واحد پولی"
              value={
                asset.currency
                  ? `${asset.currency.name} (${asset.currency.code})`
                  : currencyLabel
              }
            />
            <InfoCard
              icon={<Coins className="h-4 w-4" />}
              label="وضعیت"
              value={<AssetStatusBadge status={asset.status} />}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={<Coins className="h-4 w-4" />}
              label="قیمت خرید"
              value={`${formatAmount(asset.purchasePrice)} ${asset.currency?.code ?? ""}`}
            />
            <InfoCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="استهلاک سالانه"
              value={`${formatAmount(asset.annualDepreciation)} ${asset.currency?.code ?? ""}`}
            />
            <InfoCard
              icon={<Wallet className="h-4 w-4" />}
              label="ارزش دفتری فعلی"
              value={`${formatAmount(asset.currentBookValue)} ${asset.currency?.code ?? ""}`}
            />
            <InfoCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="استهلاک تجمعی"
              value={
                totalDepreciation > 0
                  ? `${formatAmount(totalDepreciation)} ${asset.currency?.code ?? ""}`
                  : "—"
              }
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="عمر مفید"
              value={asset.lifespanYears > 0 ? `${asset.lifespanYears} سال` : "—"}
            />
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="تاریخ خرید"
              value={asset.purchaseDate ? isoToDisplay(asset.purchaseDate) : "—"}
            />
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="تاریخ ایجاد"
              value={asset.createdAt ? isoToDisplayDateTime(asset.createdAt) : "—"}
            />
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="آخرین بروزرسانی"
              value={asset.updatedAt ? isoToDisplayDateTime(asset.updatedAt) : "—"}
            />
          </div>

          {asset.details && (
            <Card className="mb-6 p-4">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">جزییات</p>
              <p className="text-sm text-foreground">{asset.details}</p>
            </Card>
          )}

          <Card className="mb-6 p-0">
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold text-foreground">
                رویدادهای استهلاک
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({asset.depreciationEvents.length.toLocaleString("fa-AF")} مورد)
                </span>
              </h2>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>سال</TableHead>
                  <TableHead>مبلغ استهلاک</TableHead>
                  <TableHead>ارزش دفتری</TableHead>
                  <TableHead>تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asset.depreciationEvents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-muted-foreground"
                    >
                      رویداد استهلاکی ثبت نشده است
                    </TableCell>
                  </TableRow>
                ) : (
                  asset.depreciationEvents.map((event, index) => (
                    <TableRow key={event.id || index}>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {eventCell(event, ["year", "depreciationYear"])}
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {eventCell(event, [
                          "amount",
                          "depreciationAmount",
                          "annualDepreciation",
                        ])}
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {eventCell(event, ["bookValue", "currentBookValue"])}
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {eventCell(event, ["date", "eventDate", "depreciationDate"])}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">حذف دارایی</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  پس از حذف، این دارایی از فهرست خارج می‌شود.
                </p>
              </div>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Trash2 data-icon="inline-start" />
                )}
                {deleting ? "در حال حذف..." : "حذف دارایی"}
              </Button>
            </div>
          </Card>
        </>
      )}

      <DatePickerStyles />
    </div>
  );
}
