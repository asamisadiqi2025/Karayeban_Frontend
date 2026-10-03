"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Loader2, Pencil, RefreshCw, Search } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { ToastProvider, useToast } from "@/components/client/toast";
import {
  fetchAddedCurrencies,
  type AddedCurrency,
} from "@/services/currency.service";
import { fetchMyMarket } from "@/services/market.service";
import {
  fetchExchangeRates,
  setExchangeRate,
  type ExchangeRate,
} from "@/services/exchange-rate.service";
import { extractApiErrorMessage } from "@/services/client";

function formatNumber(value: number): string {
  return value.toLocaleString("fa-AF", { maximumFractionDigits: 4 });
}

/** effectiveDate از سرور به وقت UTC نیمه‌شب است؛ timeZone: "UTC" از جابه‌جایی یک‌روزه جلوگیری می‌کند. */
function formatEffectiveDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-AF", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function UpdateCurrencyRatesPage() {
  return (
    <ToastProvider>
      <UpdateCurrencyRatesContent />
    </ToastProvider>
  );
}

function UpdateCurrencyRatesContent() {
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [marketId, setMarketId] = useState("");
  const [baseCurrencyId, setBaseCurrencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [editing, setEditing] = useState<AddedCurrency | null>(null);

  /**
   * نرخ‌ها جدا از فهرست ارزها خوانده می‌شوند تا خطای نرخ‌ها کل جدول را خراب نکند.
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [currenciesResult, marketResult] = await Promise.allSettled([
        fetchAddedCurrencies(),
        fetchMyMarket(),
      ]);

      if (cancelled) return;

      if (currenciesResult.status === "rejected") {
        setCurrencies([]);
        setError(
          extractApiErrorMessage(
            currenciesResult.reason,
            "خطا در دریافت واحدهای پولی",
          ),
        );
        setLoading(false);
        return;
      }

      setCurrencies(
        Array.isArray(currenciesResult.value) ? currenciesResult.value : [],
      );
      setError(null);

      if (marketResult.status === "rejected") {
        setRates([]);
        setLoading(false);
        return;
      }

      const market = marketResult.value;
      setMarketId(market.id);
      setBaseCurrencyId(market.baseCurrencyId ?? null);

      fetchExchangeRates(market.id)
        .then((result) => {
          if (cancelled) return;
          setRates(result);
        })
        .catch(() => {
          if (!cancelled) setRates([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const rateByCurrencyId = useMemo(() => {
    const map = new Map<string, ExchangeRate>();
    rates.forEach((rate) => map.set(rate.currencyId, rate));
    return map;
  }, [rates]);

  const baseCurrencyCode = useMemo(() => {
    if (!baseCurrencyId) return null;
    return (
      currencies.find((currency) => currency.id === baseCurrencyId)?.code ?? null
    );
  }, [currencies, baseCurrencyId]);

  const filtered = currencies.filter((currency) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      currency.code.toLowerCase().includes(q) ||
      currency.name.toLowerCase().includes(q)
    );
  });

  function reload() {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }

  function handleSaved(saved: ExchangeRate) {
    setRates((prev) => {
      const rest = prev.filter((rate) => rate.currencyId !== saved.currencyId);
      return [...rest, saved];
    });
  }

  return (
    <div>
      <PageHeader
        title="آپدیت نرخ ارز ها"
        description="نرخ هر واحد پولی نسبت به ارز پایه مارکت را ویرایش کنید"
        action={
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw data-icon="inline-start" />
            بروزرسانی لیست
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            واحدهای پولی سیستم
            {!loading && (
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                ({filtered.length.toLocaleString("fa-AF")} مورد)
              </span>
            )}
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس کد یا نام..."
              className="w-full pr-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>کد</TableHead>
              <TableHead>نام واحد پولی</TableHead>
              <TableHead>سیمبول</TableHead>
              <TableHead>نرخ فعلی</TableHead>
              <TableHead>آخرین بروزرسانی</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={reload}>
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  {query
                    ? "واحد پولی‌ای یافت نشد"
                    : "هنوز واحد پولی اضافه نشده است"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((currency) => {
                const rate = rateByCurrencyId.get(currency.id);
                const isBase = currency.id === baseCurrencyId;

                return (
                  <TableRow key={currency.id} className="hover:bg-muted/40">
                    <TableCell>
                      <span className="inline-flex min-w-[52px] items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                        {currency.code}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {currency.name}
                          </p>
                          {isBase && (
                            <p className="text-xs text-muted-foreground">
                              ارز پایه مارکت
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {currency.symbol ?? "—"}
                    </TableCell>

                    <TableCell dir="ltr" className="text-right">
                      {isBase ? (
                        <span className="text-muted-foreground">۱</span>
                      ) : rate ? (
                        <span className="font-medium text-foreground">
                          {formatNumber(rate.rateToBase)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">ثبت نشده</span>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {isBase ? "—" : formatEffectiveDate(
                        rate?.effectiveDate ?? rate?.createdAt ?? null,
                      )}
                    </TableCell>

                    <TableCell className="text-left">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isBase}
                        onClick={() => setEditing(currency)}
                      >
                        <Pencil data-icon="inline-start" />
                        نرخ ارز
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* key باعث می‌شود مودال برای هر ارز از نو ساخته شود و ورودی با نرخ همان ارز پر شود */}
      <RateDialog
        key={editing?.id ?? "no-currency"}
        currency={editing}
        marketId={marketId}
        baseCurrencyCode={baseCurrencyCode}
        currentRate={
          editing ? (rateByCurrencyId.get(editing.id)?.rateToBase ?? null) : null
        }
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}

function RateDialog({
  currency,
  marketId,
  baseCurrencyCode,
  currentRate,
  onClose,
  onSaved,
}: {
  currency: AddedCurrency | null;
  marketId: string;
  baseCurrencyCode: string | null;
  currentRate: number | null;
  onClose: () => void;
  onSaved: (rate: ExchangeRate) => void;
}) {
  const toast = useToast();

  const [rateInput, setRateInput] = useState(
    currentRate !== null ? String(currentRate) : "",
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!currency) return;

    if (rateInput.trim() === "") {
      setFormError("نرخ ارز را وارد کنید");
      return;
    }
    const parsed = Number.parseFloat(rateInput);
    if (!Number.isFinite(parsed)) {
      setFormError("نرخ ارز باید یک عدد باشد");
      return;
    }
    if (parsed <= 0) {
      setFormError("نرخ ارز باید عددی بزرگ‌تر از صفر باشد");
      return;
    }

    setSaving(true);
    try {
      const saved = await setExchangeRate(marketId, {
        currencyId: currency.id,
        rateToBase: parsed,
      });
      onSaved(saved);
      toast.success(`نرخ ${saved.currencyCode ?? currency.code} با موفقیت ذخیره شد`);
      onClose();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ذخیره نرخ ارز ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!currency} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">نرخ ارز</DialogTitle>
            <DialogDescription>
              {currency
                ? `نرخ یک واحد ${currency.name}${
                    baseCurrencyCode ? ` نسبت به ${baseCurrencyCode}` : ""
                  } را وارد کنید.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-right">
            <Label htmlFor="rate-input">نرخ ارز</Label>
            <Input
              id="rate-input"
              type="text"
              dir="ltr"
              inputMode="decimal"
              placeholder="مثلاً: ۷۷٫۵ — عدد لاتین: 77.5"
              value={rateInput}
              onChange={(e) => {
                setRateInput(e.target.value);
                setFormError(null);
              }}
              disabled={saving}
            />
          </div>

          {formError && (
            <p className="whitespace-pre-line text-sm text-destructive">
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              انصراف
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}