import { apiClient } from "@/services/client";

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "online";
export type PaymentSource = "BANK" | "CASH" | "MANUAL";

export interface CreateRentPaymentPayload {
  contractId: string;
  amount: number;
  accountId: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

export interface RentPayment {
  id: string;
  marketId: string;
  contractId: string;
  tenantId: string;
  shopId: string;
  month: number;
  year: number;
  amount: number;
  currencyId: string;
  usdEquivalent: number | null;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  accountId: string;
  source: PaymentSource;
  isOpeningEntry: boolean;
  collectedById: string;
  notes: string | null;
  isPartial: boolean;
  receiptNumber: string | null;
  createdAt: string;
}

interface RawRentPayment {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  contractId?: string;
  contract_id?: string;
  tenantId?: string;
  tenant_id?: string;
  shopId?: string;
  shop_id?: string;
  month?: unknown;
  year?: unknown;
  amount?: unknown;
  currencyId?: string;
  currency_id?: string;
  usdEquivalent?: unknown;
  usd_equivalent?: unknown;
  paymentDate?: string;
  payment_date?: string;
  paymentMethod?: string;
  payment_method?: string;
  accountId?: string;
  account_id?: string;
  source?: string;
  isOpeningEntry?: boolean;
  is_opening_entry?: boolean;
  collectedById?: string;
  collected_by_id?: string;
  notes?: string | null;
  isPartial?: boolean;
  is_partial?: boolean;
  receiptNumber?: string | null;
  receipt_number?: string | null;
  createdAt?: string;
  created_at?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeRentPayment(raw: RawRentPayment): RentPayment {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    contractId: raw.contractId ?? raw.contract_id ?? "",
    tenantId: raw.tenantId ?? raw.tenant_id ?? "",
    shopId: raw.shopId ?? raw.shop_id ?? "",
    month: toNumber(raw.month),
    year: toNumber(raw.year),
    amount: toNumber(raw.amount),
    currencyId: raw.currencyId ?? raw.currency_id ?? "",
    usdEquivalent: raw.usdEquivalent != null ? toNumber(raw.usdEquivalent) : null,
    paymentDate: raw.paymentDate ?? raw.payment_date ?? "",
    paymentMethod: (raw.paymentMethod ?? raw.payment_method ?? "cash") as PaymentMethod,
    accountId: raw.accountId ?? raw.account_id ?? "",
    source: (raw.source ?? "BANK") as PaymentSource,
    isOpeningEntry: raw.isOpeningEntry ?? raw.is_opening_entry ?? false,
    collectedById: raw.collectedById ?? raw.collected_by_id ?? "",
    notes: raw.notes ?? null,
    isPartial: raw.isPartial ?? raw.is_partial ?? false,
    receiptNumber: raw.receiptNumber ?? raw.receipt_number ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? "",
  };
}

/**
 * فهرست پرداخت‌های اجاره
 * GET /rent/payments
 */
export async function fetchRentPayments(): Promise<RentPayment[]> {
  const { data } = await apiClient.get("/rent/payments");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeRentPayment);
}

/**
 * دریافت یک پرداخت اجاره
 * GET /rent/payments/:id
 */
export async function fetchRentPayment(id: string): Promise<RentPayment> {
  const { data } = await apiClient.get(`/rent/payments/${id}`);
  return normalizeRentPayment(data ?? {});
}

/**
 * ایجاد پرداخت اجاره جدید
 * POST /rent/payments
 */
export async function createRentPayment(
  payload: CreateRentPaymentPayload,
): Promise<RentPayment> {
  const body: Record<string, unknown> = {
    contractId: payload.contractId,
    amount: payload.amount,
    accountId: payload.accountId,
    paymentMethod: payload.paymentMethod,
  };
  if (payload.notes !== undefined) body.notes = payload.notes;
  const { data } = await apiClient.post("/rent/payments", body);
  return normalizeRentPayment(data ?? {});
}
