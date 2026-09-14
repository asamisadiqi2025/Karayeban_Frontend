import { apiClient } from "@/services/client";

export interface CreateInventoryCategoryPayload {
  name: string;
}

export interface UpdateInventoryCategoryPayload {
  name?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
}

interface RawInventoryCategory {
  id?: string;
  _id?: string;
  name?: string;
  category_name?: string;
  categoryName?: string;
}

function normalizeInventoryCategory(raw: RawInventoryCategory): InventoryCategory {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? raw.category_name ?? raw.categoryName ?? "",
  };
}

/**
 * فهرست دسته‌بندی‌های انبار
 * GET /Inventory/categories
 */
export async function fetchInventoryCategories(): Promise<InventoryCategory[]> {
  const { data } = await apiClient.get("/Inventory/categories");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeInventoryCategory);
}

/**
 * دریافت یک دسته‌بندی
 * GET /Inventory/categories/:id
 */
export async function fetchInventoryCategory(id: string): Promise<InventoryCategory> {
  const { data } = await apiClient.get(`/Inventory/categories/${id}`);
  return normalizeInventoryCategory(data ?? {});
}

/**
 * ایجاد دسته‌بندی جدید
 * POST /Inventory/categories
 */
export async function createInventoryCategory(
  payload: CreateInventoryCategoryPayload,
): Promise<InventoryCategory> {
  const { data } = await apiClient.post("/Inventory/categories", payload);
  return normalizeInventoryCategory(data ?? {});
}

/**
 * بروزرسانی دسته‌بندی
 * PATCH /Inventory/categories/:id
 */
export async function updateInventoryCategory(
  id: string,
  payload: UpdateInventoryCategoryPayload,
): Promise<InventoryCategory> {
  const { data } = await apiClient.patch(`/Inventory/categories/${id}`, payload);
  return normalizeInventoryCategory(data ?? {});
}

/**
 * حذف دسته‌بندی
 * DELETE /Inventory/categories/:id
 */
export async function deleteInventoryCategory(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/Inventory/categories/${id}`,
  );
  return data ?? {};
}
