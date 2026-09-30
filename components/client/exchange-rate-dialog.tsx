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
import { fetchAddedCurrencies } from "@/services/currency.service";
import {
  fetchExchangeRates,
  setExchangeRate,
  type ExchangeRate,
} from "@/services/exchange-rate.service";
import { extractApiErrorMessage } from "@/services/client";
import { cn } from "@/lib/shared/utils";
import { ToastProvider, useToast } from "@/components/client/toast";

/** effectiveDate از سرور به وقت UTC نیمه‌شب است؛ با timeZone: "UTC" از جابه‌جایی یک‌روزه جلوگیری می‌کنیم */
function formatEffectiveDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-AF", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * دکمه نرخ ارز در نوار بالا + مودال ویرایش نرخ.
 * کاربر از لیست یک ارز را انتخاب می‌کند و نرخ آن را در ورودی وسط مودال ویرایش می‌کند.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [baseCurrencyCode, setBaseCurrencyCode] = useState<string | null>(null);
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

  function selectRate(rate: ExchangeRate) {
    setSelectedId(rate.currencyId);
    setRateInput(String(rate.rateToBase));
    setFormError(null);
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
        setSelectedId(null);
        setRateInput("");
        setLoadError(
          extractApiErrorMessage(ratesResult.reason, "خطا در دریافت نرخ ارزها")
        );
        return;
      }

      const next = ratesResult.value;
      setRates(next);

      const first = next[0] ?? null;
      setSelectedId(first?.currencyId ?? null);
      setRateInput(first ? String(first.rateToBase) : "");

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
      setSelectedId(null);
      setRateInput("");
      setLoadError(extractApiErrorMessage(err, "خطا در دریافت نرخ ارزها"));
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setFormError(null);
    void load();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedId) {
      setFormError("نرخی برای ویرایش وجود ندارد");
      return;
    }

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
      const market = await resolveMarket();
      const saved = await setExchangeRate(market.id, {
        currencyId: selectedId,
        rateToBase: parsed,
      });

      setRates((prev) =>
        prev.map((rate) => (rate.currencyId === saved.currencyId ? saved : rate))
      );
      setRateInput(String(saved.rateToBase));
      toast.success(`نرخ ${saved.currencyCode ?? "ارز"} با موفقیت ذخیره شد`);
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
        className="h-12 w-12"
        onClick={handleOpen}
        aria-label="نرخ ارز"
        title="نرخ ارز"
      >
        
        نرخ ارز
        
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader className="text-right">
              <DialogTitle className="text-right">ویرایش نرخ ارز</DialogTitle>
              <DialogDescription>
                نرخ ارز را ویرایش کنید
                {baseCurrencyCode ? ` (نسبت به ${baseCurrencyCode})` : ""}.
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
              <Input
                type="text"
                value={rateInput}
                onChange={(e) => {
                  setRateInput(e.target.value);
                  setFormError(null);
                }}
                disabled={saving}
                placeholder="نرخ ارز"
                aria-label="نرخ ارز"
              />
            )}

            {formError && (
              <p className="whitespace-pre-line text-center text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose render={<Button type="button" variant="outline">انصراف</Button>} />
              <Button type="submit" disabled={saving || loading || !!loadError || !selectedId}>
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
