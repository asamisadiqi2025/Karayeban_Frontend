"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Landmark, Loader2, PackageCheck, PackageX, TrendingDown, Wallet } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ToastProvider } from "@/components/client/toast";
import { PaginationBar } from "@/components/client/dashboard/pagination-bar";

import {
  fetchAssetSummary,
  type AssetCurrencySummary,
  type AssetSummary,
} from "@/services/asset.service";
import { extractApiErrorMessage } from "@/services/client";

const CURRENCY_PAGE_SIZE = 10;

function formatAmount(value: number): string {
  return value.toLocaleString("fa-AF", { maximumFractionDigits: 2 });
}

interface SummaryStat {
  label: string;
  value: string;
  hint: string;
  icon: typeof Landmark;
  iconBg: string;
  iconColor: string;
}

function SummaryCards({ summary }: { summary: AssetSummary }) {
  const cards: SummaryStat[] = [
    {
      label: "تعداد کل دارایی‌ها",
      value: summary.totalAssets.toLocaleString("fa-AF"),
      hint: "مجموع دارایی‌های ثبت شده",
      icon: Landmark,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "دارایی‌های فعال",
      value: summary.activeAssets.toLocaleString("fa-AF"),
      hint: "دارایی‌هایی که در گردش هستند",
      icon: PackageCheck,
      iconBg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "دارایی‌های از رده خارج",
      value: summary.disposedAssets.toLocaleString("fa-AF"),
      hint: "دارایی‌های فروخته شده یا حذف",
      icon: PackageX,
      iconBg: "#fff1f2",
      iconColor: "#e11d48",
    },
    {
      label: "واحدهای پولی درگیر",
      value: summary.byCurrency.length.toLocaleString("fa-AF"),
      hint: "تعداد ارزهای دارای دارایی",
      icon: Coins,
      iconBg: "#faf5ff",
      iconColor: "#7c3aed",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{card.hint}</p>
              </div>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: card.iconBg }}
              >
                <Icon className="h-4 w-4" style={{ color: card.iconColor }} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CurrencyRow({ row }: { row: AssetCurrencySummary }) {
  const depreciation =
    row.totalPurchasePrice - row.totalCurrentBookValue;
  const depreciationPercent =
    row.totalPurchasePrice > 0
      ? Math.max(
          0,
          Math.min(100, (depreciation / row.totalPurchasePrice) * 100),
        )
      : 0;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {row.currencyName || "—"}
            </p>
            <p dir="ltr" className="text-xs text-muted-foreground">
              {row.currencyCode || "—"}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground" dir="ltr">
        {row.count.toLocaleString("fa-AF")}
      </TableCell>
      <TableCell dir="ltr" className="font-medium text-foreground">
        {formatAmount(row.totalPurchasePrice)}
      </TableCell>
      <TableCell dir="ltr" className="text-muted-foreground">
        {formatAmount(row.totalCurrentBookValue)}
      </TableCell>
      <TableCell dir="ltr" className="text-muted-foreground">
        {depreciation > 0 ? formatAmount(depreciation) : "—"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${depreciationPercent}%` }}
            />
          </div>
          <span dir="ltr" className="text-xs text-muted-foreground">
            {depreciationPercent.toLocaleString("fa-AF", {
              maximumFractionDigits: 1,
            })}
            {"٪"}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AssetSummaryPage() {
  return (
    <ToastProvider>
      <AssetSummaryPageContent />
    </ToastProvider>
  );
}

function AssetSummaryPageContent() {
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  /**
   * وضعیت loading در هندلر کاربر ست می‌شود، نه داخل افکت، تا
   * react-hooks/set-state-in-effect رعایت شود.
   */
  useEffect(() => {
    let cancelled = false;
    fetchAssetSummary()
      .then((result) => {
        if (cancelled) return;
        setSummary(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setSummary(null);
        setError(extractApiErrorMessage(err, "خطا در دریافت خلاصه دارایی‌ها"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function reload() {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }

  const rows = summary?.byCurrency ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / CURRENCY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * CURRENCY_PAGE_SIZE;
  const visibleRows = rows.slice(startIndex, startIndex + CURRENCY_PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="خلاصه دارایی‌ها"
        description="نمای کلی دارایی‌های ثابت مارکت بر اساس واحد پولی"
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/assets" />}
          >
            <Landmark data-icon="inline-start" />
            فهرست دارایی‌ها
          </Button>
        }
      />

      {loading ? (
        <Card className="p-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">در حال بارگذاری...</span>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={reload}>
              تلاش مجدد
            </Button>
          </div>
        </Card>
      ) : summary ? (
        <>
          <SummaryCards summary={summary} />

          <Card className="p-0">
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold text-foreground">
                جمع دارایی‌ها به تفکیک واحد پولی
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({rows.length.toLocaleString("fa-AF")} واحد پولی)
                </span>
              </h2>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>واحد پولی</TableHead>
                  <TableHead>تعداد دارایی</TableHead>
                  <TableHead>مجموع قیمت خرید</TableHead>
                  <TableHead>ارزش دفتری فعلی</TableHead>
                  <TableHead>استهلاک تجمعی</TableHead>
                  <TableHead>درصد استهلاک</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      هیچ دارایی‌ای ثبت نشده است
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row) => <CurrencyRow key={row.currencyId} row={row} />)
                )}
              </TableBody>
            </Table>

            {rows.length > CURRENCY_PAGE_SIZE && (
              <PaginationBar
                from={startIndex + 1}
                to={Math.min(startIndex + CURRENCY_PAGE_SIZE, rows.length)}
                total={rows.length}
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </Card>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" />
            استهلاک تجمعی از تفاضل مجموع قیمت خرید و ارزش دفتری فعلی محاسبه می‌شود.
          </p>
        </>
      ) : null}
    </div>
  );
}
