import { apiClient } from "@/services/client";

export interface CreateAssetPayload {
  name: string;
  category: string;
  purchasePrice: number;
  currencyId: string;
  lifespanYears: number;
  purchaseDate: string;
  details?: string;
  marketId?: string;
}

export interface UpdateAssetPayload {
  name?: string;
  category?: string;
  purchasePrice?: number;
  currencyId?: string;
  lifespanYears?: number;
  purchaseDate?: string;
  details?: string;
  marketId?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  currencyId: string;
  lifespanYears: number;
  purchaseDate: string;
  details: string;
  marketId: string;
}

interface RawAsset {
  id?: string;
  _id?: string;
  name?: string;
  category?: string;
  purchasePrice?: number;
  purchase_price?: number;
  currencyId?: string;
  currency_id?: string;
  lifespanYears?: number;
  lifespan_years?: number;
  purchaseDate?: string;
  purchase_date?: string;
  details?: string;
  description?: string;
  marketId?: string;
  market_id?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeAsset(raw: RawAsset): Asset {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? "",
    category: raw.category ?? "",
    purchasePrice: toNumber(raw.purchasePrice ?? raw.purchase_price),
    currencyId: raw.currencyId ?? raw.currency_id ?? "",
    lifespanYears: toNumber(raw.lifespanYears ?? raw.lifespan_years),
    purchaseDate: raw.purchaseDate ?? raw.purchase_date ?? "",
    details: raw.details ?? raw.description ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
  };
}

/**
 * فهرست دارایی‌ها
 * GET /assets
 */
export async function fetchAssets(): Promise<Asset[]> {
  const { data } = await apiClient.get("/assets");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeAsset);
}

/**
 * دریافت یک دارایی
 * GET /assets/:id
 */
export async function fetchAsset(id: string): Promise<Asset> {
  const { data } = await apiClient.get(`/assets/${id}`);
  return normalizeAsset(data ?? {});
}

/**
 * ایجاد دارایی جدید
 * POST /assets
 */
export async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
  const { data } = await apiClient.post("/assets", payload);
  return normalizeAsset(data ?? {});
}

/**
 * بروزرسانی دارایی
 * PATCH /assets/:id
 */
export async function updateAsset(
  id: string,
  payload: UpdateAssetPayload,
): Promise<Asset> {
  const { data } = await apiClient.patch(`/assets/${id}`, payload);
  return normalizeAsset(data ?? {});
}

/**
 * حذف دارایی
 * DELETE /assets/:id
 */
export async function deleteAsset(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(`/assets/${id}`);
  return data ?? {};
}
