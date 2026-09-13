import { apiClient } from "@/services/client";

export type ShopType = "shop" | "unit" | "stall";

export interface CreateShopPayload {
  marketId: string;
  shopNumber: string;
  floorId: string;
  type: ShopType;
  area: number;
  location?: string;
  details?: string;
}

export interface UpdateShopPayload {
  shopNumber?: string;
  floorId?: string;
  type?: ShopType;
  area?: number;
  location?: string;
  details?: string;
}

export interface Shop {
  id: string;
  shopNumber: string;
  floorId: string;
  type: ShopType;
  area: number;
  location: string;
  details: string;
  name?: string;
}

interface RawShop {
  id?: string;
  _id?: string;
  shopNumber?: string | number;
  shop_number?: string | number;
  floorId?: string;
  floor_id?: string;
  type?: string;
  area?: unknown;
  location?: string;
  details?: string;
  description?: string;
  name?: string;
  shopName?: string;
  shop_name?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function toStringValue(value: string | number | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

function toShopType(value: string | undefined): ShopType {
  if (value === "shop" || value === "unit" || value === "stall") return value;
  return "shop";
}

function normalizeShop(raw: RawShop): Shop {
  return {
    id: raw.id ?? raw._id ?? "",
    shopNumber: toStringValue(raw.shopNumber ?? raw.shop_number),
    floorId: raw.floorId ?? raw.floor_id ?? "",
    type: toShopType(raw.type),
    area: toNumber(raw.area),
    location: raw.location ?? "",
    details: raw.details ?? raw.description ?? "",
    name: raw.name ?? raw.shopName ?? raw.shop_name ?? undefined,
  };
}

/**
 * فهرست دوکان‌ها
 * GET /shops — پاسخ: { data: Shop[], meta }
 */
export async function fetchShops(): Promise<Shop[]> {
  const { data } = await apiClient.get("/shops");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeShop);
}

/**
 * دریافت یک دوکان
 * GET /shops/:id
 */
export async function fetchShop(id: string): Promise<Shop> {
  const { data } = await apiClient.get(`/shops/${id}`);
  return normalizeShop(data ?? {});
}

/**
 * ایجاد دوکان جدید
 * POST /shops
 */
export async function createShop(payload: CreateShopPayload): Promise<Shop> {
  const { data } = await apiClient.post("/shops", payload);
  return normalizeShop(data ?? {});
}

/**
 * بروزرسانی دوکان
 * PATCH /shops/:id
 */
export async function updateShop(
  id: string,
  payload: UpdateShopPayload,
): Promise<Shop> {
  const { data } = await apiClient.patch(`/shops/${id}`, payload);
  return normalizeShop(data ?? {});
}

/**
 * حذف دوکان
 * DELETE /shops/:id
 */
export async function deleteShop(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(`/shops/${id}`);
  return data ?? {};
}