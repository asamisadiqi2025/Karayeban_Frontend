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

export interface InventoryTransaction {
  id: string;
  marketId: string;
  warehouseId: string;
  itemId: string;
  type: string;
  quantity: string;
  unitPrice: string | null;
  totalAmount: string;
  costOfGoodsSold: string | null;
  accountId: string | null;
  currencyId: string;
  transactionDate: string;
  notes: string;
  createdById: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: string;
  averageCost: string;
  warehouseId: string;
  currencyId: string;
  categoryId: string;
  details: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  warehouse: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  currency: { id: string; code: string; name: string } | null;
  transactions: InventoryTransaction[];
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
  quantity?: string | number;
  averageCost?: string | number;
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
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  warehouse?: { id?: string; name?: string } | null;
  category?: { id?: string; name?: string } | null;
  currency?: { id?: string; code?: string; name?: string } | null;
  transactions?: Array<Record<string, unknown>>;
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
  const transactions: InventoryTransaction[] = Array.isArray(raw.transactions)
    ? raw.transactions.map((t) => ({
        id: String(t.id ?? ""),
        marketId: String(t.marketId ?? ""),
        warehouseId: String(t.warehouseId ?? ""),
        itemId: String(t.itemId ?? ""),
        type: String(t.type ?? ""),
        quantity: String(t.quantity ?? "0"),
        unitPrice: t.unitPrice != null ? String(t.unitPrice) : null,
        totalAmount: String(t.totalAmount ?? "0"),
        costOfGoodsSold: t.costOfGoodsSold != null ? String(t.costOfGoodsSold) : null,
        accountId: t.accountId != null ? String(t.accountId) : null,
        currencyId: String(t.currencyId ?? ""),
        transactionDate: String(t.transactionDate ?? ""),
        notes: String(t.notes ?? ""),
        createdById: String(t.createdById ?? ""),
        createdAt: String(t.createdAt ?? ""),
      }))
    : [];
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? raw.item_name ?? raw.itemName ?? "",
    unit: raw.unit ?? "",
    quantity: String(raw.quantity ?? "0"),
    averageCost: String(raw.averageCost ?? "0"),
    warehouseId: raw.warehouseId ?? raw.warehouse_id ?? raw.warehouseID ?? "",
    currencyId: raw.currencyId ?? raw.currency_id ?? raw.currencyID ?? "",
    categoryId: raw.categoryId ?? raw.category_id ?? raw.categoryID ?? "",
    details: raw.details ?? raw.description ?? "",
    isActive: raw.isActive ?? true,
    isDeleted: raw.isDeleted ?? false,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
    warehouse: raw.warehouse ? { id: String(raw.warehouse.id ?? ""), name: String(raw.warehouse.name ?? "") } : null,
    category: raw.category ? { id: String(raw.category.id ?? ""), name: String(raw.category.name ?? "") } : null,
    currency: raw.currency ? { id: String(raw.currency.id ?? ""), code: String(raw.currency.code ?? ""), name: String(raw.currency.name ?? "") } : null,
    transactions,
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

export interface InventorySummaryWarehouseCurrency {
  warehouseId: string;
  currencyId: string;
  currencyCode: string;
  currencyName: string;
  itemCount: number;
  totalValue: string;
}

export interface InventorySummary {
  marketId: string;
  totalItems: number;
  byWarehouseAndCurrency: InventorySummaryWarehouseCurrency[];
}

/**
 * خلاصه اجناس انبار
 * GET /inventory/items/summary
 */
export async function fetchInventorySummary(): Promise<InventorySummary> {
  const { data } = await apiClient.get("/inventory/items/summary");
  return {
    marketId: data?.marketId ?? "",
    totalItems: data?.totalItems ?? 0,
    byWarehouseAndCurrency: Array.isArray(data?.byWarehouseAndCurrency)
      ? data.byWarehouseAndCurrency
      : [],
  };
}
