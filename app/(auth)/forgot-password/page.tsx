"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthShell } from "../auth-shell";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "ارسال ایمیل با خطا مواجه شد");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="بازیابی رمز عبور"
      title="رمز عبور خود را بازیابی کنید"
      description="ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برایتان ارسال شود."
    >
      <div className="mb-8 text-right">
        <h1 className="text-2xl font-bold text-foreground">فراموشی رمز عبور</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4 text-center">
          <Alert>
            ایمیل بازیابی رمز عبور ارسال شد. صندوق ورودی خود را بررسی کنید.
          </Alert>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              بازگشت به ورود
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && <Alert>{error}</Alert>}

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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        رمز عبور خود را به یاد دارید؟{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          وارد شوید
        </Link>
      </p>
    </AuthShell>
  );
}
