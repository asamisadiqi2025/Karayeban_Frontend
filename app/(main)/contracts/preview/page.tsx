"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Printer, Save } from "lucide-react";
import Image from "next/image";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
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

import { fetchShops, type Shop } from "@/services/shop.service";
import { fetchTenants, type Tenant } from "@/services/tenant.service";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";
import { createContract } from "@/services/contract.service";
import { fetchBankAccounts, type BankAccount } from "@/services/bank-account.service";
import { fetchGuarantors, type Guarantor } from "@/services/guarantor.service";
import { ToastProvider, useToast } from "@/components/client/toast";
import {
  loadContractDesignSettings,
  type ContractDesignSettings,
} from "@/lib/shared/contract-design";
import "../contract-print.css";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isoToPersianDate(iso: string): DateObject | undefined {
  if (!iso) return undefined;
  const gregorianDate = new DateObject({ calendar: gregorian, date: iso });
  if (!gregorianDate.isValid) return undefined;
  return gregorianDate.convert(persian);
}

function persianDateToIso(date: DateObject): string {
  const g = new DateObject(date).convert(gregorian);
  return `${g.year}-${pad2(g.month.number)}-${pad2(g.day)}`;
}

interface PreviewForm {
  owner1Name: string;
  owner1Father: string;
  owner1Grandfather: string;
  owner1Tazkira: string;
  owner2Name: string;
  owner2Father: string;
  owner2Grandfather: string;
  owner2Tazkira: string;
  shopId: string;
  shopNumber: string;
  viaLocation: string;
  area: string;
  tenantId: string;
  tenantName: string;
  tenantFather: string;
  tenantGrandfather: string;
  tenantTazkira: string;
  monthlyRentAmount: string;
  monthlyRentInWords: string;
  halfAmount: string;
  currencyId: string;
  durationMonths: string;
  startDate: string;
  endDate: string;
  securityDeposit: string;
  securityDepositAccountId: string;
  guarantorId: string;
  notes: string;
}

const initialForm: PreviewForm = {
  owner1Name: "",
  owner1Father: "",
  owner1Grandfather: "",
  owner1Tazkira: "",
  owner2Name: "",
  owner2Father: "",
  owner2Grandfather: "",
  owner2Tazkira: "",
  shopId: "",
  shopNumber: "",
  viaLocation: "گالریا سنتر",
  area: "",
  tenantId: "",
  tenantName: "",
  tenantFather: "",
  tenantGrandfather: "",
  tenantTazkira: "",
  monthlyRentAmount: "",
  monthlyRentInWords: "",
  halfAmount: "",
  currencyId: "",
  durationMonths: "",
  startDate: "",
  endDate: "",
  securityDeposit: "",
  securityDepositAccountId: "",
  guarantorId: "",
  notes: "",
};

const CLAUSES: string[] = [
  "مستاجر مکلف است تا کرایه ماهانه را بطور پیشکی در اول هر ماه به مالکین مارکت پرداخت نماید، در غیر آن قرارداد فسخ و دوکان به شخص دیگری به کرایه داده خواهد شد.",
  "مستاجر مکلف است تا تمام هزینه‌های جانبی از قبیل مصارف آب، برق، فاضلاب، حفظ و مراقبت ساختمان، تکس مالیات، مصئونیت، پول جواز کسب و غیره را بموقع آن پرداخت و تصفیه حساب نماید.",
  "در صورتیکه مستاجر قصد فسخ قرار داد را نماید، مکلف است تا یکماه قبل به مالکین خبر داده و در غیر آن باید کرایه یکماه بعد از ترک دوکان را به مالک بپردازد.",
  "مستاجر مکلف است تا نظافت داخل و بیرون دوکان را بطور جدی مراعات نموده و از تجمع افراد بیکار و مزاحم جلوگیری نماید.",
  "در صورتیکه از جانب مستاجر حادثه‌ی ناخواسته، حوادث جنایی و غیر اخلاقی در داخل دوکان و یا مارکت انجام پذیرد، مستاجر مسئول و جوابگو خواهد بود.",
  "مستاجر مکلف است تا بعد از ختم قرار داد دوکان را به حالت اولیه به مالکین تسلیم نماید.",
  "اجاره‌دار بدون موافقه مالکین نمی‌تواند دوکان را به شخص دیگری به کرایه داده و یا تغییر مسیر دهد.",
];

function Blank({ value }: { value: string }) {
  return (
    <span dir="ltr" className="border-b-[1.5px] border-b-neutral-400 px-0.5 font-semibold text-neutral-900">
      {value.trim() !== "" ? value : "\u00A0"}
    </span>
  );
}

