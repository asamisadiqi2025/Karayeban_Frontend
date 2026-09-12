import { apiClient } from "@/services/client";

export type BankAccountType = "CASH" | "BANK";

export interface CreateBankAccountPayload {
  name: string;
  type: BankAccountType;
  currencyId: string;
  openingBalance: {
    amount: number;
  };
  /** فقط برای نوع BANK — الزامی است */
  bankName?: string | null;
  /** فقط برای نوع BANK — اختیاری است */
  accountNumber?: string | null;
}

export interface BankAccount {
  id: string;
  name: string;
  type: BankAccountType;
  currencyId: string;
  currencyCode?: string;
  bankName?: string | null;
  accountNumber?: string | null;
  openingBalance: number;
}

interface RawBankAccount {
  id?: string;
  _id?: string;
  name?: string;
  type?: string;
  kind?: string;
  currencyId?: string;
  currency_id?: string;
  currencyCode?: string;
  currency_code?: string;
  currency?: { id?: string; code?: string };
  currencyInfo?: { id?: string; code?: string };
  openingBalance?: unknown;
  openingAmount?: unknown;
  balance?: unknown;
  bankName?: string | null;
  bank_name?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

/**
 * بک‌اندهای مختلف فرمت پاسخ‌شان فرق دارد؛ این تابع فیلدهای رایج را یکسان می‌کند
 * مبلغ افتتاحیه در پاسخ در فیلد balance (دسیمال) می‌آید: GET/POST /accounts
 */
function normalizeBankAccount(raw: RawBankAccount): BankAccount {
  const currency = raw.currency ?? raw.currencyInfo;
  const balance = raw.openingBalance;
  const openingBalanceAmount =
    balance && typeof balance === "object" && "amount" in balance
      ? (balance as { amount?: unknown }).amount
      : raw.balance ?? raw.openingAmount ?? balance;

  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? "",
    type: ((raw.type ?? raw.kind ?? "CASH") as BankAccountType).toUpperCase() as BankAccountType,
    currencyId: raw.currencyId ?? raw.currency_id ?? currency?.id ?? "",
    currencyCode: raw.currencyCode ?? raw.currency_code ?? currency?.code,
    bankName: raw.bankName ?? raw.bank_name ?? null,
    accountNumber: raw.accountNumber ?? raw.account_number ?? null,
    openingBalance: toNumber(openingBalanceAmount),
  };
}

/**
 * لیست حساب‌های نقدی و بانکی
 * GET /accounts — پاسخ: { data: Account[], meta }
 */
export async function fetchBankAccounts(): Promise<BankAccount[]> {
  const { data } = await apiClient.get("/accounts");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeBankAccount);
}

/**
 * ایجاد حساب نقدی یا بانکی
 * POST /accounts
 * body: { name, type: CASH|BANK, currencyId, openingBalance: { amount }, bankName?, accountNumber? }
 */
export async function createBankAccount(payload: CreateBankAccountPayload): Promise<BankAccount> {
  const { data } = await apiClient.post("/accounts", payload);
  return normalizeBankAccount(data);
}

/**
 * بروزرسانی حساب
 * PATCH /accounts/:id
 */
export async function updateBankAccount(
  id: string,
  payload: Partial<CreateBankAccountPayload>
): Promise<BankAccount> {
  const { data } = await apiClient.patch(`/accounts/${id}`, payload);
  return normalizeBankAccount(data);
}

/**
 * حذف حساب
 * DELETE /accounts/:id
 */
export async function deleteBankAccount(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/accounts/${id}`);
  return data;
}

/**
 * انتقال وجه بین دو حساب
 * POST /accounts/transfer
 * body: { fromAccountId, toAccountId, amount }
 * فقط بین دو حساب با ارز مشابه (هم‌نوع) مجاز است
 */
export async function transferBetweenAccounts(payload: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  exchangeRate?: number;
}): Promise<{ message?: string }> {
  const { data } = await apiClient.post<{ message?: string }>("/accounts/transfer", payload);
  return data ?? {};
}

export interface TransferRecord {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  exchangeRate?: number;
  createdAt: number;
}

interface RawTransfer {
  id?: string;
  _id?: string;
  from?: string;
  from_account_id?: string;
  fromAccountId?: string;
  to?: string;
  to_account_id?: string;
  toAccountId?: string;
  amount?: unknown;
  exchangeRate?: unknown;
  exchange_rate?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  createdDate?: unknown;
  date?: unknown;
}

function toTimestamp(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function normalizeTransfer(raw: RawTransfer): TransferRecord {
  const amount = toNumber(raw.amount);
  const exchangeRate = toNumber(raw.exchangeRate ?? raw.exchange_rate);
  return {
    id: raw.id ?? raw._id ?? "",
    fromAccountId: raw.fromAccountId ?? raw.from_account_id ?? raw.from ?? "",
    toAccountId: raw.toAccountId ?? raw.to_account_id ?? raw.to ?? "",
    amount,
    ...(exchangeRate > 0 ? { exchangeRate } : {}),
    createdAt:
      toTimestamp(raw.createdAt ?? raw.created_at ?? raw.createdDate ?? raw.date) || Date.now(),
  };
}

/**
 * دریافت فهرست انتقال‌های انجام‌شده
 * پاسخ: { data: Transfer[], meta }
 */
export async function fetchTransfers(): Promise<TransferRecord[]> {
  const { data } = await apiClient.get("/accounts/transfer");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeTransfer);
}