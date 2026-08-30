"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Store,
  Phone,
  MapPin,
  Layers,
  Wallet,
  FileText,
  ImagePlus,
  Trash2,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MarketProfileForm {
  nameFa: string;
  nameEn: string;
  address: string;
  phone: string;
  floorsCount: string;
  baseValue: string;
  details: string;
}

const initialForm: MarketProfileForm = {
  nameFa: "",
  nameEn: "",
  address: "",
  phone: "",
  floorsCount: "",
  baseValue: "",
  details: "",
};

export default function MarketProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MarketProfileForm>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(field: keyof MarketProfileForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
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
    setLoading(true);
    setSaved(false);
    // TODO: اتصال به بک‌اند NestJS
    // 1) در صورت انتخاب لوگوی جدید: آپلود logoFile به /media/upload و دریافت mediaId
    // 2) ارسال PATCH /market-profile با بدنه شامل نام فارسی/انگلیسی، آدرس، تماس،
    //    تعداد طبقات، ارزش پایه، جزییات و mediaId لوگو (در صورت وجود)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSaved(true);
  }

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
            <CardTitle>لوگوی مارکت</CardTitle>
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
                <Label htmlFor="nameFa">نام مارکت (فارسی)</Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nameFa"
                    name="nameFa"
                    placeholder="مثلاً: مارکت کرایه‌بان"
                    className="pr-9"
                    value={form.nameFa}
                    onChange={handleChange("nameFa")}
                    required
                  />
                </div>
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
              <Label htmlFor="address">آدرس دقیق</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  name="address"
                  placeholder="آدرس کامل مارکت را وارد کنید"
                  className="pr-9"
                  rows={2}
                  value={form.address}
                  onChange={handleChange("address")}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-right">
                <Label htmlFor="phone">شماره تماس</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="07XXXXXXXX"
                    className="pr-9"
                    dir="ltr"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <Label htmlFor="floorsCount">تعداد طبقات</Label>
                <div className="relative">
                  <Layers className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="floorsCount"
                    name="floorsCount"
                    type="number"
                    min={0}
                    placeholder="مثلاً: ۳"
                    className="pr-9"
                    dir="ltr"
                    value={form.floorsCount}
                    onChange={handleChange("floorsCount")}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label htmlFor="baseValue">ارزش پایه</Label>
              <div className="relative">
                <Wallet className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                {/* <Input
                  id="baseValue"
                  name="baseValue"
                  type="number"
                  min={0}
                  placeholder="مبلغ به دالر"
                  className="pr-9 pl-14"
                  dir="ltr"
                  value={form.baseValue}
                  onChange={handleChange("baseValue")}
                  required
                /> */}
                <select name="" id="">
                  <option value="">دالر</option>
                  <option value="">افغانی</option>
                  <option value="">تومان</option>
                  <option value="">یورو</option>
                </select>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  دالر
                </span>
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

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-muted-foreground">اطلاعات با موفقیت ذخیره شد</span>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
