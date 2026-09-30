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
 * دریافت یک حساب نقدی یا بانکی
 * GET /accounts/:id
 */
export async function fetchBankAccount(id: string): Promise<BankAccount> {
  const { data } = await apiClient.get(`/accounts/${id}`);
  return normalizeBankAccount(data?.data ?? data ?? {});
}

export type AccountEntryDirection = "IN" | "OUT";

export interface AccountStatementEntry {
  id: string;
  entryDate: string;
  description: string;
  direction: AccountEntryDirection;
  amount: string;
  balance: string;
}

export interface AccountStatement {
  accountId: string;
  accountName: string;
  currencyId: string;
  from: string;
  to: string;
  openingBalance: string;
  totalIn: string;
  totalOut: string;
  closingBalance: string;
  transactions: AccountStatementEntry[];
}

export interface AccountStatementParams {
  from: string;
  to: string;
}

interface RawEntry {
  id?: string;
  _id?: string;
  entryDate?: string;
  entry_date?: string;
  date?: string;
  description?: string;
  notes?: string;
  direction?: string;
  amount?: unknown;
  balance?: unknown;
}

interface RawAccountStatement {
  accountId?: string;
  account_id?: string;
  accountName?: string;
  account_name?: string;
  currencyId?: string;
  currency_id?: string;
  from?: string;
  to?: string;
  openingBalance?: unknown;
  opening_balance?: unknown;
  totalIn?: unknown;
  total_in?: unknown;
  totalOut?: unknown;
  total_out?: unknown;
  closingBalance?: unknown;
  closing_balance?: unknown;
  transactions?: RawEntry[];
}

function toStr(value: unknown): string {
  if (value == null) return "0";
  return typeof value === "string" ? value : String(value);
}

function normalizeEntry(raw: RawEntry): AccountStatementEntry {
  return {
    id: raw.id ?? raw._id ?? "",
    entryDate: raw.entryDate ?? raw.entry_date ?? raw.date ?? "",
    description: raw.description ?? raw.notes ?? "",
    direction: (raw.direction ?? "IN").toUpperCase() as AccountEntryDirection,
    amount: toStr(raw.amount),
    balance: toStr(raw.balance),
  };
}

/**
 * صورت حساب یک حساب در بازه تاریخی
 * GET /accounts/:id/statement?from=&to=
 *
 * تاریخ‌ها میلادی و به فرمت YYYY-MM-DD هستند، حتی وقتی رابط کاربری شمسی است.
 */
export async function fetchAccountStatement(
  id: string,
  params: AccountStatementParams,
): Promise<AccountStatement> {
  const { data } = await apiClient.get<{ data?: RawAccountStatement }>(
    `/accounts/${id}/statement`,
    { params: { from: params.from, to: params.to } },
  );
  const body = (data?.data ?? (data as unknown as RawAccountStatement) ?? {}) as RawAccountStatement;
  const transactions = Array.isArray(body.transactions) ? body.transactions : [];
  return {
    accountId: toStr(body.accountId ?? body.account_id),
    accountName: body.accountName ?? body.account_name ?? "",
    currencyId: toStr(body.currencyId ?? body.currency_id),
    from: toStr(body.from),
    to: toStr(body.to),
    openingBalance: toStr(body.openingBalance ?? body.opening_balance),
    totalIn: toStr(body.totalIn ?? body.total_in),
    totalOut: toStr(body.totalOut ?? body.total_out),
    closingBalance: toStr(body.closingBalance ?? body.closing_balance),
    transactions: transactions.map(normalizeEntry),
  };
}

export type AccountTransactionType = "DEPOSIT" | "WITHDRAWAL";

export interface AccountTransaction {
  id: string;
  marketId: string;
  accountId: string;
  type: AccountTransactionType | string;
  amount: string;
  transactionDate: string;
  exchangeRate: string;
  baseCurrencyAmount: string;
  details: string;
  createdById: string;
  createdAt: string;
}

