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

export interface Market {
  id: string;
  name: string;
  address: string;
  subdomain: string;
  logo: string;
  baseCurrency: string;
  phone: string;
  email: string;
}

/**
 * ایجاد مارکت جدید
 * POST /markets
 */
export async function createMarket(payload: CreateMarketPayload): Promise<Market> {
  const { data } = await apiClient.post<Market>("/markets", payload);
  return data;
}

/**
 * گت مارکت جاری کاربر
 * GET /markets/me
 */
export async function fetchMyMarket(): Promise<Market> {
  const { data } = await apiClient.get<Market>("/markets/me");
  return data;
}
