import { apiClient } from "@/services/client";

export interface CreateMeterPayload {
  marketId: string;
  shopNumber: string;
  serialNumber: string;
  location?: string;
  lastReading: number;
  lastReadingDate: string;
}

export interface UpdateMeterPayload {
  shopNumber?: string;
  serialNumber?: string;
  location?: string;
  lastReading?: number;
  lastReadingDate?: string;
}

export interface Meter {
  id: string;
  shopNumber: string;
  shopId?: string;
  shopName?: string;
  serialNumber: string;
  location: string;
  lastReading: number;
  lastReadingDate: string;
}

interface RawMeter {
  id?: string;
  _id?: string;
  shopNumber?: string | number;
  shop_number?: string | number;
  shopCode?: string | number;
  shopId?: string;
  shop_id?: string;
  shop?: {
    id?: string;
    _id?: string;
    name?: string;
    shopName?: string;
    shop_name?: string;
    shopNumber?: string | number;
    shop_number?: string | number;
  } | null;
  serialNumber?: string;
  serial_number?: string;
  location?: string;
  lastReading?: unknown;
  last_reading?: unknown;
  reading?: unknown;
  lastReadingDate?: string;
  last_reading_date?: string;
  readingDate?: string;
  read_date?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function toStringValue(value: string | number | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

function toNestedShop(raw: RawMeter["shop"]) {
  return raw ?? undefined;
}

function normalizeMeter(raw: RawMeter): Meter {
  const shop = toNestedShop(raw.shop);
  return {
    id: raw.id ?? raw._id ?? "",
    shopNumber: toStringValue(
      raw.shopNumber ?? raw.shop_number ?? raw.shopCode ?? shop?.shopNumber ?? shop?.shop_number,
    ),
    shopId: raw.shopId ?? raw.shop_id ?? shop?.id ?? shop?._id ?? undefined,
    shopName:
      shop?.name ?? shop?.shopName ?? shop?.shop_name ?? undefined,
    serialNumber: toStringValue(raw.serialNumber ?? raw.serial_number),
    location: raw.location ?? "",
    lastReading: toNumber(raw.lastReading ?? raw.last_reading ?? raw.reading),
    lastReadingDate: toStringValue(
      raw.lastReadingDate ?? raw.last_reading_date ?? raw.readingDate ?? raw.read_date,
    ),
  };
}

/**
 * فهرست کنتورها
 * GET /meters — پاسخ: { data: Meter[], meta }
 */
export async function fetchMeters(): Promise<Meter[]> {
  const { data } = await apiClient.get("/meters");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeMeter);
}

/**
 * دریافت یک کنتور
 * GET /meters/:id
 */
export async function fetchMeter(id: string): Promise<Meter> {
  const { data } = await apiClient.get(`/meters/${id}`);
  return normalizeMeter(data ?? {});
}

/**
 * ایجاد کنتور جدید
 * POST /meters
 */
export async function createMeter(payload: CreateMeterPayload): Promise<Meter> {
  const { data } = await apiClient.post("/meters", payload);
  return normalizeMeter(data ?? {});
}

/**
 * بروزرسانی کنتور
 * PATCH /meters/:id
 */
export async function updateMeter(
  id: string,
  payload: UpdateMeterPayload,
): Promise<Meter> {
  const { data } = await apiClient.patch(`/meters/${id}`, payload);
  return normalizeMeter(data ?? {});
}

/**
 * حذف کنتور
 * DELETE /meters/:id
 */
export async function deleteMeter(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(`/meters/${id}`);
  return data ?? {};
}