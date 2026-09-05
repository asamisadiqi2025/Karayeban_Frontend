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
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * ایجاد مارکت جدید
 * POST /markets — فقط SUPER_ADMIN مجاز است
 */
export async function createMarket(payload: CreateMarketPayload): Promise<Market> {
  const { data } = await apiClient.post<Market>("/markets", payload);
  return data;
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
  return data;
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
    return market;
  }
  return data;
}