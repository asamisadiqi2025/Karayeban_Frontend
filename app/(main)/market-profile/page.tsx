"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Phone,
  MapPin,
  Wallet,
  FileText,
  ImagePlus,
  Trash2,
  Loader2,
  Check,
  Globe,
  Mail,
  Plus,
  Search,
  Banknote,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createMarket, fetchMyMarket } from "@/services/market.service";
import {
  fetchCurrencyCatalog,
  fetchAddedCurrencies,
  addCurrencyToSystem,
  type CurrencyCatalogItem,
  type AddedCurrency,
} from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";

interface MarketProfileForm {
  nameFa: string;
  nameEn: string;
  address: string;
  phone: string;
  email: string;
  subdomain: string;
  baseCurrency: string;
  details: string;
}

const initialForm: MarketProfileForm = {
  nameFa: "",
  nameEn: "",
  address: "",
  phone: "",
  email: "",
  subdomain: "",
  baseCurrency: "",
  details: "",
};

export default function MarketProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MarketProfileForm>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketId, setMarketId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!logoFile && !logoPreview) {
      errors.logo = "انتخاب لوگوی مارکت الزامی است";
    }

    if (!form.nameFa.trim()) {
      errors.nameFa = "نام مارکت (فارسی) الزامی است";
    }

    if (!form.address.trim()) {
      errors.address = "آدرس الزامی است";
    }

    if (!form.phone.trim()) {
      errors.phone = "شماره تماس الزامی است";
    } else if (!/^0\d{9,}$/.test(form.phone.replace(/\s/g, ""))) {
      errors.phone = "شماره تماس معتبر نیست (مثال: 07XXXXXXXX)";
    }

    if (!form.email.trim()) {
      errors.email = "ایمیل الزامی است";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "ایمیل معتبر نیست";
    }

    // if (!form.subdomain.trim()) {
    //   errors.subdomain = "ساب‌دامنه الزامی است";
    // } else if (!/^[a-z0-9-]+$/.test(form.subdomain)) {
    //   errors.subdomain = "ساب‌دامنه فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد";
    // }

    if (!form.baseCurrency) {
      errors.baseCurrency = "انتخاب ارز پایه الزامی است";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Added currencies for base dropdown
  const [addedCurrencies, setAddedCurrencies] = useState<AddedCurrency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  // Currency modal state
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CurrencyCatalogItem[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogDebouncedQuery, setCatalogDebouncedQuery] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [addingCode, setAddingCode] = useState<string | null>(null);
  const [addedCodes, setAddedCodes] = useState<string[]>([]);
  const [currencyFeedback, setCurrencyFeedback] = useState<string | null>(null);
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPageSize = 10;
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch market ID (either existing or after save)
  useEffect(() => {
    let cancelled = false;
    fetchMyMarket()
      .then((m) => { if (!cancelled) setMarketId(m.id); })
      .catch(() => { if (!cancelled) setMarketId(null); });
    return () => { cancelled = true; };
  }, []);

  // Load added currencies for base dropdown
  useEffect(() => {
    let cancelled = false;
    setCurrenciesLoading(true);
    fetchAddedCurrencies()
      .then((res) => { if (!cancelled) setAddedCurrencies(Array.isArray(res) ? res : []); })
      .catch(() => { if (!cancelled) setAddedCurrencies([]); })
      .finally(() => { if (!cancelled) setCurrenciesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function handleChange(field: keyof MarketProfileForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
      setError(null);
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  function handleLogoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setSaved(false);
    const url = URL.createObjectURL(file);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    if (fieldErrors.logo) {
      setFieldErrors((prev) => ({ ...prev, logo: undefined }));
    }
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      const result = await createMarket({
        name: form.nameFa,
        address: form.address,
        subdomain: form.subdomain,
        logo: "",
        baseCurrency: form.baseCurrency,
        phone: form.phone,
        email: form.email,
      });
      setMarketId(result.id);
      setSaved(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "ذخیره اطلاعات مارکت ناموفق بود"));
    } finally {
      setLoading(false);
    }
  }

  // Currency modal - debounce search
  useEffect(() => {
    const t = setTimeout(() => setCatalogDebouncedQuery(catalogQuery), 400);
    return () => clearTimeout(t);
  }, [catalogQuery]);

  const loadCatalog = useCallback(async (search: string) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const data = await fetchCurrencyCatalog(search);
      setCatalogItems(data);
    } catch (err) {
      setCatalogError(extractApiErrorMessage(err, "خطا در دریافت اطلاعات واحدهای پولی"));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currencyOpen) {
      setCatalogPage(1);
      loadCatalog(catalogDebouncedQuery);
    }
  }, [currencyOpen, catalogDebouncedQuery, loadCatalog]);

  // Sync addedCodes when modal opens
  useEffect(() => {
    if (currencyOpen) {
      setAddedCodes(addedCurrencies.map((c) => c.code));
    }
  }, [currencyOpen, addedCurrencies]);

  function showCurrencyFeedback(message: string) {
    setCurrencyFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setCurrencyFeedback(null), 3000);
  }

  async function handleAddCurrency(item: CurrencyCatalogItem) {
    let currentMarketId = marketId;

    // Try to get marketId if not available yet
    if (!currentMarketId) {
      try {
        const m = await fetchMyMarket();
        currentMarketId = m.id;
        setMarketId(m.id);
      } catch {
        showCurrencyFeedback("ابتدا مارکت را ذخیره کنید سپس واحد پولی اضافه کنید");
        return;
      }
    }

    setAddingCode(item.code);
    try {
      await addCurrencyToSystem(item.code);
      setAddedCodes((prev) => (prev.includes(item.code) ? prev : [...prev, item.code]));
      showCurrencyFeedback(`واحد پولی ${item.name} با موفقیت اضافه شد`);
    } catch (err) {
      const msg = extractApiErrorMessage(err, "امکان افزودن این واحد پولی وجود نداشت");
      if (msg.includes("قبلاً")) {
        setAddedCodes((prev) => (prev.includes(item.code) ? prev : [...prev, item.code]));
      }
      showCurrencyFeedback(msg);
    } finally {
      setAddingCode(null);
    }
  }

  const isAdded = (code: string) => addedCodes.includes(code);

  // Modal pagination
  const catalogTotalPages = Math.max(1, Math.ceil(catalogItems.length / catalogPageSize));
  const catalogStart = (catalogPage - 1) * catalogPageSize;
  const paginatedCatalog = catalogItems.slice(catalogStart, catalogStart + catalogPageSize);

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeader
        title="پروفایل مارکت"
        description="اطلاعات پایه مارکت خود را تکمیل و مدیریت کنید"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* لوگو */}
        <Card>
          <CardHeader>
            <CardTitle>لوگوی مارکت <span className="text-destructive">*</span></CardTitle>
            <CardDescription>یک تصویر مربعی با کیفیت مناسب برای لوگو انتخاب کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="لوگوی مارکت"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store className="h-7 w-7 text-muted-foreground" />
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus data-icon="inline-start" />
                  {logoPreview ? "تغییر لوگو" : "انتخاب لوگو"}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="ghost" onClick={handleRemoveLogo}>
                    <Trash2 data-icon="inline-start" />
                    حذف
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </div>
            </div>
            {fieldErrors.logo && (
              <p className="text-xs text-destructive">{fieldErrors.logo}</p>
            )}
          </CardContent>
        </Card>

        {/* اطلاعات مارکت */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات مارکت</CardTitle>
            <CardDescription>این اطلاعات در فاکتورها و مدارک رسمی نمایش داده می‌شود</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-right">
                <Label htmlFor="nameFa">نام مارکت (فارسی) <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nameFa"
                    name="nameFa"
                    placeholder="مثلاً: مارکت کرایه‌بان"
                    className={`pr-9 ${fieldErrors.nameFa ? "border-destructive" : ""}`}
                    value={form.nameFa}
                    onChange={handleChange("nameFa")}
                  />
                </div>
                {fieldErrors.nameFa && (
                  <p className="text-xs text-destructive">{fieldErrors.nameFa}</p>
                )}
              </div>

              <div className="space-y-1.5 text-right">
                <Label htmlFor="nameEn">نام مارکت (انگلیسی)</Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nameEn"
                    name="nameEn"
                    placeholder="e.g. Karayehban Market"
                    className="pr-9"
                    dir="ltr"
                    value={form.nameEn}
                    onChange={handleChange("nameEn")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label htmlFor="address">آدرس دقیق <span className="text-destructive">*</span></Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  name="address"
                  placeholder="آدرس کامل مارکت را وارد کنید"
                  className={`pr-9 ${fieldErrors.address ? "border-destructive" : ""}`}
                  rows={2}
                  value={form.address}
                  onChange={handleChange("address")}
                />
              </div>
              {fieldErrors.address && (
                <p className="text-xs text-destructive">{fieldErrors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-right">
                <Label htmlFor="phone">شماره تماس <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="07XXXXXXXX"
                    className={`pr-9 ${fieldErrors.phone ? "border-destructive" : ""}`}
                    dir="ltr"
                    value={form.phone}
                    onChange={handleChange("phone")}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                )}
              </div>

              <div className="space-y-1.5 text-right">
                <Label htmlFor="email">ایمیل <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="market@example.com"
                    className={`pr-9 ${fieldErrors.email ? "border-destructive" : ""}`}
                    dir="ltr"
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-right">
                <Label htmlFor="subdomain">ساب‌دامنه 
                  {/* <span className="text-destructive">*</span> */}
                  </Label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="subdomain"
                    name="subdomain"
                    placeholder="my-market"
                    className={`pr-9 ${fieldErrors.subdomain ? "border-destructive" : ""}`}
                    dir="ltr"
                    value={form.subdomain}
                    onChange={handleChange("subdomain")}
                  />
                </div>
                {fieldErrors.subdomain && (
                  <p className="text-xs text-destructive">{fieldErrors.subdomain}</p>
                )}
              </div>

              <div className="space-y-1.5 text-right">
                <Label>ارز پایه <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Wallet className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      className={`w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm ${fieldErrors.baseCurrency ? "border-destructive" : ""}`}
                      value={form.baseCurrency}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, baseCurrency: e.target.value }));
                        setSaved(false);
                        setError(null);
                        if (fieldErrors.baseCurrency) {
                          setFieldErrors((prev) => ({ ...prev, baseCurrency: undefined }));
                        }
                      }}
                    >
                      <option value="" disabled>
                        {currenciesLoading ? "در حال بارگذاری..." : "انتخاب کنید"}
                      </option>
                      {addedCurrencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!marketId) {
                        fetchMyMarket().then((m) => { setMarketId(m.id); setCurrencyOpen(true); }).catch(() => {});
                      } else {
                        setCurrencyOpen(true);
                      }
                    }}
                    title="افزودن واحد پولی"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {fieldErrors.baseCurrency && (
                  <p className="text-xs text-destructive">{fieldErrors.baseCurrency}</p>
                )}
                {addedCurrencies.length === 0 && !currenciesLoading && !fieldErrors.baseCurrency && (
                  <p className="text-xs text-muted-foreground">
                    هیچ واحد پولی اضافه نشده — روی + کلیک کنید
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label htmlFor="details">جزییات</Label>
              <div className="relative">
                <FileText className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="details"
                  name="details"
                  placeholder="توضیحات تکمیلی درباره مارکت را وارد کنید"
                  className="pr-9"
                  rows={4}
                  value={form.details}
                  onChange={handleChange("details")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            مارکت با موفقیت ایجاد شد! حالا می‌توانید واحدهای پولی اضافه کنید.
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </form>

      {/* Currency Modal */}
      <Dialog open={currencyOpen} onOpenChange={setCurrencyOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>افزودن واحد پولی</DialogTitle>
            <DialogDescription>
              واحد پولی مورد نظر را جستجو و به سیستم اضافه کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currencyFeedback && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                <Check className="h-4 w-4" />
                {currencyFeedback}
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس کد یا نام..."
                className="w-full pr-9"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
              />
            </div>

            {catalogLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : catalogError ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">{catalogError}</p>
                <Button variant="outline" size="sm" onClick={() => loadCatalog(catalogDebouncedQuery)}>
                  تلاش مجدد
                </Button>
              </div>
            ) : catalogItems.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">واحد پولی‌ای یافت نشد</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">کد</TableHead>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">سیمبول</TableHead>
                      <TableHead className="text-left">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCatalog.map((item) => {
                      const alreadyAdded = isAdded(item.code);
                      return (
                        <TableRow key={item.code} className="hover:bg-muted/40">
                          <TableCell>
                            <span className="inline-flex min-w-[52px] items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                              {item.code}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                                <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.symbol ?? "—"}
                          </TableCell>
                          <TableCell className="text-left">
                            <Button
                              variant={alreadyAdded ? "secondary" : "default"}
                              size="sm"
                              disabled={alreadyAdded || addingCode === item.code}
                              onClick={() => handleAddCurrency(item)}
                            >
                              {addingCode === item.code ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : alreadyAdded ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                              {alreadyAdded ? "اضافه شده" : "افزودن"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {catalogTotalPages > 1 && (
                  <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <p className="text-xs text-muted-foreground">
                      صفحه {catalogPage.toLocaleString("fa-AF")} از{" "}
                      {catalogTotalPages.toLocaleString("fa-AF")} —{" "}
                      {catalogItems.length.toLocaleString("fa-AF")} مورد
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={catalogPage === 1}
                        onClick={() => setCatalogPage(1)}
                      >
                        <ChevronsRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={catalogPage === 1}
                        onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <span className="mx-1 min-w-[50px] text-center text-xs font-medium">
                        {catalogPage.toLocaleString("fa-AF")} / {catalogTotalPages.toLocaleString("fa-AF")}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={catalogPage === catalogTotalPages}
                        onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={catalogPage === catalogTotalPages}
                        onClick={() => setCatalogPage(catalogTotalPages)}
                      >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>بستن</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
