"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Filter,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { isoToDisplay } from "@/lib/date-picker";
import { ToastProvider, useToast } from "@/components/client/toast";
import { PaginationBar } from "@/components/client/dashboard/pagination-bar";
import {
  AssetFormFields,
  AssetStatusBadge,
  DatePickerStyles,
  emptyAssetForm,
  toAssetBody,
  validateAssetForm,
  type AssetFormValues,
} from "@/components/client/assets/asset-form";

import {
  fetchAssetsPaginated,
  createAsset,
  updateAsset,
  deleteAsset,
  type Asset,
  type AssetStatus,
  type PaginatedMeta,
} from "@/services/asset.service";
import {
  fetchAddedCurrencies,
  type AddedCurrency,
} from "@/services/currency.service";
import { fetchMyMarket } from "@/services/market.service";
import { extractApiErrorMessage } from "@/services/client";

const ALL = "all";
const PAGE_SIZE = 20;

const emptyMeta: PaginatedMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const statusFilterOptions: { value: string; label: string }[] = [
  { value: ALL, label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "disposed", label: "از رده خارج شده" },
];

function formatAmount(value: number): string {
  return value.toLocaleString("fa-AF", { maximumFractionDigits: 2 });
}

function assetToForm(asset: Asset): AssetFormValues {
  return {
    name: asset.name,
    category: asset.category,
    purchasePrice: asset.purchasePrice === 0 ? "" : String(asset.purchasePrice),
    currencyId: asset.currencyId,
    lifespanYears: asset.lifespanYears === 0 ? "" : String(asset.lifespanYears),
    purchaseDate: asset.purchaseDate,
    status: asset.status,
    details: asset.details,
  };
}

export default function AssetsPage() {
  return (
    <ToastProvider>
      <AssetsPageContent />
    </ToastProvider>
  );
}

