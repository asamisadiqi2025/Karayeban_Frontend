import { apiClient } from "@/services/client";

export interface CreateExpensePayload {
  categoryId: string;
  amount: number;
  currencyId: string;
  accountId: string;
  description: string;
}

export interface UpdateExpensePayload {
  categoryId?: string;
  amount?: number;
  currencyId?: string;
  accountId?: string;
  description?: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  currencyId: string;
  accountId: string;
  description: string;
  createdAt: string;
  category: { id: string; name: string } | null;
  currency: { id: string; code: string; name: string } | null;
  account: { id: string; name: string } | null;
}

interface RawExpense {
  id?: string;
  _id?: string;
  categoryId?: string;
  category_id?: string;
  amount?: unknown;
  currencyId?: string;
  currency_id?: string;
  accountId?: string;
  account_id?: string;
  description?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  category?: { id?: string; name?: string } | null;
  currency?: { id?: string; code?: string; name?: string } | null;
  account?: { id?: string; name?: string } | null;
}

function normalizeExpense(raw: RawExpense): Expense {
  const amount = typeof raw.amount === "number"
    ? raw.amount
    : Number(raw.amount ?? 0);
  return {
    id: raw.id ?? raw._id ?? "",
    categoryId: raw.categoryId ?? raw.category_id ?? "",
    amount: Number.isFinite(amount) ? amount : 0,
    currencyId: raw.currencyId ?? raw.currency_id ?? "",
    accountId: raw.accountId ?? raw.account_id ?? "",
    description: raw.description ?? raw.notes ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    category: raw.category
      ? { id: String(raw.category.id ?? ""), name: String(raw.category.name ?? "") }
      : null,
    currency: raw.currency
      ? { id: String(raw.currency.id ?? ""), code: String(raw.currency.code ?? ""), name: String(raw.currency.name ?? "") }
      : null,
    account: raw.account
      ? { id: String(raw.account.id ?? ""), name: String(raw.account.name ?? "") }
      : null,
  };
}

/**
 * فهرست مصارف
 * GET /expenses
 */
export async function fetchExpenses(): Promise<Expense[]> {
  const { data } = await apiClient.get("/expenses");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeExpense);
}

/**
 * دریافت یک مصرف
 * GET /expenses/:id
 */
export async function fetchExpense(id: string): Promise<Expense> {
  const { data } = await apiClient.get(`/expenses/${id}`);
  return normalizeExpense(data ?? {});
}

/**
 * ایجاد مصرف جدید
 * POST /expenses
 */
export async function createExpense(
  payload: CreateExpensePayload,
): Promise<Expense> {
  const { data } = await apiClient.post("/expenses", {
    categoryId: payload.categoryId,
    amount: payload.amount,
    currencyId: payload.currencyId,
    accountId: payload.accountId,
    description: payload.description,
  });
  return normalizeExpense(data ?? {});
}

/**
 * بروزرسانی مصرف
 * PATCH /expenses/:id
 */
export async function updateExpense(
  id: string,
  payload: UpdateExpensePayload,
): Promise<Expense> {
  const body: Record<string, unknown> = {};
  if (payload.categoryId !== undefined) body.categoryId = payload.categoryId;
  if (payload.amount !== undefined) body.amount = payload.amount;
  if (payload.currencyId !== undefined) body.currencyId = payload.currencyId;
  if (payload.accountId !== undefined) body.accountId = payload.accountId;
  if (payload.description !== undefined) body.description = payload.description;
  const { data } = await apiClient.patch(`/expenses/${id}`, body);
  return normalizeExpense(data ?? {});
}

/**
 * حذف مصرف
 * DELETE /expenses/:id
 */
export async function deleteExpense(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/expenses/${id}`,
  );
  return data ?? {};
}
