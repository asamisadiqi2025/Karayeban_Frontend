import { apiClient } from "@/services/client";

export interface TransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface TransferResult {
  id?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number;
  currencyCode?: string;
  [key: string]: unknown;
}

interface RawTransfer {
  id?: string;
  _id?: string;
  fromAccountId?: string;
  from_account_id?: string;
  fromAccount?: { id?: string; name?: string };
  toAccountId?: string;
  to_account_id?: string;
  toAccount?: { id?: string; name?: string };
  amount?: unknown;
  description?: string;
  note?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeTransfer(raw: RawTransfer): TransferResult {
  return {
    id: raw.id ?? raw._id ?? "",
    fromAccountId:
      raw.fromAccountId ?? raw.from_account_id ?? raw.fromAccount?.id ?? "",
    toAccountId: raw.toAccountId ?? raw.to_account_id ?? raw.toAccount?.id ?? "",
    amount: toNumber(raw.amount),
    description: raw.description ?? raw.note ?? "",
  };
}

/**
 * انتقال وجه بین دو حساب هم‌ارز
 * POST /accounts/transfer
 * body: { fromAccountId, toAccountId, amount }
 */
export async function transferBetweenAccounts(payload: TransferPayload): Promise<TransferResult> {
  const { data } = await apiClient.post<TransferResult>("/accounts/transfer", payload);
  return data;
}

/**
 * لیست همه‌ی انتقال‌ها
 * GET /accounts/transfer
 */
export async function fetchTransfers(): Promise<TransferResult[]> {
  const { data } = await apiClient.get("/accounts/transfer");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeTransfer);
}