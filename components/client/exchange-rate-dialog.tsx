"use client";

import { useMemo, useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/contexts/auth-context";
import { fetchMyMarket, type Market } from "@/services/market.service";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import {
  fetchExchangeRates,
  setExchangeRate,
  type ExchangeRate,
} from "@/services/exchange-rate.service";
import { extractApiErrorMessage } from "@/services/client";
import { cn } from "@/lib/shared/utils";
import { ToastProvider, useToast } from "@/components/client/toast";

/** ورودی «AFN 0.012» یا «afn=0.012» را به کد ارز و نرخ تبدیل می‌کند */
function parseEntry(raw: string): { code: string; rate: number } | null {
  const parts = raw.trim().split(/[\s,=]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const code = parts[0].trim().toUpperCase();
  const rate = Number.parseFloat(parts[1]);
  if (!code || !Number.isFinite(rate)) return null;
  return { code, rate };
}

/** فقط کد ارز را از ورودی درمی‌آورد تا بتوان راهنمای زنده نمایش داد */
function readCode(raw: string): string {
  return raw.trim().split(/[\s,=]+/)[0]?.trim().toUpperCase() ?? "";
}

const ENTRY_PLACEHOLDER = "AFN 0.012";

/**
 * دکمه نرخ ارز در نوار بالا + مودال ثبت نرخ.
 * کاربر کد ارز و نرخ را در یک ورودی وسط مودال می‌نویسد، مثلاً: AFN 0.012
 */
export function ExchangeRateButton() {
  return (
    <ToastProvider>
      <ExchangeRateButtonContent />
    </ToastProvider>
  );
}

function ExchangeRateButtonContent() {
  const toast = useToast();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [baseCurrencyCode, setBaseCurrencyCode] = useState<string | null>(null);
  const [entry, setEntry] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * شناسه مارکت جاری کاربر. اول از سرویس /markets خوانده می‌شود چون
   * AuthUser.marketId همیشه در پاسخ /auth/me پر نیست.
   */
  async function resolveMarket(): Promise<Market> {
    try {
      return await fetchMyMarket();
    } catch (err) {
      if (user?.marketId) {
        return { id: user.marketId, baseCurrencyId: null } as Market;
      }
      throw err;
    }
  }

  async function load() {
    setLoading(true);
    setLoadError(null);
    setFormError(null);
    try {
      const market = await resolveMarket();
      const [ratesResult, currenciesResult] = await Promise.allSettled([
        fetchExchangeRates(market.id),
        fetchAddedCurrencies(),
      ]);

      if (ratesResult.status === "rejected") {
        setRates([]);
        setCurrencies([]);
        setLoadError(
          extractApiErrorMessage(ratesResult.reason, "خطا در دریافت نرخ ارزها")
        );
        return;
      }

      setRates(ratesResult.value);
      setCurrencies(currenciesResult.status === "fulfilled" ? currenciesResult.value : []);

      if (currenciesResult.status === "fulfilled" && market.baseCurrencyId) {
        const base = currenciesResult.value.find(
          (currency) => currency.id === market.baseCurrencyId
        );
        setBaseCurrencyCode(base?.code ?? null);
      } else {
        setBaseCurrencyCode(null);
      }
    } catch (err) {
      setRates([]);
      setCurrencies([]);
      setLoadError(extractApiErrorMessage(err, "خطا در دریافت نرخ ارزها"));
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setEntry("");
    setFormError(null);
    void load();
  }

  /** ارز متناظر با کدی که کاربر تا الان تایپ کرده است */
  const matched = useMemo(() => {
    const code = readCode(entry);
    if (!code) return null;
    const currency = currencies.find((item) => item.code.toUpperCase() === code);
    if (!currency) return { code, missing: true as const };
    const rate = rates.find((item) => item.currencyId === currency.id) ?? null;
    return { code, missing: false as const, currency, rate };
  }, [entry, currencies, rates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = parseEntry(entry);
    if (!parsed) {
      setFormError(`فرمت وارد شده صحیح نیست — مثال: ${ENTRY_PLACEHOLDER}`);
      return;
    }

    const currency = currencies.find((item) => item.code.toUpperCase() === parsed.code);
    if (!currency) {
      setFormError(`کد ارز «${parsed.code}» در سیستم تعریف نشده است`);
      return;
    }

    if (parsed.rate <= 0) {
      setFormError("نرخ ارز باید عددی بزرگ‌تر از صفر باشد");
      return;
    }

    const existing = rates.find((item) => item.currencyId === currency.id);
    if (existing && existing.rateToBase === parsed.rate) {
      toast.error("نرخ وارد شده با نرخ فعلی یکسان است");
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const market = await resolveMarket();
      const saved = await setExchangeRate(market.id, {
        currencyId: currency.id,
        rateToBase: parsed.rate,
      });

      setRates((prev) => {
        const next = prev.filter((item) => item.currencyId !== currency.id);
        return [...next, saved];
      });

      toast.success(`نرخ ${currency.code} با موفقیت ذخیره شد`);
      setEntry("");
      setOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ذخیره نرخ ارز ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={handleOpen}
        aria-label="نرخ ارز"
        title="نرخ ارز"
      >
        <DollarSign className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader className="text-right">
              <DialogTitle className="text-right">ثبت نرخ ارز</DialogTitle>
              <DialogDescription>
                کد ارز و نرخ آن را نسبت به ارز پایه مارکت بنویسید
                {baseCurrencyCode ? ` (${baseCurrencyCode})` : ""}.
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال بارگذاری...
              </div>
            ) : loadError ? (
              <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                <p className="whitespace-pre-line text-sm text-destructive">{loadError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                  تلاش مجدد
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-full max-w-[260px]">
                  <Input
                    value={entry}
                    onChange={(e) => {
                      setEntry(e.target.value);
                      setFormError(null);
                    }}
                    placeholder={ENTRY_PLACEHOLDER}
                    dir="ltr"
                    autoComplete="off"
                    autoFocus
                    disabled={saving}
                    className="h-11 text-center text-base tracking-wide"
                    aria-label="کد ارز و نرخ"
                  />
                </div>

                <p
                  className={cn(
                    "min-h-4 text-center text-xs",
                    matched?.missing ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {!matched && currencies.length > 0 && (
                    <>کدهای موجود: {currencies.map((c) => c.code).join("، ")}</>
                  )}
                  {matched?.missing && (
                    <>کد «{matched.code}» در سیستم تعریف نشده است</>
                  )}
                  {matched && !matched.missing && matched.rate && (
                    <>
                      نرخ فعلی {matched.currency.code}: {matched.rate.rateToBase}
                    </>
                  )}
                  {matched && !matched.missing && !matched.rate && (
                    <>برای {matched.currency.code} نرخی ثبت نشده — نرخ جدید ثبت می‌شود</>
                  )}
                </p>
              </div>
            )}

            {formError && (
              <p className="whitespace-pre-line text-center text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose render={<Button type="button" variant="outline">انصراف</Button>} />
              <Button type="submit" disabled={saving || loading || !!loadError}>
                {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {saving ? "در حال ذخیره..." : "ذخیره"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
