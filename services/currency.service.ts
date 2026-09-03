import { apiClient } from "@/services/client";

export interface CurrencyCatalogItem {
  code: string;
  name: string;
  symbol: string | null;
  decimalDigits: number;
}

export interface AddedCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
}

/**
 * گت کاتالوگ کامل واحدهای پولی جهان (ISO 4217)
 * GET /currencies/catalog?search=...
 */
export async function fetchCurrencyCatalog(search?: string): Promise<CurrencyCatalogItem[]> {
  const { data } = await apiClient.get<CurrencyCatalogItem[]>("/currencies/catalog", {
    params: { search: search?.trim() || undefined },
  });
  return data;
}

/**
 * گت واحدهای پولی که به سیستم اضافه شده‌اند
 * GET /currencies
 */
export async function fetchAddedCurrencies(): Promise<AddedCurrency[]> {
  const { data } = await apiClient.get("/currencies");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items as AddedCurrency[];
}

/**
 * افزودن واحد پولی جدید به سیستم
 * POST /currencies  body: { code }
 */
export async function addCurrencyToSystem(code: string): Promise<AddedCurrency> {
  const { data } = await apiClient.post<AddedCurrency>("/currencies", { code });
  return data;
}

/**
 * حذف واحد پولی از سیستم
 * DELETE /currencies/:id
 */
export async function deleteCurrencyFromSystem(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/currencies/${id}`);
  return data;
}
