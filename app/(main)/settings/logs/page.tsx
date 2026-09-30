"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronsRight,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { isoToDisplayDateTime } from "@/lib/date-picker";
import {
  fetchAuditLog,
  fetchAuditLogs,
  type AuditLog,
  type AuditLogMeta,
} from "@/services/audit-log.service";
import { extractApiErrorMessage } from "@/services/client";

/* ------------------------------------------------------------------ */
/* Display helpers                                                      */
/* ------------------------------------------------------------------ */

const fa = "fa-AF";
const ALL = "all";
const PAGE_SIZE = 20;

const actionLabels: Record<string, string> = {
  CREATE: "ایجاد",
  UPDATE: "ویرایش",
  DELETE: "حذف",
  RESTORE: "بازیابی",
  LOGIN: "ورود به سامانه",
  LOGOUT: "خروج از سامانه",
};

function actionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

const actionVariants: Record<string, "default" | "secondary" | "outline" | "success" | "danger"> = {
  CREATE: "success",
  UPDATE: "default",
  DELETE: "danger",
  RESTORE: "outline",
  LOGIN: "secondary",
  LOGOUT: "secondary",
};

function actionVariant(action: string) {
  return actionVariants[action] ?? "outline";
}

/** Best-effort friendly name; falls back to the raw entity type. */
const entityLabels: Record<string, string> = {
  User: "کاربر",
  UserRole: "نقش کاربر",
  RentPayment: "پرداخت اجاره",
  RentCharge: "صورت‌حساب اجاره",
  Contract: "قرارداد",
  Shop: "دکان",
  ShopUnit: "واحد",
  Floor: "طبقه",
  Tenant: "مستأجر",
  Guarantor: "ضامن",
  Expense: "مصرف",
  ExpenseCategory: "دسته‌بندی مصرف",
  InventoryItem: "اجناس گدام",
  InventoryCategory: "دسته‌بندی گدام",
  InventoryTransaction: "تراکنش گدام",
  Warehouse: "گدام",
  BankAccount: "حساب بانکی",
  Currency: "واحد پولی",
  Shareholder: "سهامدار",
  ShareholderTransaction: "تراکنش سهام",
  ElectricityMeter: "میتر برق",
  ElectricityPayment: "پرداخت برق",
  Announcement: "اعلان",
};

function entityLabel(entityType: string): string {
  if (!entityType) return "—";
  return entityLabels[entityType] ?? entityType;
}

