import { apiClient } from "@/services/client";

export interface CreateWarehousePayload {
  name: string;
  location: string;
  details?: string;
}

export interface UpdateWarehousePayload {
  name?: string;
  location?: string;
  details?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  details: string;
}

interface RawWarehouse {
  id?: string;
  _id?: string;
  name?: string;
  warehouse_name?: string;
  warehouseName?: string;
  location?: string;
  warehouse_location?: string;
  warehouseLocation?: string;
  details?: string;
  description?: string;
}

function normalizeWarehouse(raw: RawWarehouse): Warehouse {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? raw.warehouse_name ?? raw.warehouseName ?? "",
    location: raw.location ?? raw.warehouse_location ?? raw.warehouseLocation ?? "",
    details: raw.details ?? raw.description ?? "",
  };
}

/**
 * فهرست گدام‌ها
 * GET /warehouses — پاسخ: { data: Warehouse[], meta }
 */
export async function fetchWarehouses(): Promise<Warehouse[]> {
  const { data } = await apiClient.get("/warehouses");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeWarehouse);
}

/**
 * دریافت یک گدام
 * GET /warehouses/:id
 */
export async function fetchWarehouse(id: string): Promise<Warehouse> {
  const { data } = await apiClient.get(`/warehouses/${id}`);
  return normalizeWarehouse(data ?? {});
}

/**
 * ایجاد گدام جدید
 * POST /warehouses
 */
export async function createWarehouse(
  payload: CreateWarehousePayload,
): Promise<Warehouse> {
  const { data } = await apiClient.post("/warehouses", payload);
  return normalizeWarehouse(data ?? {});
}

/**
 * بروزرسانی گدام
 * PATCH /warehouses/:id
 */
export async function updateWarehouse(
  id: string,
  payload: UpdateWarehousePayload,
): Promise<Warehouse> {
  const { data } = await apiClient.patch(`/warehouses/${id}`, payload);
  return normalizeWarehouse(data ?? {});
}

/**
 * حذف گدام
 * DELETE /warehouses/:id
 */
export async function deleteWarehouse(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/warehouses/${id}`,
  );
  return data ?? {};
}
