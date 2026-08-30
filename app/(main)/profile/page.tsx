"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  User,
  Users,
  Phone,
  IdCard,
  Mail,
  Lock,
  ImagePlus,
  Trash2,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileForm {
  fullName: string;
  fatherName: string;
  phone: string;
  tazkiraNumber: string;
}

const initialForm: ProfileForm = {
  fullName: "",
  fatherName: "",
  phone: "",
  tazkiraNumber: "",
};

// ایمیل فقط برای نمایش است و از این صفحه قابل تغییر نیست
const currentEmail = "user@karayehban.com";

export default function UserProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(field: keyof ProfileForm) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
    };
  }

  function handleAvatarSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaved(false);
    const url = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function handleRemoveAvatar() {
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    // TODO: اتصال به بک‌اند NestJS — ارسال PATCH /users/me با اطلاعات فرم
    // (در صورت انتخاب عکس جدید، ابتدا آپلود و دریافت mediaId، سپس ارسال آن)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader
        title="پروفایل کاربری"
        description="اطلاعات حساب کاربری خود را مشاهده و ویرایش کنید"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* عکس کاربر */}
        <Card>
          <CardHeader>
            <CardTitle>عکس کاربر</CardTitle>
            <CardDescription>یک تصویر برای نمایش در پروفایل خود انتخاب کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="عکس کاربر"
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
                  {avatarPreview ? "تغییر عکس" : "انتخاب عکس"}
                </Button>
                {avatarPreview && (
                  <Button type="button" variant="ghost" onClick={handleRemoveAvatar}>
                    <Trash2 data-icon="inline-start" />
                    حذف
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* اطلاعات کاربر */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات شخصی</CardTitle>
            <CardDescription>این اطلاعات برای شناسایی حساب شما استفاده می‌شود</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="full-name">نام کامل</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="full-name"
                    placeholder="نام و تخلص خود را وارد کنید"
                    className="pr-9"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="father-name">نام پدر</Label>
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
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="phone">شماره تلفن</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* حساب کاربری — فقط نمایش */}
        <Card>
          <CardHeader>
            <CardTitle>حساب کاربری</CardTitle>
            <CardDescription>ایمیل و رمز عبور از این بخش قابل تغییر نیستند</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="email">ایمیل</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    className="pr-9"
                    value={currentEmail}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    dir="ltr"
                    className="pr-9"
                    value="••••••••"
                    disabled
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-muted-foreground">تغییرات با موفقیت ذخیره شد</span>
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