/** موجودی حساب بعد از ثبت تراکنش */
export interface AccountTransactionAccount {
  id: string;
  marketId: string;
  currencyId: string;
  name: string;
  type: BankAccountType;
  accountNumber: string | null;
  bankName: string | null;
  balance: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAccountTransactionPayload {
  type: AccountTransactionType;
  amount: number;
  /** فقط وقتی ارز حساب با ارز پایه فرق دارد لازم است */
  exchangeRate?: number;
  details?: string;
}

export interface CreateAccountTransactionResult {
  transaction: AccountTransaction;
  account: AccountTransactionAccount;
}

interface RawTransaction {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  accountId?: string;
  account_id?: string;
  type?: string;
  amount?: unknown;
  transactionDate?: string;
  transaction_date?: string;
  exchangeRate?: unknown;
  exchange_rate?: unknown;
  baseCurrencyAmount?: unknown;
  base_currency_amount?: unknown;
  details?: string;
  notes?: string;
  createdById?: string;
  created_by_id?: string;
  createdAt?: string;
  created_at?: string;
}

interface RawTransactionAccount {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  currencyId?: string;
  currency_id?: string;
  name?: string;
  type?: string;
  accountNumber?: string | null;
  account_number?: string | null;
  bankName?: string | null;
  bank_name?: string | null;
  balance?: unknown;
  isActive?: boolean;
  is_active?: boolean;
  isSystem?: boolean;
  is_system?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  deletedAt?: string | null;
  deleted_at?: string | null;
}

function normalizeTransaction(raw: RawTransaction): AccountTransaction {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    accountId: raw.accountId ?? raw.account_id ?? "",
    type: raw.type ?? "",
    amount: toStr(raw.amount),
    transactionDate: raw.transactionDate ?? raw.transaction_date ?? "",
    exchangeRate: toStr(raw.exchangeRate ?? raw.exchange_rate),
    baseCurrencyAmount: toStr(raw.baseCurrencyAmount ?? raw.base_currency_amount),
    details: raw.details ?? raw.notes ?? "",
    createdById: raw.createdById ?? raw.created_by_id ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? "",
  };
}

function normalizeTransactionAccount(raw: RawTransactionAccount): AccountTransactionAccount {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    currencyId: raw.currencyId ?? raw.currency_id ?? "",
    name: raw.name ?? "",
    type: ((raw.type ?? "CASH") as BankAccountType).toUpperCase() as BankAccountType,
    accountNumber: raw.accountNumber ?? raw.account_number ?? null,
    bankName: raw.bankName ?? raw.bank_name ?? null,
    balance: toStr(raw.balance),
    isActive: raw.isActive ?? raw.is_active ?? true,
    isSystem: raw.isSystem ?? raw.is_system ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
    deletedAt: raw.deletedAt ?? raw.deleted_at ?? null,
  };
}

/**
 * ثبت تراکنش روی حساب (واریز یا برداشت)
 * POST /accounts/:id/transactions
 * body: { type: DEPOSIT|WITHDRAWAL, amount, exchangeRate?, details? }
 *
 * وقتی ارز حساب با ارز پایه مارکت یکی نباشد، exchangeRate الزامی است.
 */
export async function createAccountTransaction(
  id: string,
  payload: CreateAccountTransactionPayload,
): Promise<CreateAccountTransactionResult> {
  const { data } = await apiClient.post<{
    data?: { transaction?: RawTransaction; account?: RawTransactionAccount };
    transaction?: RawTransaction;
    account?: RawTransactionAccount;
  }>(`/accounts/${id}/transactions`, {
    type: payload.type,
    amount: payload.amount,
    ...(payload.exchangeRate !== undefined ? { exchangeRate: payload.exchangeRate } : {}),
    ...(payload.details ? { details: payload.details } : {}),
  });
  const body = data?.data ?? data ?? {};
  return {
    transaction: normalizeTransaction(body.transaction ?? {}),
    account: normalizeTransactionAccount(body.account ?? {}),
  };
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