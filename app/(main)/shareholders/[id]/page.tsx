"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Landmark,
  Loader2,
  Calendar,
  Phone,
  CreditCard,
  Percent,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  fetchShareholder,
  type Shareholder,
} from "@/services/shareholder.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider } from "@/components/client/toast";

export default function ShareholderDetailPage() {
  return (
    <ToastProvider>
      <ShareholderDetailContent />
    </ToastProvider>
  );
}

function ShareholderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [shareholder, setShareholder] = useState<Shareholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShareholder(id);
      setShareholder(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت جزییات مالک"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <PageHeader title="جزییات مالک" description="در حال بارگذاری..." />
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  if (error || !shareholder) {
    return (
      <div>
        <PageHeader title="جزییات مالک" description="خطا" />
        <Card className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">
            {error || "مالک یافت نشد"}
          </p>
          <Button variant="outline" size="sm" onClick={load}>
            تلاش مجدد
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={shareholder.fullName}
        description={`جزییات مالک "${shareholder.fullName}"`}
        action={
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowRight data-icon="inline-start" className="h-4 w-4" />
            بازگشت
          </Button>
        }
      />

      {/* اطلاعات اصلی */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<Landmark className="h-4 w-4" />}
          label="نام مالک"
          value={shareholder.fullName}
        />
        <InfoCard
          icon={<Phone className="h-4 w-4" />}
          label="شماره تماس"
          value={shareholder.contact}
          dir="ltr"
        />
        <InfoCard
          icon={<CreditCard className="h-4 w-4" />}
          label="شماره شناسایی"
          value={shareholder.idNumber}
          dir="ltr"
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="تاریخ ایجاد"
          value={
            shareholder.createdAt
              ? new Date(shareholder.createdAt).toLocaleDateString("fa-AF")
              : "—"
          }
        />
      </div>

      {/* وضعیت و درصد */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<Percent className="h-4 w-4" />}
          label="درصد سهم"
          value={`${Number(shareholder.currentPercentage).toLocaleString("fa-AF")}%`}
        />
        <InfoCard
          icon={<Coins className="h-4 w-4" />}
          label="کل واریزی‌ها"
          value={Number(shareholder.totalDeposits).toLocaleString("fa-AF")}
        />
        <InfoCard
          icon={<Coins className="h-4 w-4" />}
          label="کل برداشت‌ها"
          value={Number(shareholder.totalWithdrawals).toLocaleString("fa-AF")}
        />
        <InfoCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="خالص مبلغ"
          value={Number(shareholder.netAmount).toLocaleString("fa-AF")}
        />
      </div>

      {/* خلاصه مالی */}
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          خلاصه مالی
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">واریزی کل</p>
              <p className="text-sm font-medium text-foreground">
                {Number(shareholder.totalDeposits).toLocaleString("fa-AF")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">برداشت کل</p>
              <p className="text-sm font-medium text-foreground">
                {Number(shareholder.totalWithdrawals).toLocaleString("fa-AF")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">خالص مبلغ</p>
              <p className="text-sm font-medium text-foreground">
                {Number(shareholder.netAmount).toLocaleString("fa-AF")}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground" dir={dir}>
        {value}
      </p>
    </Card>
  );
}
