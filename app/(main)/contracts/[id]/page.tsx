"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Loader2,
  Calendar,
  Coins,
  Landmark,
  User,
  Shield,
  Building2,
  Printer,
} from "lucide-react";
import Image from "next/image";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  fetchContract,
  type Contract,
  type ContractStatus,
} from "@/services/contract.service";
import { fetchShops, type Shop } from "@/services/shop.service";
import { fetchTenants, type Tenant } from "@/services/tenant.service";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import { fetchBankAccounts, type BankAccount } from "@/services/bank-account.service";
import { fetchGuarantors, type Guarantor } from "@/services/guarantor.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider } from "@/components/client/toast";
import {
  loadContractDesignSettings,
  type ContractDesignSettings,
} from "@/lib/shared/contract-design";
import "./contract-print.css";

const CLAUSES: string[] = [
  "مستاجر مکلف است تا کرایه ماهانه را بطور پیشکی در اول هر ماه به مالکین مارکت پرداخت نماید، در غیر آن قرارداد فسخ و دوکان به شخص دیگری به کرایه داده خواهد شد.",
  "مستاجر مکلف است تا تمام هزینه‌های جانبی از قبیل مصارف آب، برق، فاضلاب، حفظ و مراقبت ساختمان، تکس مالیات، مصئونیت، پول جواز کسب و غیره را بموقع آن پرداخت و تصفیه حساب نماید.",
  "در صورتیکه مستاجر قصد فسخ قرار داد را نماید، مکلف است تا یکماه قبل به مالکین خبر داده و در غیر آن باید کرایه یکماه بعد از ترک دوکان را به مالک بپردازد؛ و در صورتیکه مالکین دوکان مورد نظر را ضرورت داشته باشند باید یکماه قبل به مستاجر اطلاع دهند، در غیر آن مالکین نیز از کرایه یکماهه دوکان محروم خواهند شد.",
  "مستاجر مکلف است تا نظافت داخل و بیرون دوکان را بطور جدی مراعات نموده و از تجمع افراد بیکار و مزاحم جلوگیری نماید، در غیر آن قرارداد فسخ و دوکان به شخص دیگری واگذار خواهد شد.",
  "در صورتیکه از جانب مستاجر حادثه‌ی ناخواسته، حوادث جنایی و غیر اخلاقی در داخل دوکان و یا مارکت انجام پذیرد، مستاجر مسئول و جوابگو خواهد بود.",
  "مستاجر مکلف است تا بعد از ختم قرار داد دوکان را به حالت اولیه به مالکین تسلیم نماید، تمدید قرار داد بعد از ختم میعاد به موافقه طرفین انجام خواهد شد.",
  "اجاره‌دار بدون موافقه مالکین نمی‌تواند دوکان را به شخص دیگری به کرایه داده و یا تغییر مسیر دهد. طرفین متعهد به اقرار خویش صادق بوده و من مستاجر یا کرایه‌نشین اقرار می‌نمایم که طبق متن مندرجات فوق عمل نموده و هیچ‌گونه عذری نخواهم آورد.",
];

function Blank({ value }: { value: string }) {
  return (
    <span dir="ltr" className="border-b-[1.5px] border-b-neutral-400 px-0.5 font-semibold text-neutral-900">
      {value.trim() !== "" ? value : "\u00A0"}
    </span>
  );
}

export default function ContractDetailPage() {
  return (
    <ToastProvider>
      <ContractDetailContent />
    </ToastProvider>
  );
}

function ContractDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<ContractDesignSettings | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [conResult, shopResult, tenantResult, curResult, accResult, guarResult] =
        await Promise.allSettled([
          fetchContract(id),
          fetchShops(),
          fetchTenants(),
          fetchAddedCurrencies(),
          fetchBankAccounts(),
          fetchGuarantors(),
        ]);

      if (conResult.status === "fulfilled") {
        setContract(conResult.value);
      } else {
        setError(extractApiErrorMessage(conResult.reason, "خطا در دریافت قرارداد"));
      }
      if (shopResult.status === "fulfilled") setShops(shopResult.value);
      if (tenantResult.status === "fulfilled") setTenants(tenantResult.value);
      if (curResult.status === "fulfilled") setCurrencies(curResult.value);
      if (accResult.status === "fulfilled") setAccounts(accResult.value);
      if (guarResult.status === "fulfilled") setGuarantors(guarResult.value);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت قرارداد"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setDesign(loadContractDesignSettings());
    load();
  }, [load]);

  function getShopName(shopId: string): string {
    const shop = shops.find((s) => s.id === shopId);
    return shop ? (shop.name ?? `دوکان ${shop.shopNumber}`) : "—";
  }

  function getTenantName(tenantId: string): string {
    return tenants.find((t) => t.id === tenantId)?.fullName ?? "—";
  }

  function getCurrencyName(currencyId: string): string {
    const cur = currencies.find((c) => c.id === currencyId);
    return cur ? `${cur.name} (${cur.code})` : "—";
  }

  function getAccountName(accountId: string): string {
    return accounts.find((a) => a.id === accountId)?.name ?? "—";
  }

  function getGuarantorName(guarantorId: string | null): string {
    if (!guarantorId) return "—";
    return guarantors.find((g) => g.id === guarantorId)?.name ?? "—";
  }

  function statusLabel(status: ContractStatus): string {
    switch (status) {
      case "active": return "فعال";
      case "expired": return "منقضی";
      case "terminated": return "ختم شده";
      case "pending": return "انتظار";
      default: return status;
    }
  }

  function statusVariant(status: ContractStatus): "success" | "danger" | "secondary" | "outline" {
    switch (status) {
      case "active": return "success";
      case "terminated": return "danger";
      case "expired": return "outline";
      case "pending": return "secondary";
      default: return "outline";
    }
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("fa-AF");
    } catch {
      return dateStr;
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="جزییات قرارداد" description="در حال بارگذاری..." />
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div>
        <PageHeader title="جزییات قرارداد" description="خطا" />
        <Card className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">
            {error || "قرارداد یافت نشد"}
          </p>
          <Button variant="outline" size="sm" onClick={load}>
            تلاش مجدد
          </Button>
        </Card>
      </div>
    );
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

  return (
    <div>
      {pageStyleTag}
      <PageHeader
        title={`قرارداد ${getShopName(contract.shopId)}`}
        description="جزییات قرارداد اجاره"
        action={
          <div className="flex gap-2">
            <Badge variant={statusVariant(contract.status)}>
              {statusLabel(contract.status)}
            </Badge>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowRight data-icon="inline-start" className="h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handlePrint}>
              <Printer data-icon="inline-start" />
              چاپ قرارداد
            </Button>
          </div>
        }
      />

      {/* اطلاعات اصلی */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 no-print">
        <InfoCard
          icon={<Building2 className="h-4 w-4" />}
          label="دوکان"
          value={getShopName(contract.shopId)}
        />
        <InfoCard
          icon={<User className="h-4 w-4" />}
          label="مستأجر"
          value={getTenantName(contract.tenantId)}
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="تاریخ شروع"
          value={formatDate(contract.startDate)}
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="تاریخ پایان"
          value={formatDate(contract.endDate)}
        />
      </div>

      {/* اطلاعات مالی */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 no-print">
        <InfoCard
          icon={<Coins className="h-4 w-4" />}
          label="کرایه"
          value={`${contract.rent.toLocaleString("fa-AF")} ${getCurrencyName(contract.currencyId)}`}
        />
        <InfoCard
          icon={<Shield className="h-4 w-4" />}
          label="وجه ضمان"
          value={`${contract.securityDeposit.toLocaleString("fa-AF")} ${getCurrencyName(contract.currencyId)}`}
        />
        <InfoCard
          icon={<Shield className="h-4 w-4" />}
          label=" وجه ضمان باقی‌مانده"
          value={`${contract.securityDepositRemaining.toLocaleString("fa-AF")} ${getCurrencyName(contract.currencyId)}`}
        />
        <InfoCard
          icon={<Landmark className="h-4 w-4" />}
          label="حساب وجه ضمان"
          value={getAccountName(contract.securityDepositAccountId)}
        />
      </div>

      {/* اطلاعات تکمیلی */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 no-print">
        <InfoCard
          icon={<FileText className="h-4 w-4" />}
          label="واحد پولی"
          value={getCurrencyName(contract.currencyId)}
        />
        {contract.guarantorId && (
          <InfoCard
            icon={<User className="h-4 w-4" />}
            label="کفيل"
            value={getGuarantorName(contract.guarantorId)}
          />
        )}
        {contract.notes && (
          <InfoCard
            icon={<FileText className="h-4 w-4" />}
            label="یادداشت"
            value={contract.notes}
          />
        )}
      </div>

      {/* پیش‌نمایش سند چاپی */}
      <div className="print-area" style={printPageStyle}>
        <div
          className="w-full max-w-[720px] border border-neutral-300 bg-white shadow-sm print:max-w-none print:border-0 print:shadow-none print:overflow-visible"
          style={printAreaStyle}
        >
          {d?.showHeader !== false && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="shrink-0 text-right">
                  {d?.logoUrl && (
                    <Image
                      src={d.logoUrl}
                      alt="لوگو"
                      width={d?.logoSize ?? 72}
                      height={d?.logoSize ?? 72}
                      className="rounded-full"
                    />
                  )}
                  <div className="mt-2 space-y-1 text-xs">
                    <p>
                      شماره: <Blank value={contract.id.slice(0, 8)} />
                    </p>
                    <p>
                      تاریخ شروع: <Blank value={formatDate(contract.startDate)} />
                    </p>
                    <p>
                      تاریخ پایان: <Blank value={formatDate(contract.endDate)} />
                    </p>
                  </div>
                </div>

                <div className="flex-1 text-center">
                  <h1
                    className="text-[26px] font-extrabold tracking-tight"
                    style={{ color: d?.titleColor ?? "#c2410c" }}
                  >
                    قرارداد اجاره
                  </h1>
                  <p
                    className="font-serif text-base italic"
                    style={{ color: d?.subtitleColor ?? "#e11d48" }}
                  >
                    Rental Agreement
                  </p>
                  <p className="mt-2 text-[15px] font-bold text-blue-800">
                    سند قرارداد اجاره دوکان
                  </p>
                  <p className="text-[13px] font-semibold text-blue-700">
                    {getShopName(contract.shopId)}
                  </p>
                </div>

                <div
                  className="shrink-0 border border-neutral-400"
                  style={{ width: d?.logoSize ?? 72, height: d?.logoSize ?? 72 }}
                />
              </div>

              <div className="my-4 border-t border-neutral-400" />
            </>
          )}

          <p className="text-[15px] font-bold">باعث از تحریر هذا:</p>
          <p className="text-justify" style={{ lineHeight: d?.lineHeight ?? 1.75 }}>
            اینجانب مستأجر <Blank value={getTenantName(contract.tenantId)} /> که دارای
            اهلیت شرعی و قانونی خویش بوده، دوکان ملکیت مالکین که دارای
            نمبر (<Blank value={getShopName(contract.shopId)} />) را از قرار کرایه فی برج مبلغ (
            <Blank value={contract.rent.toLocaleString("fa-AF")} />) (
            {getCurrencyName(contract.currencyId)}) برای مدت از تاریخ (
            <Blank value={formatDate(contract.startDate)} />) الی (
            <Blank value={formatDate(contract.endDate)} />) به کرایه گرفته‌ام.
          </p>

          {contract.securityDeposit > 0 && (
            <p className="mt-2 text-justify" style={{ lineHeight: d?.lineHeight ?? 1.75 }}>
              مبلغ وجه ضمان: <Blank value={contract.securityDeposit.toLocaleString("fa-AF")} /> (
              {getCurrencyName(contract.currencyId)}) که نزد{" "}
              {getAccountName(contract.securityDepositAccountId)} deposited می‌باشد.
            </p>
          )}

          {d?.showClauses !== false && (
            <>
              <p className="mt-4 text-center text-[15px] font-bold">مکلفیت‌های مستاجر یا کرایه‌نشین</p>
              <ol className="mt-2 space-y-2 text-justify text-[14px]" style={{ lineHeight: d?.lineHeight ?? 1.7 }}>
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
            <p className="mt-4 text-center text-xs" dir="rtl">
              (و کان ذلک فی محضر المسلمین)
            </p>
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
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </Card>
  );
}
