import { apiClient } from "@/services/client";

export type UnitType = "shop" | "unit" | "stall";

export interface CreateUnitPayload {
  marketId: string;
  shopNumber: string;
  floorId: string;
  type: UnitType;
  area: number;
  location?: string;
  details?: string;
}

export interface UpdateUnitPayload {
  shopNumber?: string;
  floorId?: string;
  type?: UnitType;
  area?: number;
  location?: string;
  details?: string;
}

export interface Unit {
  id: string;
  shopNumber: string;
  floorId: string;
  type: UnitType;
  area: number;
  location: string;
  details: string;
}

interface RawUnit {
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
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function toStringValue(value: string | number | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

function toUnitType(value: string | undefined): UnitType {
  if (value === "shop" || value === "unit" || value === "stall") return value;
  return "shop";
}

function normalizeUnit(raw: RawUnit): Unit {
  return {
    id: raw.id ?? raw._id ?? "",
    shopNumber: toStringValue(raw.shopNumber ?? raw.shop_number),
    floorId: raw.floorId ?? raw.floor_id ?? "",
    type: toUnitType(raw.type),
    area: toNumber(raw.area),
    location: raw.location ?? "",
    details: raw.details ?? raw.description ?? "",
  };
}

/**
 * فهرست واحدها / دوکان‌ها
 * GET /shops
 */
export async function fetchUnits(): Promise<Unit[]> {
  const { data } = await apiClient.get("/shops");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeUnit);
}

/**
 * دریافت یک واحد
 * GET /shops/:id
 */
export async function fetchUnit(id: string): Promise<Unit> {
  const { data } = await apiClient.get(`/shops/${id}`);
  return normalizeUnit(data ?? {});
}

/**
 * ایجاد واحد جدید
 * POST /shops
 */
export async function createUnit(payload: CreateUnitPayload): Promise<Unit> {
  const { data } = await apiClient.post("/shops", payload);
  return normalizeUnit(data ?? {});
}

/**
 * بروزرسانی واحد
 * PATCH /shops/:id
 */
export async function updateUnit(
  id: string,
  payload: UpdateUnitPayload,
): Promise<Unit> {
  const { data } = await apiClient.patch(`/shops/${id}`, payload);
  return normalizeUnit(data ?? {});
}

/**
 * حذف واحد
 * DELETE /shops/:id
 */
export async function deleteUnit(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/shops/${id}`,
  );
  return data ?? {};
}
