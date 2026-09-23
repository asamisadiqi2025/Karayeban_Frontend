import { apiClient } from "@/services/client";

export interface CreateInventoryUnitPayload {
  name: string;
  symbol: string;
}

export interface UpdateInventoryUnitPayload {
  name?: string;
  symbol?: string;
  isActive?: boolean;
}

export interface InventoryUnit {
  id: string;
  marketId: string | null;
  name: string;
  symbol: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RawInventoryUnit {
  id?: string;
  _id?: string;
  marketId?: string | null;
  market_id?: string | null;
  name?: string;
  unit_name?: string;
  unitName?: string;
  symbol?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function toBool(value: boolean | undefined): boolean {
  return value ?? true;
}

function normalizeInventoryUnit(raw: RawInventoryUnit): InventoryUnit {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? null,
    name: raw.name ?? raw.unit_name ?? raw.unitName ?? "",
    symbol: raw.symbol ?? "",
    isActive: toBool(raw.isActive ?? raw.is_active),
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
  };
}

/**
 * فهرست واحدات اندازه‌گیری (واحدات گدام)
 * GET /inventory/units
 */
export async function fetchInventoryUnits(): Promise<InventoryUnit[]> {
  const { data } = await apiClient.get("/inventory/units");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeInventoryUnit);
}

/**
 * دریافت یک واحد اندازه‌گیری
 * GET /inventory/units/:id
 */
export async function fetchInventoryUnit(id: string): Promise<InventoryUnit> {
  const { data } = await apiClient.get(`/inventory/units/${id}`);
  return normalizeInventoryUnit(data ?? {});
}

/**
 * ایجاد واحد اندازه‌گیری جدید
 * POST /inventory/units
 */
export async function createInventoryUnit(
  payload: CreateInventoryUnitPayload,
): Promise<InventoryUnit> {
  const { data } = await apiClient.post("/inventory/units", payload);
  return normalizeInventoryUnit(data ?? {});
}

/**
 * بروزرسانی واحد اندازه‌گیری
 * PATCH /inventory/units/:id
 */
export async function updateInventoryUnit(
  id: string,
  payload: UpdateInventoryUnitPayload,
): Promise<InventoryUnit> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.symbol !== undefined) body.symbol = payload.symbol;
  if (payload.isActive !== undefined) body.isActive = payload.isActive;
  const { data } = await apiClient.patch(`/inventory/units/${id}`, body);
  return normalizeInventoryUnit(data ?? {});
}

/**
 * حذف واحد اندازه‌گیری
 * DELETE /inventory/units/:id
 */
export async function deleteInventoryUnit(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/inventory/units/${id}`,
  );
  return data ?? {};
}