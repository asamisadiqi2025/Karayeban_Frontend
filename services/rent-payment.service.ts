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

export interface RentPaymentAllocation {
  id: string;
  paymentId: string;
  rentChargeId: string;
  amount: number;
  createdAt: string;
}

export interface RentPaymentTenant {
  id: string;
  fullName: string;
}

export interface RentPaymentShop {
  id: string;
  shopNumber: string;
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
  tenant: RentPaymentTenant | null;
  shop: RentPaymentShop | null;
  allocations: RentPaymentAllocation[];
}

export interface RentPaymentMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedRentPayments {
  items: RentPayment[];
  meta: RentPaymentMeta;
}

export interface FetchRentPaymentsParams {
  page?: number;
  limit?: number;
}

interface RawRentPaymentAllocation {
  id?: string;
  _id?: string;
  paymentId?: string;
  payment_id?: string;
  rentChargeId?: string;
  rent_charge_id?: string;
  amount?: unknown;
  createdAt?: string;
  created_at?: string;
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
  tenant?: { id?: string; fullName?: string } | null;
  tenant_name?: string | null;
  shop?: { id?: string; shopNumber?: string } | null;
  shop_number?: string | null;
  allocations?: RawRentPaymentAllocation[];
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function unwrapList(data: unknown): RawRentPayment[] {
  if (Array.isArray(data)) return data as RawRentPayment[];
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (Array.isArray(rec.data)) return rec.data as RawRentPayment[];
    if (Array.isArray(rec.results)) return rec.results as RawRentPayment[];
  }
  return [];
}

function unwrapItem(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const rec = data as Record<string, unknown>;
    if (rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>;
    }
    return rec;
  }
  return {};
}

function normalizeMeta(
  data: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): RentPaymentMeta {
  const rec =
    data && typeof data === "object"
      ? ((data as Record<string, unknown>).meta as Record<string, unknown> | undefined)
      : undefined;

  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

  const limit = Math.max(1, num(rec?.limit, fallbackLimit));
  const total = Math.max(0, num(rec?.total, 0));
  const totalPages = Math.max(1, num(rec?.totalPages, Math.ceil(total / limit) || 1));
  const page = Math.min(Math.max(1, num(rec?.page, fallbackPage)), totalPages);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: typeof rec?.hasNextPage === "boolean" ? rec.hasNextPage : page < totalPages,
    hasPrevPage: typeof rec?.hasPrevPage === "boolean" ? rec.hasPrevPage : page > 1,
  };
}

function normalizeAllocation(raw: RawRentPaymentAllocation): RentPaymentAllocation {
  return {
    id: raw.id ?? raw._id ?? "",
    paymentId: raw.paymentId ?? raw.payment_id ?? "",
    rentChargeId: raw.rentChargeId ?? raw.rent_charge_id ?? "",
    amount: toNumber(raw.amount),
    createdAt: raw.createdAt ?? raw.created_at ?? "",
  };
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
    tenant: raw.tenant
      ? {
          id: raw.tenant.id ?? raw.tenantId ?? raw.tenant_id ?? "",
          fullName: raw.tenant.fullName ?? raw.tenant_name ?? "",
        }
      : null,
    shop: raw.shop
      ? {
          id: raw.shop.id ?? raw.shopId ?? raw.shop_id ?? "",
          shopNumber: raw.shop.shopNumber ?? raw.shop_number ?? "",
        }
      : null,
    allocations: Array.isArray(raw.allocations)
      ? raw.allocations.map(normalizeAllocation)
      : [],
  };
}

/**
 * فهرست پرداخت‌های اجاره
 * GET /rent/payments — پاسخ: { data: RentPayment[], meta }
 */
export async function fetchRentPayments(
  params: FetchRentPaymentsParams = {},
): Promise<PaginatedRentPayments> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const limit = Math.max(1, Math.trunc(params.limit ?? 20));
  const { data } = await apiClient.get("/rent/payments", { params: { page, limit } });
  return {
    items: unwrapList(data).map(normalizeRentPayment),
    meta: normalizeMeta(data, page, limit),
  };
}

/**
 * دریافت یک پرداخت اجاره
 * GET /rent/payments/:id
 */
export async function fetchRentPayment(id: string): Promise<RentPayment> {
  const { data } = await apiClient.get(`/rent/payments/${id}`);
  return normalizeRentPayment(unwrapItem(data));
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
  return normalizeRentPayment(unwrapItem(data));
}
