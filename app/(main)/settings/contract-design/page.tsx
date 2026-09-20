"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Save, RotateCcw, Loader2 } from "lucide-react";

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
  loadContractDesignSettings,
  saveContractDesignSettings,
  defaultContractDesignSettings,
  PAPER_SIZE_PRESETS,
  type PaperSizePreset,
  type ContractDesignSettings,
} from "@/lib/shared/contract-design";

export type { ContractDesignSettings };

const FONT_OPTIONS = [
  { label: "B Nazanin", value: "B Nazanin" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "IranSans", value: "IranSans" },
  { label: "Vazir", value: "Vazir" },
];

export default function ContractDesignPage() {
  const [settings, setSettings] = useState<ContractDesignSettings>(defaultContractDesignSettings);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadContractDesignSettings());
    setLoaded(true);
  }, []);

  function update<K extends keyof ContractDesignSettings>(
    key: K,
    value: ContractDesignSettings[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        update("backgroundImage", reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  function handleRemoveBackgroundImage() {
    update("backgroundImage", "");
    if (bgFileInputRef.current) bgFileInputRef.current.value = "";
  }

  function handleSave() {
    setSaving(true);
    saveContractDesignSettings(settings);
    setTimeout(() => {
      setSaving(false);
    }, 500);
  }

  function handleReset() {
    setSettings(defaultContractDesignSettings);
    saveContractDesignSettings(defaultContractDesignSettings);
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader title="طراحی قرارداد" description="در حال بارگذاری..." />
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="طراحی قرارداد"
        description="تنظیمات ظاهری و طراحی سند قرارداد"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw data-icon="inline-start" />
              بازنشانی
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Save data-icon="inline-start" />
              )}
              ذخیره تنظیمات
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* حاشیه (Margin) */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-foreground">حاشیه (Margin)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="marginTop">بالا</Label>
              <div className="relative">
                <Input
                  id="marginTop"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.marginTop}
                  onChange={(e) => update("marginTop", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="marginBottom">پایین</Label>
              <div className="relative">
                <Input
                  id="marginBottom"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.marginBottom}
                  onChange={(e) => update("marginBottom", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="marginLeft">چپ</Label>
              <div className="relative">
                <Input
                  id="marginLeft"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.marginLeft}
                  onChange={(e) => update("marginLeft", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="marginRight">راست</Label>
              <div className="relative">
                <Input
                  id="marginRight"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.marginRight}
                  onChange={(e) => update("marginRight", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* فاصله داخلی (Padding) */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-foreground">فاصله داخلی (Padding)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="paddingTop">بالا</Label>
              <div className="relative">
                <Input
                  id="paddingTop"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.paddingTop}
                  onChange={(e) => update("paddingTop", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  px
                </span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="paddingBottom">پایین</Label>
              <div className="relative">
                <Input
                  id="paddingBottom"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.paddingBottom}
                  onChange={(e) => update("paddingBottom", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  px
                </span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="paddingLeft">چپ</Label>
              <div className="relative">
                <Input
                  id="paddingLeft"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.paddingLeft}
                  onChange={(e) => update("paddingLeft", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  px
                </span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="paddingRight">راست</Label>
              <div className="relative">
                <Input
                  id="paddingRight"
                  type="number"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="pl-10"
                  value={settings.paddingRight}
                  onChange={(e) => update("paddingRight", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  px
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* لوگو */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-foreground">لوگو</h3>
          <div className="space-y-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="logoUrl">آدرس لوگو</Label>
              <Input
                id="logoUrl"
                placeholder="/galeria-logo.png"
                value={settings.logoUrl}
                onChange={(e) => update("logoUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="logoSize">اندازه لوگو</Label>
              <div className="relative">
                <Input
                  id="logoSize"
                  type="number"
                  min="20"
                  max="200"
                  dir="ltr"
                  className="pl-10"
                  value={settings.logoSize}
                  onChange={(e) => update("logoSize", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  px
                </span>
              </div>
            </div>
            {settings.logoUrl && (
              <div className="flex justify-center rounded-lg border border-dashed p-4">
                <img
                  src={settings.logoUrl}
                  alt="پیش‌نمایش لوگو"
                  style={{ width: settings.logoSize, height: settings.logoSize }}
                  className="rounded-full object-contain"
                />
              </div>
            )}
          </div>
        </Card>

        {/* فونت */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-foreground">فونت</h3>
          <div className="space-y-4">
            <div className="space-y-2 text-right">
              <Label>فونت</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(v) => update("fontFamily", v ?? "B Nazanin")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب فونت">
                    {(value) => value || "B Nazanin"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label htmlFor="fontSize">اندازه فونت</Label>
                <div className="relative">
                <Input
                  id="fontSize"
                  type="number"
                  min="8"
                  max="30"
                  dir="ltr"
                  className="pl-10"
                  value={settings.fontSize}
                  onChange={(e) => update("fontSize", Number(e.target.value))}
                />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    px
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="lineHeight">ارتفاع خط</Label>
                <div className="relative">
                <Input
                  id="lineHeight"
                  type="number"
                  min="1"
                  max="3"
                  step="0.05"
                  dir="ltr"
                  className="pl-10"
                  value={settings.lineHeight}
                  onChange={(e) => update("lineHeight", Number(e.target.value))}
                />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* جهت و صفحه */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-foreground">جهت و اندازه صفحه</h3>
          <div className="space-y-4">
            <div className="space-y-2 text-right">
              <Label>جهت متن</Label>
              <Select
                value={settings.direction}
                onValueChange={(v) => update("direction", (v ?? "rtl") as "rtl" | "ltr")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب جهت">
                    {(value) => (value === "ltr" ? "چپ به راست (LTR)" : "راست به چپ (RTL)")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rtl">راست به چپ (RTL)</SelectItem>
                  <SelectItem value="ltr">چپ به راست (LTR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-right">
              <Label>اندازه کاغذ</Label>
              <Select
                value={settings.paperSize}
                onValueChange={(v) => {
                  const preset = (v ?? "A4") as PaperSizePreset;
                  const dims = PAPER_SIZE_PRESETS[preset];
                  update("paperSize", preset);
                  if (preset !== "custom") {
                    update("pageWidth", dims.width);
                    update("pageHeight", dims.height);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب اندازه کاغذ">
                    {(value) => PAPER_SIZE_PRESETS[(value as PaperSizePreset) ?? "A4"]?.label ?? "A4"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAPER_SIZE_PRESETS) as PaperSizePreset[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PAPER_SIZE_PRESETS[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {settings.paperSize === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label htmlFor="pageWidth">عرض صفحه</Label>
                  <Input
                    id="pageWidth"
                    dir="ltr"
                    placeholder="210mm"
                    value={settings.pageWidth}
                    onChange={(e) => update("pageWidth", e.target.value)}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="pageHeight">ارتفاع صفحه</Label>
                  <Input
                    id="pageHeight"
                    dir="ltr"
                    placeholder="297mm"
                    value={settings.pageHeight}
                    onChange={(e) => update("pageHeight", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* رنگ‌ها */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-foreground">رنگ‌ها</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 text-right">
                <Label htmlFor="titleColor">رنگ عنوان</Label>
                <div className="flex gap-2">
                  <Input
                    id="titleColor"
                    type="color"
                    value={settings.titleColor}
                    onChange={(e) => update("titleColor", e.target.value)}
                    className="h-9 w-12 cursor-pointer p-1"
                  />
                  <Input
                    dir="ltr"
                    value={settings.titleColor}
                    onChange={(e) => update("titleColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="subtitleColor">رنگ زیرعنوان</Label>
                <div className="flex gap-2">
                  <Input
                    id="subtitleColor"
                    type="color"
                    value={settings.subtitleColor}
                    onChange={(e) => update("subtitleColor", e.target.value)}
                    className="h-9 w-12 cursor-pointer p-1"
                  />
                  <Input
                    dir="ltr"
                    value={settings.subtitleColor}
                    onChange={(e) => update("subtitleColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="textColor">رنگ متن</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => update("textColor", e.target.value)}
                    className="h-9 w-12 cursor-pointer p-1"
                  />
                  <Input
                    dir="ltr"
                    value={settings.textColor}
                    onChange={(e) => update("textColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* پس‌زمینه */}
        <Card className="space-y-4 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">پس‌زمینه</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-right">
              <Label htmlFor="backgroundColor">رنگ پس‌زمینه</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <Input
                  dir="ltr"
                  value={settings.backgroundColor}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label>تصویر پس‌زمینه</Label>
              <div className="flex gap-2">
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundImageUpload}
                  className="hidden"
                  id="bg-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  className="flex-1"
                >
                  انتخاب تصویر
                </Button>
                {settings.backgroundImage && (
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={handleRemoveBackgroundImage}
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          </div>
          {settings.backgroundImage && (
            <div className="flex justify-center rounded-lg border border-dashed p-4">
              <img
                src={settings.backgroundImage}
                alt="پیش‌نمایش پس‌زمینه"
                className="max-h-32 rounded object-contain"
              />
            </div>
          )}
        </Card>

        {/* نمایش بخش‌ها */}
        <Card className="space-y-4 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">نمایش بخش‌ها</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showHeader}
                onChange={(e) => update("showHeader", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">سربرگ</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showFooter}
                onChange={(e) => update("showFooter", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">پاورقی</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showClauses}
                onChange={(e) => update("showClauses", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">شرایط و مقررات</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showSignature}
                onChange={(e) => update("showSignature", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">امضا</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}
