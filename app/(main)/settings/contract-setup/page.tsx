"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import Image from "next/image";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import afghanLocale  from "@/lib/date-picker/afghan-locale";
import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "./contract-print.css";

interface ContractData {
  documentNumber: string;
  documentDate: string;
  baseRent: string;

  owner1Name: string;
  owner1Father: string;
  owner1Grandfather: string;
  owner1Tazkira: string;

  owner2Name: string;
  owner2Father: string;
  owner2Grandfather: string;
  owner2Tazkira: string;

  shopNumber: string;
  viaLocation: string;
  area: string;

  tenantName: string;
  tenantFather: string;
  tenantGrandfather: string;
  tenantTazkira: string;

  monthlyRentAmount: string;
  monthlyRentInWords: string;
  halfAmount: string;
  durationMonths: string;
  startDate: string;
  endDate: string;
}

const initialData: ContractData = {
  documentNumber: "28",
  documentDate: "",
  baseRent: "55000",

  owner1Name: "حاجی محمد داود عادلیار",
  owner1Father: "جمعه خان",
  owner1Grandfather: "حیدر خان",
  owner1Tazkira: "178",

  owner2Name: "انجنیر سید اسماعیل امیری",
  owner2Father: "مرحوم سید معصوم امیری",
  owner2Grandfather: "سید امیر",
  owner2Tazkira: "73",

  shopNumber: "134",
  viaLocation: "گالریا سنتر",
  area: "17",

  tenantName: "",
  tenantFather: "",
  tenantGrandfather: "",
  tenantTazkira: "",

  monthlyRentAmount: "55000",
  monthlyRentInWords: "پنجاه و پنج هزار",
  halfAmount: "",
  durationMonths: "",
  startDate: "",
  endDate: "",
};

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
    <span className="border-b-[1.5px] border-b-neutral-400 px-0.5 font-semibold text-neutral-900">
      {value.trim() !== "" ? value : "\u00A0"}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function GaleriaContractPage() {
  const [data, setData] = useState<ContractData>(initialData);

  function set<K extends keyof ContractData>(key: K) {
    return (value: string) => setData((prev) => ({ ...prev, [key]: value }));
  }

  const halfAmountDisplay = useMemo(() => {
    if (data.halfAmount.trim() !== "") return data.halfAmount;
    const amount = Number.parseFloat(data.monthlyRentAmount);
    return Number.isFinite(amount) ? String(amount / 2) : "";
  }, [data.halfAmount, data.monthlyRentAmount]);

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <PageHeader
        title="سند کرایه دوکاکین گالریا سنتر"
        description="اطلاعات متغیر سند را وارد کنید؛ پیش‌نمایش سمت راست به‌صورت زنده به‌روز می‌شود"
        action={
          <Button onClick={handlePrint}>
            <Printer data-icon="inline-start" />
            چاپ سند
          </Button>
        }
      />

      {/* <div className="grid grid-cols-1 gap-3 xl:grid-cols-[420px_1fr]"> */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
        {/* ————— فورم ویرایش (فقط در چاپ مخفی می‌شود) ————— */}
        <div className="no-print space-y-4">
          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">اطلاعات سند</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="شماره" value={data.documentNumber} onChange={set("documentNumber")} />
              <div className="space-y-1.5">
                <Label className="text-xs">تاریخ</Label>
                <DatePicker
                  calendar={persian}
                  locale={afghanLocale}
                  calendarPosition="bottom-right"
                  placeholder="تاریخ را انتخاب کنید"
                  value={data.documentDate || undefined}
                  onChange={(date) => {
                    if (date?.isValid) {
                      set("documentDate")(date.format());
                    }
                  }}
                />
              </div>
            </div>
            <Field label="اصل کرایه" value={data.baseRent} onChange={set("baseRent")} />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">مالک اول</h3>
            <Field label="نام" value={data.owner1Name} onChange={set("owner1Name")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="ولد (نام پدر)" value={data.owner1Father} onChange={set("owner1Father")} />
              <Field
                label="ولدیت (نام پدرکلان)"
                value={data.owner1Grandfather}
                onChange={set("owner1Grandfather")}
              />
            </div>
            <Field label="نمبر تذکره" value={data.owner1Tazkira} onChange={set("owner1Tazkira")} />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">مالک دوم</h3>
            <Field label="نام" value={data.owner2Name} onChange={set("owner2Name")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="ولد (نام پدر)" value={data.owner2Father} onChange={set("owner2Father")} />
              <Field
                label="ولدیت (نام پدرکلان)"
                value={data.owner2Grandfather}
                onChange={set("owner2Grandfather")}
              />
            </div>
            <Field label="نمبر تذکره" value={data.owner2Tazkira} onChange={set("owner2Tazkira")} />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">اطلاعات دوکان</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="نمبر دوکان" value={data.shopNumber} onChange={set("shopNumber")} />
              <Field label="مساحت (متر مربع)" value={data.area} onChange={set("area")} />
            </div>
            <Field label="از طریق / موقعیت" value={data.viaLocation} onChange={set("viaLocation")} />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">مستاجر</h3>
            <Field label="نام" value={data.tenantName} onChange={set("tenantName")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="ولد (نام پدر)" value={data.tenantFather} onChange={set("tenantFather")} />
              <Field
                label="ولدیت (نام پدرکلان)"
                value={data.tenantGrandfather}
                onChange={set("tenantGrandfather")}
              />
            </div>
            <Field label="نمبر تذکره" value={data.tenantTazkira} onChange={set("tenantTazkira")} />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">شرایط کرایه</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="کرایه فی برج (عدد)"
                value={data.monthlyRentAmount}
                onChange={set("monthlyRentAmount")}
              />
              <Field label="مبلغ مناصفه" value={data.halfAmount} onChange={set("halfAmount")} placeholder={halfAmountDisplay} />
            </div>
            <Field
              label="کرایه به حروف"
              value={data.monthlyRentInWords}
              onChange={set("monthlyRentInWords")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="مدت (یک ماه)" value={data.durationMonths} onChange={set("durationMonths")} />
              <div />
              <div className="space-y-1.5">
                <Label className="text-xs">از تاریخ</Label>
                <DatePicker
                  calendar={persian}
                  locale={afghanLocale}
                  calendarPosition="bottom-right"
                  placeholder="تاریخ شروع"
                  value={data.startDate || undefined}
                  onChange={(date) => {
                    if (date?.isValid) {
                      set("startDate")(date.format());
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الی تاریخ</Label>
                <DatePicker
                  calendar={persian}
                  locale={afghanLocale}
                  calendarPosition="bottom-right"
                  placeholder="تاریخ پایان"
                  value={data.endDate || undefined}
                  onChange={(date) => {
                    if (date?.isValid) {
                      set("endDate")(date.format());
                    }
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* ————— پیش‌نمایش سند (دقیقاً همان چیزی که چاپ می‌شود) ————— */}
        <div className="print-area flex justify-center">
          <div
            dir="rtl"
            className="w-full max-w-[720px] border border-neutral-300 bg-white p-6 text-[15px] leading-7 text-neutral-800 shadow-sm print:max-w-none print:border-0 print:shadow-none print:overflow-visible"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="shrink-0 text-right">
                <Image
                  src="/galeria-logo.png"
                  alt="لوگوی گالریا سنتر"
                  width={72}
                  height={72}
                  className="rounded-full"
                />
                <div className="mt-2 space-y-1 text-xs">
                  <p>
                    شماره: <Blank value={data.documentNumber} />
                  </p>
                  <p>
                    تاریخ: <Blank value={data.documentDate} />
                  </p>
                  <p>
                    اصل کرایه: <Blank value={data.baseRent} />
                  </p>
                </div>
              </div>

              <div className="flex-1 text-center">
                <h1 className="text-[26px] font-extrabold tracking-tight text-orange-700">گالریا سنتر</h1>
                <p className="font-serif text-base italic text-rose-500">Galeria Center</p>
                <p className="mt-2 text-[15px] font-bold text-blue-800">
                  سند کرایه خط دوکاکین گالریا سنتر
                </p>
                <p className="text-[13px] font-semibold text-blue-700">
                  واقع جاده جنوبی مسجد جامع بزرگ هرات
                </p>
              </div>

              <div className="h-[72px] w-[72px] shrink-0 border border-neutral-400" />
            </div>

            <div className="my-4 border-t border-neutral-400" />

            <p className="text-[15px] font-bold">باعث از تحریر هذا:</p>
            <p className="text-justify leading-7">
              اینجانب <Blank value={data.owner1Name} /> ولد{""}
              <Blank value={data.owner1Father} /> ولدیت <Blank value={data.owner1Grandfather} /> دارنده
              تذکره نمبر (<Blank value={data.owner1Tazkira} />) و{""}
              <Blank value={data.owner2Name} /> ولد{""}
              <Blank value={data.owner2Father} /> ولدیت <Blank value={data.owner2Grandfather} /> دارنده
              تذکره نمبر (<Blank value={data.owner2Tazkira} />)، دو نفر مالکین که
              دارای اهلیت شرعی و قانونی خویش بوده و می‌باشیم، یکدربندر دوکان ملکیت شخصی مایان که دارای
              نمبر (<Blank value={data.shopNumber} />) از طریق{" "}
              <Blank value={data.viaLocation} /> به مساحت (
              <Blank value={data.area} />) متر مربع بالای محترم{" "}
              <Blank value={data.tenantName} /> ولد{""}
              <Blank value={data.tenantFather} /> ولدیت <Blank value={data.tenantGrandfather} /> دارنده
              تذکره نمبر (<Blank value={data.tenantTazkira} />) که موصوف نیز
              دارای اهلیت شرعی و قانونی خویش بوده، از قرار کرایه فی برج مبلغ (
              <Blank value={data.monthlyRentAmount} />) (حروف:{" "}
              <Blank value={data.monthlyRentInWords} />) که مناصفه آن مبلغ (
              <Blank value={halfAmountDisplay} />) می‌شود، برای مدت (
              <Blank value={data.durationMonths} />) برج، اعتبار از تاریخ (
              <Blank value={data.startDate} />) الی (
              <Blank value={data.endDate} />) به کرایه داده‌ایم.
            </p>

            <p className="mt-4 text-center text-[15px] font-bold">مکلفیت‌های مستاجر یا کرایه‌نشین</p>

            <ol className="mt-2 space-y-2 text-justify text-[14px] leading-[1.7]">
              {CLAUSES.map((clause, index) => (
                <li key={index}>
                  <span className="font-bold">{index + 1}- </span>
                  {clause}
                </li>
              ))}
            </ol>

            <p className="mt-4 text-center text-xs" dir="rtl">
              (و کان ذلک فی محضر المسلمین)
            </p>

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
          </div>
        </div>
      </div>
    </div>
  );
}
