"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthShell } from "../auth-shell";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // TODO: اتصال به POST /auth/register در بک‌اند NestJS
    // (ایجاد Tenant جدید + کاربر ادمین اولیه)
    setTimeout(() => setLoading(false), 800);
  }

  return (
    <AuthShell
      eyebrow="شروع کنید"
      title="مجموعه خود را در چند دقیقه راه‌اندازی کنید"
      description="یک حساب برای مجموعه‌تان بسازید و مدیریت املاک، قراردادها و امور مالی را از همین امروز شروع کنید."
    >
      <div className="mb-7 text-right">
        <h1 className="text-2xl font-bold text-foreground">ایجاد حساب جدید</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          اطلاعات زیر را برای ثبت‌نام تکمیل کنید
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 text-right">
            <Label htmlFor="firstName">نام</Label>
            <Input id="firstName" name="firstName" placeholder="نام" required />
          </div>
          <div className="space-y-1.5 text-right">
            <Label htmlFor="lastName">نام خانوادگی</Label>
            <Input id="lastName" name="lastName" placeholder="نام خانوادگی" required />
          </div>
        </div>

        <div className="space-y-1.5 text-right">
          <Label htmlFor="org">نام مجموعه / شرکت</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="org"
              name="org"
              placeholder="مثلاً: املاک ستاره"
              className="pr-9"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5 text-right">
          <Label htmlFor="email">ایمیل</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@company.com"
              className="pr-9"
              dir="ltr"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5 text-right">
          <Label htmlFor="password">رمز عبور</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="حداقل ۸ کاراکتر"
              className="px-9"
              dir="ltr"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-primary"
          />
          <span>
            با{" "}
            <Link href="/terms" className="text-primary hover:underline">
              قوانین و مقررات
            </Link>{" "}
            کرایه‌بان موافقم
          </span>
        </label>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "در حال ایجاد حساب..." : "ایجاد حساب"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        قبلاً حساب دارید؟{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          وارد شوید
        </Link>
      </p>
    </AuthShell>
  );
}
