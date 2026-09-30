import { apiClient } from "@/services/client";

export interface ExchangeRate {
  id: string;
  marketId: string;
  currencyId: string;
  /** نرخ یک واحد از این ارز نسبت به ارز پایه مارکت */
  rateToBase: number;
  effectiveDate: string | null;
  createdAt: string | null;
  currencyCode?: string;
  currencyName?: string;
}

export interface SetExchangeRatePayload {
  currencyId: string;
  rateToBase: number;
}

interface RawExchangeRate {
  id?: string;
  marketId?: string;
  market_id?: string;
  currencyId?: string;
  currency_id?: string;
  rateToBase?: unknown;
  rate_to_base?: unknown;
  effectiveDate?: string | null;
  effective_date?: string | null;
  createdById?: string;
  created_by_id?: string;
  createdAt?: string | null;
  created_at?: string | null;
  currency?: { id?: string; code?: string; name?: string };
  currencyInfo?: { id?: string; code?: string; name?: string };
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeExchangeRate(raw: RawExchangeRate): ExchangeRate {
  const currency = raw.currency ?? raw.currencyInfo;
  return {
    id: raw.id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    currencyId: raw.currencyId ?? raw.currency_id ?? currency?.id ?? "",
    rateToBase: toNumber(raw.rateToBase ?? raw.rate_to_base),
    effectiveDate: raw.effectiveDate ?? raw.effective_date ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    currencyCode: currency?.code,
    currencyName: currency?.name,
  };
}

/**
 * نرخ ارزهای تعریف‌شده برای یک مارکت
 * GET /markets/:marketId/exchange-rates — پاسخ: ExchangeRate[]
 * فقط ارزهایی که برایشان نرخ ثبت شده برمی‌گردند
 */
export async function fetchExchangeRates(marketId: string): Promise<ExchangeRate[]> {
  const { data } = await apiClient.get(`/markets/${marketId}/exchange-rates`);
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeExchangeRate);
}

/**
 * ثبت/بروزرسانی نرخ ارز یک مارکت
 * POST /markets/:marketId/exchange-rates
 * body: { currencyId, rateToBase }
 */
export async function setExchangeRate(
  marketId: string,
  payload: SetExchangeRatePayload
): Promise<ExchangeRate> {
  const { data } = await apiClient.post(`/markets/${marketId}/exchange-rates`, payload);
  return normalizeExchangeRate(data);
}
