import { apiClient } from "@/services/client";

export interface CreateMarketPayload {
  name: string;
  address: string;
  subdomain: string;
  logo: string;
  baseCurrency: string;
  phone: string;
  email: string;
}

export interface UpdateMarketProfilePayload {
  name?: string;
  address?: string;
  logo?: string;
  baseCurrency?: string;
  phone?: string;
  email?: string;
  details?: string;
}

export interface Market {
  id: string;
  name: string;
  address: string | null;
  subdomain: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  details: string | null;
  baseCurrencyId: string | null;
  /** اگر بک‌-end کد ارز را همراه رابطه برگرداند، اینجا پر می‌شود */
  baseCurrencyCode?: string | null;
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RawMarket {
  baseCurrencyId?: string | null;
  base_currency_id?: string | null;
  baseCurrency?: string | { id?: string; code?: string } | null;
}

/**
 * بک‌اند گاهی به‌جای baseCurrencyId خودِ رابطه را برمی‌گرداند و گاهی کد را.
 * هر سه حالت را یکسان می‌کنیم تا فرم بتواند ارز پایه را نمایش دهد.
 */
function normalizeMarket(raw: Market): Market {
  const source = raw as Market & RawMarket;
  const baseCurrency = source.baseCurrency;
  const nested =
    baseCurrency && typeof baseCurrency === "object" ? baseCurrency : null;

  return {
    ...raw,
    baseCurrencyId:
      source.baseCurrencyId ?? source.base_currency_id ?? nested?.id ?? null,
    baseCurrencyCode:
      (typeof baseCurrency === "string" ? baseCurrency : nested?.code) ?? null,
  };
}

/**
 * ایجاد مارکت جدید
 * POST /markets — فقط SUPER_ADMIN مجاز است
 */
export async function createMarket(payload: CreateMarketPayload): Promise<Market> {
  const { data } = await apiClient.post<Market>("/markets", payload);
  return normalizeMarket(data);
}

/**
 * بروزرسانی پروفایل مارکت
 * PATCH /markets/:id/profile — SUPER_ADMIN و ADMIN (مالک مارکت) مجازند
 */
export async function updateMarketProfile(
  id: string,
  payload: UpdateMarketProfilePayload
): Promise<Market> {
  const { data } = await apiClient.patch<Market>(`/markets/${id}/profile`, payload);
  return normalizeMarket(data);
}

/**
 * گت مارکت جاری کاربر
 * GET /markets — فیلد isSetupComplete را برمی‌گرداند
 */
export async function fetchMyMarket(): Promise<Market> {
  const { data } = await apiClient.get<Market[] | Market>("/markets");
  if (Array.isArray(data)) {
    const market = data[0];
    if (!market) throw new Error("مارکتی برای این کاربر یافت نشد");
    return normalizeMarket(market);
  }
  return normalizeMarket(data);
}