/** Summarise a user-agent so the column stays readable. */
function describeUserAgent(ua: string): string {
  if (!ua) return "—";
  if (/PostmanRuntime/i.test(ua)) return "Postman";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  if (/curl\//i.test(ua)) return "cURL";
  if (/node/i.test(ua)) return "Node.js";
  return ua.length > 24 ? `${ua.slice(0, 24)}…` : ua;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value === "" ? "—" : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

interface DiffRow {
  key: string;
  before: string;
  after: string;
  changed: boolean;
}

function buildDiff(log: AuditLog): DiffRow[] {
  const before = log.oldData ?? {};
  const after = log.newData ?? {};
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)]),
  ).sort((a, b) => a.localeCompare(b));

  return keys.map((key) => {
    const b = before[key];
    const a = after[key];
    return {
      key,
      before: formatValue(b),
      after: formatValue(a),
      changed: JSON.stringify(b ?? null) !== JSON.stringify(a ?? null),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<AuditLogMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Client-side filters. The endpoint only supports page/limit, so these narrow
  // the current page rather than the whole history.
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>(ALL);

  const [detail, setDetail] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAuditLogs({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setLogs(result.items);
        setMeta(result.meta);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت سوابق فعالیت"));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, reloadToken]);

  function goToPage(next: number) {
    if (next === page || next < 1 || next > meta.totalPages) return;
    setLoading(true);
    setError(null);
    setPage(next);
  }

  function reload() {
    setLoading(true);
    setError(null);
    setReloadToken((t) => t + 1);
  }

  const availableActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== ALL && log.action !== actionFilter) return false;
      if (q === "") return true;
      const haystack = [
        log.user?.fullName ?? "",
        log.user?.username ?? "",
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress,
        describeUserAgent(log.userAgent),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, query, actionFilter]);

  function resetFilters() {
    setQuery("");
    setActionFilter(ALL);
  }

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const result = await fetchAuditLog(id);
      setDetail(result);
    } catch (err) {
      setDetailError(extractApiErrorMessage(err, "خطا در دریافت جزئیات فعالیت"));
    } finally {
      setDetailLoading(false);
    }
  }

  const diff = useMemo(() => (detail ? buildDiff(detail) : []), [detail]);
  const changedCount = diff.filter((d) => d.changed).length;

  return (
    <div>
      <PageHeader
        title="سوابق فعالیت کاربران"
        description="هر تغییری که روی اطلاعات سامانه انجام شده، همراه با کاربر، زمان و مقدار قبلی و بعدی"
        action={
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            بروزرسانی
          </Button>
        }
      />

      {/* Filters — these narrow the current page only. */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">فیلترها</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>نوع اقدام</Label>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? ALL)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="همه اقدام‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه اقدام‌ها</SelectItem>
                {availableActions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {actionLabel(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label>جستجو</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="نام کاربر، نام کاربری، نوع موجودیت یا نشانی IP"
                className="ps-8"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {filtered.length === logs.length
              ? `${logs.length.toLocaleString(fa)} رکورد در این صفحه`
              : `${filtered.length.toLocaleString(fa)} از ${logs.length.toLocaleString(fa)} رکورد این صفحه`}
            {" — "}
            فیلترها فقط روی صفحه جاری اعمال می‌شوند
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RefreshCw data-icon="inline-start" />
            بازنشانی
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">زمان</TableHead>
              <TableHead className="text-right">کاربر</TableHead>
              <TableHead className="text-right">اقدام</TableHead>
              <TableHead className="text-right">موجودیت</TableHead>
              <TableHead className="text-right">نشانی IP</TableHead>
              <TableHead className="text-right">مرورگر</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">در حال بارگذاری…</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
                    تلاش دوباره
                  </Button>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  {logs.length === 0
                    ? "سابقه‌ای برای نمایش وجود ندارد"
                    : "با فیلترهای فعلی نتیجه‌ای یافت نشد"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                    {isoToDisplayDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="block font-medium">{log.user?.fullName || "—"}</span>
                    {log.user?.username && (
                      <span className="block text-xs text-muted-foreground" dir="ltr">
                        {log.user.username}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={actionVariant(log.action)}>{actionLabel(log.action)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="block">{entityLabel(log.entityType)}</span>
                    {log.entityId && (
                      <span className="block text-xs text-muted-foreground" dir="ltr">
                        {log.entityId.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground" dir="ltr">
                    {log.ipAddress || "—"}
                  </TableCell>
                  <TableCell
                    className="text-right text-xs text-muted-foreground"
                    title={log.userAgent || undefined}
                  >
                    {describeUserAgent(log.userAgent)}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openDetail(log.id)}
                      aria-label="مشاهده جزئیات"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && !error && meta.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              نشان دادن{" "}
              <span className="font-medium text-foreground">
                {(meta.page - 1) * meta.limit + 1}
                {"–"}
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{" "}
              از{" "}
              <span className="font-medium text-foreground">{meta.total.toLocaleString(fa)}</span>{" "}
              مورد — صفحه {meta.page.toLocaleString(fa)} از{" "}
              {meta.totalPages.toLocaleString(fa)}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasPrevPage}
                onClick={() => goToPage(1)}
                aria-label="صفحه اول"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasPrevPage}
                onClick={() => goToPage(meta.page - 1)}
                aria-label="صفحه قبل"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <span className="mx-1 min-w-[60px] text-center text-xs font-medium text-foreground">
                {meta.page.toLocaleString(fa)} / {meta.totalPages.toLocaleString(fa)}
              </span>

              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasNextPage}
                onClick={() => goToPage(meta.page + 1)}
                aria-label="صفحه بعد"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!meta.hasNextPage}
                onClick={() => goToPage(meta.totalPages)}
                aria-label="صفحه آخر"
              >
                <ChevronsRight className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader className="text-right">
            <DialogTitle>جزئیات فعالیت</DialogTitle>
            <DialogDescription>
              {detail
                ? `${actionLabel(detail.action)} — ${entityLabel(detail.entityType)}`
                : "در حال دریافت اطلاعات"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال بارگذاری…
            </div>
          ) : detailError ? (
            <p className="py-6 text-center text-sm text-destructive">{detailError}</p>
          ) : detail ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailField label="کاربر">
                  {detail.user?.fullName || "—"}
                  {detail.user?.username && (
                    <span className="block text-xs text-muted-foreground" dir="ltr">
                      {detail.user.username}
                    </span>
                  )}
                </DetailField>
                <DetailField label="زمان">{isoToDisplayDateTime(detail.createdAt)}</DetailField>
                <DetailField label="اقدام">
                  <Badge variant={actionVariant(detail.action)}>{actionLabel(detail.action)}</Badge>
                </DetailField>
                <DetailField label="موجودیت">
                  {entityLabel(detail.entityType)}
                  <span className="block text-xs text-muted-foreground" dir="ltr">
                    {detail.entityId || "—"}
                  </span>
                </DetailField>
                <DetailField label="نشانی IP">
                  <span dir="ltr">{detail.ipAddress || "—"}</span>
                </DetailField>
                <DetailField label="مرورگر / کلاینت">
                  <span className="break-all text-xs" dir="ltr">
                    {detail.userAgent || "—"}
                  </span>
                </DetailField>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {diff.length === 0
                    ? "داده‌ای برای نمایش وجود ندارد"
                    : `تغییرات (${changedCount.toLocaleString(fa)} فیلد تغییر کرده)`}
                </h3>

                {diff.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {detail.action === "LOGIN" || detail.action === "LOGOUT"
                      ? "این فعالیت ورود/خروج است و داده‌ای ثبت نشده است"
                      : "داده‌ای برای این فعالیت ثبت نشده است"}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">فیلد</TableHead>
                          <TableHead className="text-right">مقدار قبلی</TableHead>
                          <TableHead className="text-right">مقدار جدید</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diff.map((row) => (
                          <TableRow key={row.key} className={row.changed ? "" : "opacity-60"}>
                            <TableCell className="text-right font-medium" dir="ltr">
                              {row.key}
                            </TableCell>
                            <TableCell
                              className="text-right text-xs whitespace-pre-wrap break-all"
                              dir="ltr"
                            >
                              {row.before}
                            </TableCell>
                            <TableCell
                              className={`text-right text-xs whitespace-pre-wrap break-all ${
                                row.changed ? "font-medium text-emerald-600 dark:text-emerald-400" : ""
                              }`}
                              dir="ltr"
                            >
                              {row.after}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
