import { apiClient } from "@/services/client";

export interface CreateExpenseCategoryPayload {
  name: string;
}

export interface UpdateExpenseCategoryPayload {
  name?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

interface RawExpenseCategory {
  id?: string;
  _id?: string;
  name?: string;
  category_name?: string;
  categoryName?: string;
}

function normalizeExpenseCategory(raw: RawExpenseCategory): ExpenseCategory {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? raw.category_name ?? raw.categoryName ?? "",
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
  const { data } = await apiClient.post("/expenses/categories", payload);
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
  const { data } = await apiClient.patch(`/expenses/categories/${id}`, payload);
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
