import { apiClient } from "@/services/client";

export interface CreateExpensePayload {
  categoryId: string;
  amount: number;
  accountId: string;
  description: string;
}

export interface UpdateExpensePayload {
  categoryId?: string;
  amount?: number;
  accountId?: string;
  description?: string;
}

export interface Expense {
  id: string;
  marketId: string;
  categoryId: string;
  amount: number;
  currencyId: string;
  usdEquivalent: number | null;
  expenseDate: string;
  description: string;
  accountId: string;
  paidById: string;
  receiptImage: string | null;
  createdAt: string;
  category: { id: string; name: string; parent: { id: string; name: string } | null } | null;
  currency: { id: string; code: string; name: string } | null;
  account: { id: string; name: string } | null;
  paidBy: { id: string; fullName: string } | null;
}

interface RawNamedRef {
  id?: string;
  _id?: string;
  name?: string;
}

interface RawPaidBy {
  id?: string;
  _id?: string;
  fullName?: string;
  full_name?: string;
}

interface RawExpense {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  categoryId?: string;
  category_id?: string;
  amount?: unknown;
  currencyId?: string;
  currency_id?: string;
  usdEquivalent?: unknown;
  usd_equivalent?: unknown;
  expenseDate?: string;
  expense_date?: string;
  accountId?: string;
  account_id?: string;
  paidById?: string;
  paid_by_id?: string;
  receiptImage?: string | null;
  receipt_image?: string | null;
  description?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  category?: (RawNamedRef & { parent?: RawNamedRef | null }) | null;
  currency?: (RawNamedRef & { code?: string }) | null;
  account?: RawNamedRef | null;
  paidBy?: RawPaidBy | null;
  paid_by?: RawPaidBy | null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeExpense(raw: RawExpense): Expense {
  const amount = toNumber(raw.amount) ?? 0;
  const paidBy = raw.paidBy ?? raw.paid_by ?? null;
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    categoryId: raw.categoryId ?? raw.category_id ?? "",
    amount,
    currencyId: raw.currencyId ?? raw.currency_id ?? "",
    usdEquivalent: toNumber(raw.usdEquivalent ?? raw.usd_equivalent),
    expenseDate:
      raw.expenseDate ?? raw.expense_date ?? raw.createdAt ?? raw.created_at ?? "",
    accountId: raw.accountId ?? raw.account_id ?? "",
    paidById: raw.paidById ?? raw.paid_by_id ?? paidBy?.id ?? paidBy?._id ?? "",
    receiptImage: raw.receiptImage ?? raw.receipt_image ?? null,
    description: raw.description ?? raw.notes ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    category: raw.category
      ? {
          id: String(raw.category.id ?? raw.category._id ?? ""),
          name: String(raw.category.name ?? ""),
          parent: raw.category.parent
            ? {
                id: String(raw.category.parent.id ?? raw.category.parent._id ?? ""),
                name: String(raw.category.parent.name ?? ""),
              }
            : null,
        }
      : null,
    currency: raw.currency
      ? {
          id: String(raw.currency.id ?? raw.currency._id ?? ""),
          code: String(raw.currency.code ?? ""),
          name: String(raw.currency.name ?? ""),
        }
      : null,
    account: raw.account
      ? {
          id: String(raw.account.id ?? raw.account._id ?? ""),
          name: String(raw.account.name ?? ""),
        }
      : null,
    paidBy: paidBy
      ? {
          id: String(paidBy.id ?? paidBy._id ?? ""),
          fullName: String(paidBy.fullName ?? paidBy.full_name ?? ""),
        }
      : null,
  };
}

/**
 * فهرست مصارف
 * GET /expenses
 */
export interface ExpensesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ExpensesPage {
  items: Expense[];
  meta: ExpensesMeta | null;
}

function normalizeMeta(raw: unknown): ExpensesMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    total: num(m.total),
    page: num(m.page),
    limit: num(m.limit),
    totalPages: num(m.totalPages),
    hasNextPage: m.hasNextPage === true,
    hasPrevPage: m.hasPrevPage === true,
  };
}

/**
 * فهرست مصارف به همراه متادیتای صفحه‌بندی
 * GET /expenses
 */
export async function fetchExpensesPage(): Promise<ExpensesPage> {
  const { data } = await apiClient.get("/expenses");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  const meta = Array.isArray(data) ? null : normalizeMeta(data?.meta);
  return { items: items.map(normalizeExpense), meta };
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
 * واحد پولی از روی حساب (accountId) در بک‌اند تعیین می‌شود و ارسال نمی‌گردد
 */
export async function createExpense(
  payload: CreateExpensePayload,
): Promise<Expense> {
  const { data } = await apiClient.post("/expenses", {
    categoryId: payload.categoryId,
    amount: payload.amount,
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
