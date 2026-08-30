"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  User,
  Users,
  UserRoundCog,
  IdCard,
  Phone,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Gender = "male" | "female";

interface TenantForm {
  fullName: string;
  fatherName: string;
  grandfatherName: string;
  tazkiraNumber: string;
  phone: string;
  gender: Gender;
  details: string;
}

const initialForm: TenantForm = {
  fullName: "",
  fatherName: "",
  grandfatherName: "",
  tazkiraNumber: "",
  phone: "",
  gender: "male",
  details: "",
};

export default function NewTenantPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<TenantForm>(initialForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(field: keyof TenantForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
    };
  }

  function handlePhotoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaved(false);
    const url = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function handleRemovePhoto() {
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    // TODO: اتصال به بک‌اند NestJS — ارسال POST /tenants با بدنه‌ی فرم
    // (در صورت انتخاب عکس: ابتدا آپلود و دریافت mediaId، سپس ارسال آن)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader
        title="افزودن مستأجر جدید"
        description="اطلاعات مستأجر را وارد کنید"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* عکس */}
        <Card>
          <CardHeader>
            <CardTitle>عکس مستأجر</CardTitle>
            <CardDescription>یک تصویر برای شناسایی مستأجر انتخاب کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="عکس مستأجر"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-7 w-7 text-muted-foreground" />
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus data-icon="inline-start" />
                  {photoPreview ? "تغییر عکس" : "انتخاب عکس"}
                </Button>
                {photoPreview && (
                  <Button type="button" variant="ghost" onClick={handleRemovePhoto}>
                    <Trash2 data-icon="inline-start" />
                    حذف
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* اطلاعات مستأجر */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات مستأجر</CardTitle>
            <CardDescription>این اطلاعات برای ثبت قرارداد و شناسایی مستأجر استفاده می‌شود</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 text-right">
              <Label htmlFor="full-name">نام کامل</Label>
              <div className="relative">
                <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="full-name"
                  placeholder="نام و تخلص مستأجر"
                  className="pr-9"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="father-name">ولد</Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="father-name"
                    placeholder="نام پدر"
                    className="pr-9"
                    value={form.fatherName}
                    onChange={handleChange("fatherName")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="grandfather-name">ولدیت</Label>
                <div className="relative">
                  <UserRoundCog className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="grandfather-name"
                    placeholder="نام پدرکلان"
                    className="pr-9"
                    value={form.grandfatherName}
                    onChange={handleChange("grandfatherName")}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="tazkira">شماره تذکره</Label>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="tazkira"
                    placeholder="شماره تذکره"
                    className="pr-9"
                    dir="ltr"
                    value={form.tazkiraNumber}
                    onChange={handleChange("tazkiraNumber")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="phone">شماره تماس</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
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
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="gender">جنسیت</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => {
                  setForm((f) => ({ ...f, gender: v as Gender }));
                  setSaved(false);
                }}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">مرد</SelectItem>
                  <SelectItem value="female">زن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="details">جزییات</Label>
              <div className="relative">
                <FileText className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="details"
                  rows={3}
                  placeholder="توضیحات تکمیلی درباره مستأجر"
                  className="pr-9"
                  value={form.details}
                  onChange={handleChange("details")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-muted-foreground">مستأجر با موفقیت ذخیره شد</span>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {loading ? "در حال ذخیره..." : "افزودن مستأجر"}
          </Button>
        </div>
      </form>
    </div>
  );
}