function AssetsPageContent() {
  const toast = useToast();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(emptyMeta);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [marketId, setMarketId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssetFormValues>(emptyAssetForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * وضعیت loading در هندلرهای کاربر ست می‌شود، نه داخل افکت، تا
   * react-hooks/set-state-in-effect رعایت شود.
   */
  useEffect(() => {
    let cancelled = false;
    fetchAssetsPaginated({
      category: appliedCategory || undefined,
      status: status === ALL ? undefined : (status as AssetStatus),
      page,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return;
        setAssets(result.items);
        setMeta(result.meta);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setAssets([]);
        setError(extractApiErrorMessage(err, "خطا در دریافت دارایی‌ها"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedCategory, status, page, reloadToken]);

  useEffect(() => {
    let cancelled = false;
    fetchAddedCurrencies()
      .then((result) => {
        if (!cancelled) setCurrencies(Array.isArray(result) ? result : []);
      })
      .catch(() => {
        if (!cancelled) setCurrencies([]);
      });

    fetchMyMarket()
      .then((market) => {
        if (!cancelled && market?.id) setMarketId(market.id);
      })
      .catch(() => {
        if (!cancelled) setMarketId("");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currencyName = useCallback(
    (asset: Asset) =>
      asset.currency?.name ||
      asset.currency?.code ||
      currencies.find((c) => c.id === asset.currencyId)?.name ||
      "",
    [currencies],
  );

  /** جستجو فقط ردیف‌های صفحه‌ی جاری را فیلتر می‌کند؛ برای کل نتایج از فیلتر دسته‌بندی استفاده کنید. */
  const visible = useMemo(() => {
    const q = query.trim();
    if (!q) return assets;
    return assets.filter(
      (a) => a.name.includes(q) || a.category.includes(q) || (a.details ?? "").includes(q),
    );
  }, [assets, query]);

  const currentPage = meta.totalPages > 0 ? Math.min(page, meta.totalPages) : 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  function reload() {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }

  function goToPage(next: number) {
    setLoading(true);
    setPage(Math.min(Math.max(1, next), Math.max(1, meta.totalPages)));
  }

  function applyCategoryFilter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAppliedCategory(category.trim());
    setPage(1);
  }

  function changeStatus(value: string | null) {
    setLoading(true);
    setStatus(value ?? ALL);
    setPage(1);
  }

  function clearFilters() {
    setLoading(true);
    setCategory("");
    setAppliedCategory("");
    setStatus(ALL);
    setPage(1);
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyAssetForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(asset: Asset) {
    setEditingId(asset.id);
    setForm(assetToForm(asset));
    setFormError(null);
    setDialogOpen(true);
  }

  /** کلیک روی هر ردیف، صفحه‌ی جزییات همان دارایی را باز می‌کند. */
  function openDetail(asset: Asset) {
    router.push(`/assets/${asset.id}`);
  }

  async function handleDelete(asset: Asset) {
    setDeletingId(asset.id);
    try {
      await deleteAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success("دارایی با موفقیت حذف شد");
      reload();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف دارایی ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const validationError = validateAssetForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAsset(editingId, {
          ...toAssetBody(form),
          status: form.status,
        });
        setAssets((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        toast.success("دارایی با موفقیت بروزرسانی شد");
      } else {
        const created = await createAsset({
          ...toAssetBody(form),
          ...(marketId ? { marketId } : {}),
        });
        setAssets((prev) => [created, ...prev]);
        toast.success("دارایی جدید با موفقیت ثبت شد");
        reload();
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/assets/summary" />}
            >
              <Landmark data-icon="inline-start" />
              خلاصه دارایی‌ها
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              افزودن دارایی جدید
            </Button>
          </div>
        }
      />

      {/* -------------------- Filters -------------------- */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">فیلترها</h2>
        </div>

        <form onSubmit={applyCategoryFilter}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="filter-category">دسته‌بندی</Label>
              <Input
                id="filter-category"
                placeholder="مثلاً: سخت‌افزار"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>وضعیت</Label>
              <Select
                value={status}
                onValueChange={changeStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه وضعیت‌ها">
                    {(value) =>
                      statusFilterOptions.find((o) => o.value === value)?.label ??
                      "همه وضعیت‌ها"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">اعمال فیلتر</Button>
              <Button type="button" variant="outline" onClick={clearFilters}>
                <RefreshCw data-icon="inline-start" />
                حذف فیلترها
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه دارایی‌ها
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({meta.total.toLocaleString("fa-AF")} مورد)
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو در صفحه جاری..."
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
              <TableHead>وضعیت</TableHead>
              <TableHead>قیمت خرید</TableHead>
              <TableHead>استهلاک سالانه</TableHead>
              <TableHead>ارزش دفتری فعلی</TableHead>
              <TableHead>عمر مفید</TableHead>
              <TableHead>تاریخ خرید</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={reload}>
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground"
                >
                  دارایی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              visible.map((asset) => (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openDetail(asset)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {asset.name}
                        </p>
                        {asset.details && (
                          <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                            {asset.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.category || "—"}
                  </TableCell>
                  <TableCell>
                    <AssetStatusBadge status={asset.status} />
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {asset.purchasePrice > 0
                      ? `${formatAmount(asset.purchasePrice)} ${currencyName(asset)}`
                      : "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {asset.annualDepreciation > 0
                      ? formatAmount(asset.annualDepreciation)
                      : "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="font-medium text-foreground">
                    {asset.currentBookValue > 0
                      ? `${formatAmount(asset.currentBookValue)} ${currencyName(asset)}`
                      : "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {asset.lifespanYears > 0 ? `${asset.lifespanYears} سال` : "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {asset.purchaseDate ? isoToDisplay(asset.purchaseDate) : "—"}
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
                        aria-label="ویرایش"
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
                        aria-label="حذف"
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

        {meta.total > 0 && (
          <PaginationBar
            from={startIndex + 1}
            to={Math.min(startIndex + PAGE_SIZE, meta.total)}
            total={meta.total}
            page={currentPage}
            totalPages={meta.totalPages}
            onPageChange={goToPage}
            disabled={loading}
          />
        )}
      </Card>

      {/* -------------------- ایجاد / ویرایش دارایی -------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش دارایی" : "ایجاد دارایی جدید"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "اطلاعات دارایی را ویرایش کنید"
                : "اطلاعات دارایی جدید را وارد کنید"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <AssetFormFields
              values={form}
              onChange={setForm}
              currencies={currencies}
              showStatus={!!editingId}
              idPrefix={editingId ? "edit-asset" : "create-asset"}
            />

            {formError && (
              <p className="mt-5 whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="mt-6 gap-2">
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
                    : "ثبت دارایی"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DatePickerStyles />
    </div>
  );
}
