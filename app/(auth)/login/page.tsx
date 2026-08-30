"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthShell } from "../auth-shell";
import { useAuth } from "@/contexts/auth-context";
import { loginSchema, type LoginFormValues } from "@/lib/shared/validations/auth.schema";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login, isSubmitting } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login({ identifier: values.email, password: values.password });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "ورود ناموفق بود");
    }
  }

  return (
    <AuthShell
      eyebrow="خوش آمدید"
      title="مدیریت هوشمند املاک، در یک داشبورد"
      description="کرایه‌بان قراردادها، اجاره‌بها، مستاجرین و مالکین شما را در یک سیستم یکپارچه سازمان‌دهی می‌کند."
    >
      <div className="mb-8 text-right">
        <h1 className="text-2xl font-bold text-foreground">ورود به حساب</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          برای دسترسی به داشبورد وارد شوید
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && <Alert>{serverError}</Alert>}

        <div className="space-y-1.5 text-right">
          <Label htmlFor="email">ایمیل یا شماره موبایل</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="text"
              placeholder="example@company.com"
              className="pr-9"
              dir="ltr"
              autoComplete="username"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5 text-right">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">رمز عبور</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              فراموشی رمز عبور؟
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="px-9"
              dir="ltr"
              autoComplete="current-password"
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

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "در حال ورود..." : "ورود"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        حساب کاربری ندارید؟{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          ثبت‌نام کنید
        </Link>
      </p>
    </AuthShell>
  );
}
