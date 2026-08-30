"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthShell } from "../auth-shell";
import { useAuth } from "@/contexts/auth-context";
import { registerSchema, type RegisterFormValues } from "@/lib/shared/validations/auth.schema";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register: registerUser, isSubmitting } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      org: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        org: values.org,
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "ثبت‌نام ناموفق بود");
    }
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && <Alert>{serverError}</Alert>}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 text-right">
            <Label htmlFor="firstName">نام</Label>
            <Input
              id="firstName"
              placeholder="نام"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5 text-right">
            <Label htmlFor="lastName">نام خانوادگی</Label>
            <Input
              id="lastName"
              placeholder="نام خانوادگی"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-right">
          <Label htmlFor="org">نام مجموعه / شرکت</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="org"
              placeholder="مثلاً: املاک ستاره"
              className="pr-9"
              aria-invalid={!!errors.org}
              {...register("org")}
            />
          </div>
          {errors.org && (
            <p className="text-xs text-destructive">{errors.org.message}</p>
          )}
        </div>

        <div className="space-y-1.5 text-right">
          <Label htmlFor="email">ایمیل</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="example@company.com"
              className="pr-9"
              dir="ltr"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5 text-right">
          <Label htmlFor="password">رمز عبور</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="حداقل ۸ کاراکتر"
              className="px-9"
              dir="ltr"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
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
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5 text-right">
          <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="رمز عبور را دوباره وارد کنید"
              className="pr-9"
              dir="ltr"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-primary"
              {...register("acceptTerms")}
            />
            <span>
              با{" "}
              <Link href="/terms" className="text-primary hover:underline">
                قوانین و مقررات
              </Link>{" "}
              کرایه‌بان موافقم
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "در حال ایجاد حساب..." : "ایجاد حساب"}
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
