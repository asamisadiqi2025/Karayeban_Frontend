import { apiClient } from "@/services/client";

export interface CreateInventoryItemPayload {
  name: string;
  unit: string;
  warehouseId: string;
  currencyId: string;
  categoryId: string;
  details?: string;
  openingStock?: {
    quantity: number;
    unitCost: number;
    notes?: string;
  };
}

export interface UpdateInventoryItemPayload {
  name?: string;
  unit?: string;
  warehouseId?: string;
  currencyId?: string;
  categoryId?: string;
  details?: string;
  openingStock?: {
    quantity?: number;
    unitCost?: number;
    notes?: string;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  warehouseId: string;
  currencyId: string;
  categoryId: string;
  details: string;
  openingStock: {
    quantity: number;
    unitCost: number;
    notes: string;
  };
}

interface RawInventoryItem {
  id?: string;
  _id?: string;
  name?: string;
  item_name?: string;
  itemName?: string;
  unit?: string;
  warehouseId?: string;
  warehouse_id?: string;
  warehouseID?: string;
  currencyId?: string;
  currency_id?: string;
  currencyID?: string;
  categoryId?: string;
  category_id?: string;
  categoryID?: string;
  details?: string;
  description?: string;
  openingStock?: {
    quantity?: number;
    unitCost?: number;
    notes?: string;
  };
  opening_stock?: {
    quantity?: number;
    unit_cost?: number;
    notes?: string;
  };
}

function normalizeInventoryItem(raw: RawInventoryItem): InventoryItem {
  const stock: Record<string, unknown> = (raw.openingStock ?? raw.opening_stock ?? {}) as Record<string, unknown>;
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? raw.item_name ?? raw.itemName ?? "",
    unit: raw.unit ?? "",
    warehouseId: raw.warehouseId ?? raw.warehouse_id ?? raw.warehouseID ?? "",
    currencyId: raw.currencyId ?? raw.currency_id ?? raw.currencyID ?? "",
    categoryId: raw.categoryId ?? raw.category_id ?? raw.categoryID ?? "",
    details: raw.details ?? raw.description ?? "",
    openingStock: {
      quantity: typeof stock.quantity === "number" ? stock.quantity : Number(stock.quantity ?? 0),
      unitCost: typeof stock.unitCost === "number" ? stock.unitCost : Number(stock.unit_cost ?? 0),
      notes: typeof stock.notes === "string" ? stock.notes : "",
    },
  };
}

/**
 * فهرست اجناس انبار
 * GET /inventory/items
 */
export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const { data } = await apiClient.get("/inventory/items");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeInventoryItem);
}

/**
 * دریافت یک جنس
 * GET /inventory/items/:id
 */
export async function fetchInventoryItem(id: string): Promise<InventoryItem> {
  const { data } = await apiClient.get(`/inventory/items/${id}`);
  return normalizeInventoryItem(data ?? {});
}

/**
 * ایجاد جنس جدید
 * POST /inventory/items
 */
export async function createInventoryItem(
  payload: CreateInventoryItemPayload,
): Promise<InventoryItem> {
  const { data } = await apiClient.post("/inventory/items", {
    name: payload.name,
    unit: payload.unit,
    warehouseId: payload.warehouseId,
    currencyId: payload.currencyId,
    categoryId: payload.categoryId,
    details: payload.details,
    openingStock: payload.openingStock,
  });
  return normalizeInventoryItem(data ?? {});
}

/**
 * بروزرسانی جنس
 * PATCH /inventory/items/:id
 */
export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemPayload,
): Promise<InventoryItem> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.unit !== undefined) body.unit = payload.unit;
  if (payload.warehouseId !== undefined) body.warehouseId = payload.warehouseId;
  if (payload.currencyId !== undefined) body.currencyId = payload.currencyId;
  if (payload.categoryId !== undefined) body.categoryId = payload.categoryId;
  if (payload.details !== undefined) body.details = payload.details;
  if (payload.openingStock !== undefined) body.openingStock = payload.openingStock;
  const { data } = await apiClient.patch(`/inventory/items/${id}`, body);
  return normalizeInventoryItem(data ?? {});
}

/**
 * حذف جنس
 * DELETE /inventory/items/:id
 */
export async function deleteInventoryItem(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/inventory/items/${id}`,
  );
  return data ?? {};
}