export default function ContractPreviewPage() {
  return (
    <ToastProvider>
      <ContractPreviewContent />
    </ToastProvider>
  );
}

function ContractPreviewContent() {
  const router = useRouter();
  const toast = useToast();
  const [design] = useState<ContractDesignSettings>(() => loadContractDesignSettings());
  const [form, setForm] = useState<PreviewForm>(initialForm);

  const [shops, setShops] = useState<Shop[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchShops(), fetchTenants(), fetchAddedCurrencies(), fetchBankAccounts(), fetchGuarantors()]).then(
      ([shopResult, tenantResult, curResult, accResult, guarResult]) => {
        if (cancelled) return;
        if (shopResult.status === "fulfilled") setShops(shopResult.value);
        if (tenantResult.status === "fulfilled") setTenants(tenantResult.value);
        if (curResult.status === "fulfilled") setCurrencies(curResult.value);
        if (accResult.status === "fulfilled") setAccounts(accResult.value);
        if (guarResult.status === "fulfilled") setGuarantors(guarResult.value);
        if (shopResult.status === "rejected")
          setError(extractApiErrorMessage(shopResult.reason, "خطا در بارگذاری دوکان‌ها"));
        if (tenantResult.status === "rejected")
          setError(extractApiErrorMessage(tenantResult.reason, "خطا در بارگذاری مستأجران"));
      }
    ).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function update<K extends keyof PreviewForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleShopChange(shopId: string | null) {
    if (!shopId) return;
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    setForm((prev) => ({
      ...prev,
      shopId: shop.id,
      shopNumber: shop.shopNumber ?? "",
      area: shop.area ? String(shop.area) : "",
      viaLocation: shop.location ?? prev.viaLocation,
    }));
  }

  function handleTenantChange(tenantId: string | null) {
    if (!tenantId) return;
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) return;
    setForm((prev) => ({
      ...prev,
      tenantId: tenant.id,
      tenantName: tenant.fullName ?? "",
      tenantFather: tenant.fatherName ?? "",
      tenantGrandfather: "",
      tenantTazkira: tenant.idNumber ?? "",
    }));
  }

  const halfAmountDisplay = useMemo(() => {
    if (form.halfAmount.trim() !== "") return form.halfAmount;
    const amount = Number.parseFloat(form.monthlyRentAmount);
    return Number.isFinite(amount) ? String(amount / 2) : "";
  }, [form.halfAmount, form.monthlyRentAmount]);

  function handlePrint() {
    window.print();
  }

  async function handleSave() {
    if (!form.shopId) { toast.error("دوکان را انتخاب کنید"); return; }
    if (!form.tenantId) { toast.error("مستأجر را انتخاب کنید"); return; }
    if (!form.startDate) { toast.error("تاریخ شروع را وارد کنید"); return; }
    if (!form.endDate) { toast.error("تاریخ پایان را وارد کنید"); return; }
    if (!form.monthlyRentAmount || Number(form.monthlyRentAmount) < 0) { toast.error("کرایه را وارد کنید"); return; }
    if (!form.currencyId) { toast.error("واحد پولی را انتخاب کنید"); return; }

    setSaving(true);
    try {
      await createContract({
        shopId: form.shopId,
        tenantId: form.tenantId,
        startDate: form.startDate,
        endDate: form.endDate,
        rent: Number(form.monthlyRentAmount),
        currencyId: form.currencyId,
        securityDeposit: Number(form.securityDeposit) || 0,
        securityDepositAccountId: form.securityDepositAccountId || "",
        guarantorId: form.guarantorId || null,
        notes: form.notes || null,
      });
      toast.success("قرارداد با موفقیت ذخیره شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ذخیره قرارداد ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  const d = design;

  const printAreaStyle: React.CSSProperties = d
    ? {
        fontFamily: `"${d.fontFamily}", Tahoma, Arial, sans-serif`,
        fontSize: `${d.fontSize}px`,
        lineHeight: d.lineHeight,
        color: d.textColor,
        direction: d.direction,
        padding: `${d.paddingTop}px ${d.paddingRight}px ${d.paddingBottom}px ${d.paddingLeft}px`,
        backgroundColor: d.backgroundColor || "#ffffff",
        backgroundImage: d.backgroundImage ? `url(${d.backgroundImage})` : undefined,
        backgroundSize: d.backgroundImage ? "cover" : undefined,
        backgroundPosition: d.backgroundImage ? "center" : undefined,
        backgroundRepeat: d.backgroundImage ? "no-repeat" : undefined,
      }
    : {};

  const printPageStyle: React.CSSProperties = d
    ? {
        marginTop: `${d.marginTop}mm`,
        marginBottom: `${d.marginBottom}mm`,
        marginLeft: `${d.marginLeft}mm`,
        marginRight: `${d.marginRight}mm`,
      }
    : {};

  const pageStyleTag = useMemo(() => {
    if (!d) return null;
    return (
      <style>{`
        @page {
          size: ${d.pageWidth || "210mm"} ${d.pageHeight || "297mm"};
          margin: ${d.marginTop}mm ${d.marginRight}mm ${d.marginBottom}mm ${d.marginLeft}mm;
        }
      `}</style>
    );
  }, [d]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">در حال بارگذاری...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>تلاش مجدد</Button>
      </div>
    );
  }

  return (
    <div>
      {pageStyleTag}
      <PageHeader
        title="پیش‌نمایش سند قرارداد"
        description="اطلاعات را وارد کنید؛ پیش‌نمایش به‌صورت زنده به‌روز می‌شود"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowRight data-icon="inline-start" className="h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handlePrint}>
              <Printer data-icon="inline-start" />
              چاپ سند
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
              <Save data-icon="inline-start" />
              {saving ? "در حال ذخیره..." : "ذخیره قرارداد"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 overflow-visible lg:grid-cols-[1fr_2fr]">
        {/* Form Panel */}
        <div className="no-print space-y-3 overflow-visible">
          <Card className="space-y-3 p-3">
            <h3 className="text-xs font-semibold text-foreground">مالک اول</h3>
            <Input placeholder="نام" value={form.owner1Name} onChange={(e) => update("owner1Name", e.target.value)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input placeholder="ولد" value={form.owner1Father} onChange={(e) => update("owner1Father", e.target.value)} />
              <Input placeholder="ولدیت" value={form.owner1Grandfather} onChange={(e) => update("owner1Grandfather", e.target.value)} />
            </div>
            <Input placeholder="نمبر تذکره" value={form.owner1Tazkira} onChange={(e) => update("owner1Tazkira", e.target.value)} />
          </Card>

          <Card className="space-y-3 p-3">
            <h3 className="text-xs font-semibold text-foreground">مالک دوم</h3>
            <Input placeholder="نام" value={form.owner2Name} onChange={(e) => update("owner2Name", e.target.value)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input placeholder="ولد" value={form.owner2Father} onChange={(e) => update("owner2Father", e.target.value)} />
              <Input placeholder="ولدیت" value={form.owner2Grandfather} onChange={(e) => update("owner2Grandfather", e.target.value)} />
            </div>
            <Input placeholder="نمبر تذکره" value={form.owner2Tazkira} onChange={(e) => update("owner2Tazkira", e.target.value)} />
          </Card>

          <Card className="space-y-3 p-3">
            <h3 className="text-xs font-semibold text-foreground">دوکان</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">انتخاب دوکان</Label>
              <Select value={form.shopId} onValueChange={handleShopChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب دوکان از دیتابیس">
                    {(value) => {
                      const shop = shops.find((s) => s.id === value);
                      return shop ? `${shop.shopNumber} - ${shop.name ?? ""}` : "انتخاب دوکان از دیتابیس";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {shops.length === 0
                    ? <SelectItem value="__none__" disabled>دوکانی تعریف نشده</SelectItem>
                    : shops.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.shopNumber} - {s.name ?? ""} {s.area ? `(${s.area} متر مربع)` : ""}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">نمبر دوکان</Label>
                <Input placeholder="نمبر دوکان" value={form.shopNumber} onChange={(e) => update("shopNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">مساحت (متر مربع)</Label>
                <Input placeholder="مساحت" value={form.area} onChange={(e) => update("area", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">از طریق / موقعیت</Label>
              <Input placeholder="از طریق / موقعیت" value={form.viaLocation} onChange={(e) => update("viaLocation", e.target.value)} />
            </div>
          </Card>

          <Card className="space-y-3 p-3">
            <h3 className="text-xs font-semibold text-foreground">مستأجر</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">انتخاب مستأجر</Label>
              <Select value={form.tenantId} onValueChange={handleTenantChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب مستأجر از دیتابیس">
                    {(value) => tenants.find((t) => t.id === value)?.fullName ?? "انتخاب مستأجر از دیتابیس"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenants.length === 0
                    ? <SelectItem value="__none__" disabled>مستأجری تعریف نشده</SelectItem>
                    : tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.fullName} {t.fatherName ? `- ولد ${t.fatherName}` : ""}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="نام" value={form.tenantName} onChange={(e) => update("tenantName", e.target.value)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">ولد</Label>
                <Input placeholder="ولد" value={form.tenantFather} onChange={(e) => update("tenantFather", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ولدیت</Label>
                <Input placeholder="ولدیت" value={form.tenantGrandfather} onChange={(e) => update("tenantGrandfather", e.target.value)} />
              </div>
            </div>
            <Input placeholder="نمبر تذکره" value={form.tenantTazkira} onChange={(e) => update("tenantTazkira", e.target.value)} />
          </Card>

          <Card className="space-y-3 p-3 overflow-visible">
            <h3 className="text-xs font-semibold text-foreground">شرایط کرایه</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">کرایه فی برج</Label>
                <Input placeholder="کرایه فی برج" type="number" dir="ltr" value={form.monthlyRentAmount} onChange={(e) => update("monthlyRentAmount", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">مبلغ مناصفه</Label>
                <Input placeholder="مبلغ مناصفه" dir="ltr" value={form.halfAmount} onChange={(e) => update("halfAmount", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">کرایه به حروف</Label>
              <Input placeholder="کرایه به حروف" value={form.monthlyRentInWords} onChange={(e) => update("monthlyRentInWords", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">واحد پولی</Label>
              <Select value={form.currencyId} onValueChange={(v) => update("currencyId", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب واحد پولی">
                    {(value) => currencies.find((c) => c.id === value)?.name ?? "انتخاب واحد پولی"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.length === 0
                    ? <SelectItem value="__none__" disabled>واحد پولی تعریف نشده</SelectItem>
                    : currencies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">مدت (ماه)</Label>
              <Input placeholder="مدت (ماه)" type="number" dir="ltr" value={form.durationMonths} onChange={(e) => update("durationMonths", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative z-50 min-w-0 space-y-1.5">
                <Label className="text-xs">تاریخ شروع</Label>
                <DatePicker
                  calendar={persian}
                  locale={afghanLocale}
                  calendarPosition="bottom-right"
                  placeholder="تاریخ شروع"
                  containerClassName="!w-full"
                  className="!w-full"
                  value={isoToPersianDate(form.startDate)}
                  onChange={(date) => {
                    if (date?.isValid) update("startDate", persianDateToIso(date));
                  }}
                />
              </div>
              <div className="relative z-50 min-w-0 space-y-1.5">
                <Label className="text-xs">تاریخ پایان</Label>
                <DatePicker
                  calendar={persian}
                  locale={afghanLocale}
                  calendarPosition="bottom-right"
                  placeholder="تاریخ پایان"
                  containerClassName="!w-full"
                  className="!w-full"
                  value={isoToPersianDate(form.endDate)}
                  onChange={(date) => {
                    if (date?.isValid) update("endDate", persianDateToIso(date));
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">وجه ضمان</Label>
                <Input placeholder="مبلغ وجه ضمان" type="number" dir="ltr" value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">حساب وجه ضمان</Label>
                <Select value={form.securityDepositAccountId} onValueChange={(v) => update("securityDepositAccountId", v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب حساب">
                      {(value) => accounts.find((a) => a.id === value)?.name ?? "انتخاب حساب"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0
                      ? <SelectItem value="__none__" disabled>حسابی تعریف نشده</SelectItem>
                      : accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.currencyCode ?? a.type})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 p-3">
            <h3 className="text-xs font-semibold text-foreground">کفالت (اختیاری)</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">انتخاب کفيل</Label>
              <Select value={form.guarantorId} onValueChange={(v) => update("guarantorId", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب کفيل (اختیاری)">
                    {(value) => guarantors.find((g) => g.id === value)?.name ?? "انتخاب کفيل (اختیاری)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون کفيل</SelectItem>
                  {guarantors.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} {g.contact ? `(${g.contact})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="space-y-3 p-3">
            <h3 className="text-xs font-semibold text-foreground">یادداشت‌ها (اختیاری)</h3>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              placeholder="یادداشت‌ها درباره قرارداد..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="print-area flex justify-center overflow-x-auto" style={printPageStyle}>
          <div
            className="w-full min-w-0 max-w-[720px] border border-neutral-300 bg-white p-4 text-[15px] leading-7 text-neutral-800 shadow-sm sm:p-6"
            style={printAreaStyle}
          >
            {d?.showHeader !== false && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="shrink-0 text-right">
                    {d?.logoUrl && (
                      <Image src={d.logoUrl} alt="لوگو"
                        width={d?.logoSize ?? 72} height={d?.logoSize ?? 72}
                        className="rounded-full" />
                    )}
                    <div className="mt-2 space-y-1 text-xs">
                      <p>شماره: <Blank value={form.shopNumber} /></p>
                      <p>تاریخ: <Blank value={form.startDate} /></p>
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <h1 className="text-[26px] font-extrabold tracking-tight"
                      style={{ color: d?.titleColor ?? "#c2410c" }}>
                      گالریا سنتر
                    </h1>
                    <p className="font-serif text-base italic"
                      style={{ color: d?.subtitleColor ?? "#e11d48" }}>
                      Galeria Center
                    </p>
                    <p className="mt-2 text-[15px] font-bold text-blue-800">
                      سند کرایه خط دوکاکین گالریا سنتر
                    </p>
                  </div>
                  <div className="shrink-0 border border-neutral-400"
                    style={{ width: d?.logoSize ?? 72, height: d?.logoSize ?? 72 }} />
                </div>
                <div className="my-4 border-t border-neutral-400" />
              </>
            )}

            <p className="text-[15px] font-bold">باعث از تحریر هذا:</p>
            <p className="text-justify leading-7">
              اینجانب <Blank value={form.owner1Name} /> ولد{" "}
              <Blank value={form.owner1Father} /> ولدیت{" "}
              <Blank value={form.owner1Grandfather} /> دارنده تذکره نمبر (
              <Blank value={form.owner1Tazkira} />) و{" "}
              <Blank value={form.owner2Name} /> ولد{" "}
              <Blank value={form.owner2Father} /> ولدیت{" "}
              <Blank value={form.owner2Grandfather} /> دارنده تذکره نمبر (
              <Blank value={form.owner2Tazkira} />)،
              دو نفر مالکین که دارای اهلیت شرعی و قانونی خویش بوده و می‌باشیم،
              یکدربندر دوکان ملکیت شخصی مایان که دارای نمبر (
              <Blank value={form.shopNumber} />) از طریق{" "}
              <Blank value={form.viaLocation} /> به مساحت (
              <Blank value={form.area} />) متر مربع بالای محترم{" "}
              <Blank value={form.tenantName} /> ولد{" "}
              <Blank value={form.tenantFather} /> ولدیت{" "}
              <Blank value={form.tenantGrandfather} /> دارنده تذکره نمبر (
              <Blank value={form.tenantTazkira} />) که موصوف نیز
              دارای اهلیت شرعی و قانونی خویش بوده، از قرار کرایه فی برج مبلغ (
              <Blank value={form.monthlyRentAmount} />) (حروف:{" "}
              <Blank value={form.monthlyRentInWords} />) که مناصفه آن مبلغ (
              <Blank value={halfAmountDisplay} />) می‌شود، برای مدت (
              <Blank value={form.durationMonths} />) برج، اعتبار از تاریخ (
              <Blank value={form.startDate} />) الی (
              <Blank value={form.endDate} />) به کرایه داده‌ایم.
            </p>

            {d?.showClauses !== false && (
              <>
                <p className="mt-4 text-center text-[15px] font-bold">مکلفیت‌های مستاجر یا کرایه‌نشین</p>
                <ol className="mt-2 space-y-2 text-justify text-[14px] leading-[1.7]">
                  {CLAUSES.map((clause, index) => (
                    <li key={index}>
                      <span className="font-bold">{index + 1}- </span>
                      {clause}
                    </li>
                  ))}
                </ol>
              </>
            )}

            {d?.showFooter !== false && (
              <p className="mt-4 text-center text-xs" dir="rtl">(و کان ذلک فی محضر المسلمین)</p>
            )}

            {d?.showSignature !== false && (
              <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 text-center text-[14px]">
                <div className="space-y-6">
                  <p className="font-semibold">امضاء و نشان مالکین</p>
                  <div className="h-12 border-t border-dotted border-neutral-500" />
                </div>
                <div className="space-y-6">
                  <p className="font-semibold">امضاء و نشان مستاجر</p>
                  <div className="h-12 border-t border-dotted border-neutral-500" />
                </div>
                <div className="space-y-6">
                  <p className="font-semibold">امضاء و نشان شاهد</p>
                  <div className="h-12 border-t border-dotted border-neutral-500" />
                </div>
                <div className="space-y-6">
                  <p className="font-semibold">امضاء و نشان شاهد</p>
                  <div className="h-12 border-t border-dotted border-neutral-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
