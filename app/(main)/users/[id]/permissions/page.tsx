"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  KeyRound,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToastProvider } from "@/components/client/toast";

import {
  fetchUserPermissions,
  type UserPermissionSection,
  type UserPermissions,
} from "@/services/user.service";
import { extractApiErrorMessage } from "@/services/client";
import { UserRoleBadge } from "@/components/client/users/user-form";

const MODE_LABEL: Record<string, string> = {
  "role-default": "پیش‌فرض نقش",
  custom: "دستی",
};

function countLabel(value: number): string {
  return value.toLocaleString("fa-AF");
}

export default function UserPermissionsPage() {
  return (
    <ToastProvider>
      <UserPermissionsContent />
    </ToastProvider>
  );
}

function UserPermissionsContent() {
  const { id } = useParams<{ id: string }>();

  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /**
   * وضعیت loading در هندلرهای کاربر ست می‌شود، نه داخل افکت، تا
   * react-hooks/set-state-in-effect رعایت شود.
   */
  useEffect(() => {
    let cancelled = false;
    fetchUserPermissions(id)
      .then((result) => {
        if (cancelled) return;
        setPermissions(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setPermissions(null);
        setError(
          extractApiErrorMessage(err, "خطا در دریافت دسترسی‌های کاربر"),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const totals = useMemo(() => {
    const sections = permissions?.sections ?? [];
    let granted = 0;
    let total = 0;
    for (const section of sections) {
      granted += section.items.filter((item) => item.granted).length;
      total += section.items.length;
    }
    return { granted, total };
  }, [permissions]);

  if (loading) {
    return (
      <div>
        <PageHeader title="دسترسی‌های کاربر" description="در حال بارگذاری..." />
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  if (error || !permissions) {
    return (
      <div>
        <PageHeader title="دسترسی‌های کاربر" description="خطا" />
        <Card className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">
            {error || "دسترسی‌های کاربر یافت نشد"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setReloadToken((token) => token + 1);
              }}
            >
              تلاش مجدد
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/users" />}
            >
              <ArrowRight data-icon="inline-start" />
              بازگشت به کاربران
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const percent = totals.total > 0 ? (totals.granted / totals.total) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="دسترسی‌های کاربر"
        description={`جزییات دسترسی‌های ${permissions.fullName}`}
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/users" />}
          >
            <ArrowRight data-icon="inline-start" />
            بازگشت به کاربران
          </Button>
        }
      />

      {/* -------------------- خلاصه -------------------- */}
      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {permissions.fullName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <UserRoleBadge role={permissions.role} />
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {MODE_LABEL[permissions.mode] ?? permissions.mode}
                </span>
                {!permissions.editable && (
                  <span className="text-xs text-muted-foreground">
                    فقط نمایش — این کاربر اجازه‌ی تغییر دسترسی‌ها را ندارد
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {countLabel(totals.granted)} مجاز از {countLabel(totals.total)}
              </span>
              <span dir="ltr">{Math.round(percent)}%</span>
            </div>
            <Progress value={percent} />
          </div>
        </div>
      </Card>

      {/* -------------------- بخش‌ها -------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {permissions.sections.map((section) => (
          <PermissionSectionCard key={section.key} section={section} />
        ))}
      </div>
    </div>
  );
}

function PermissionSectionCard({ section }: { section: UserPermissionSection }) {
  const grantedCount = section.items.filter((item) => item.granted).length;

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            {section.label}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {countLabel(grantedCount)} از {countLabel(section.items.length)}
        </span>
      </div>

      <ul className="divide-y">
        {section.items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="text-sm text-foreground">{item.label}</span>

            {item.granted ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <Check className="h-3 w-3" />
                مجاز
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <X className="h-3 w-3" />
                غیرمجاز
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}