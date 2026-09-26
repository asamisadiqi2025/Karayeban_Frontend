import { apiClient } from "@/services/client";

export interface CreateExpenseCategoryPayload {
  name: string;
  parentId?: string | null;
}

export interface UpdateExpenseCategoryPayload {
  name?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface ExpenseCategory {
  id: string;
  marketId: string | null;
  name: string;
  isActive: boolean;
  parentId: string | null;
}

interface RawExpenseCategory {
  id?: string;
  _id?: string;
  marketId?: string | null;
  market_id?: string | null;
  name?: string;
  category_name?: string;
  categoryName?: string;
  isActive?: boolean;
  is_active?: boolean;
  parentId?: string | null;
  parent_id?: string | null;
  parentID?: string | null;
}

function normalizeExpenseCategory(raw: RawExpenseCategory): ExpenseCategory {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? null,
    name: raw.name ?? raw.category_name ?? raw.categoryName ?? "",
    isActive: raw.isActive ?? raw.is_active ?? true,
    parentId: raw.parentId ?? raw.parent_id ?? raw.parentID ?? null,
  };
}

/**
 * فهرست دسته‌بندی‌های مصارف
 * GET /expenses/categories
 */
export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data } = await apiClient.get("/expenses/categories");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeExpenseCategory);
}

/**
 * دریافت یک دسته‌بندی
 * GET /expenses/categories/:id
 */
export async function fetchExpenseCategory(id: string): Promise<ExpenseCategory> {
  const { data } = await apiClient.get(`/expenses/categories/${id}`);
  return normalizeExpenseCategory(data ?? {});
}

/**
 * ایجاد دسته‌بندی جدید
 * POST /expenses/categories
 */
export async function createExpenseCategory(
  payload: CreateExpenseCategoryPayload,
): Promise<ExpenseCategory> {
  const body: Record<string, unknown> = { name: payload.name };
  if (payload.parentId !== undefined && payload.parentId !== null) {
    body.parentId = payload.parentId;
  }
  const { data } = await apiClient.post("/expenses/categories", body);
  return normalizeExpenseCategory(data ?? {});
}

/**
 * بروزرسانی دسته‌بندی
 * PATCH /expenses/categories/:id
 */
export async function updateExpenseCategory(
  id: string,
  payload: UpdateExpenseCategoryPayload,
): Promise<ExpenseCategory> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.parentId !== undefined) {
    body.parentId = payload.parentId === null ? null : payload.parentId;
  }
  if (payload.isActive !== undefined) body.isActive = payload.isActive;
  const { data } = await apiClient.patch(`/expenses/categories/${id}`, body);
  return normalizeExpenseCategory(data ?? {});
}

/**
 * حذف دسته‌بندی
 * DELETE /expenses/categories/:id
 */
export async function deleteExpenseCategory(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/expenses/categories/${id}`,
  );
  return data ?? {};
}