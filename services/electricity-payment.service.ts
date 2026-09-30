import { apiClient } from "@/services/client";

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "online";
export type PaymentSource = "BANK" | "CASH" | "MANUAL";

export interface CreateElectricityPaymentPayload {
  shopId: string;
  tenantId: string;
  amount: number;
  accountId: string;
  paymentMethod: PaymentMethod;
  receiptNumber?: string | null;
  notes?: string | null;
}

export interface ElectricityPaymentShop {
  id: string;
  shopNumber: string;
}

export interface ElectricityPayment {
  id: string;
  marketId: string;
  shopId: string;
  tenantId: string;
  amount: number;
  currencyId: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  accountId: string;
  source: PaymentSource;
  isOpeningEntry: boolean;
  collectedById: string;
  receiptNumber: string | null;
  notes: string | null;
  createdAt: string;
  /** تا زمانی که تخصیص ندارد null است؛ مبلغ هنوز به هیچ قبضی وصل نشده. */
  allocations: ElectricityPaymentAllocation[];
  shop: ElectricityPaymentShop | null;
}

export interface ElectricityPaymentAllocation {
  id: string;
  paymentId: string;
  electricityBillId: string;
  amount: number;
  createdAt: string;
}

export interface ElectricityPaymentMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedElectricityPayments {
  items: ElectricityPayment[];
  meta: ElectricityPaymentMeta;
}

export interface FetchElectricityPaymentsParams {
  page?: number;
  limit?: number;
  shopId?: string;
  tenantId?: string;
  paymentMethod?: PaymentMethod | "";
  from?: string;
  to?: string;
}

interface RawElectricityPaymentAllocation {
  id?: string;
  _id?: string;
  paymentId?: string;
  payment_id?: string;
  electricityBillId?: string;
  electricity_bill_id?: string;
  billId?: string;
  bill_id?: string;
  amount?: unknown;
  createdAt?: string;
  created_at?: string;
}

interface RawElectricityPayment {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  shopId?: string;
  shop_id?: string;
  tenantId?: string;
  tenant_id?: string;
  amount?: unknown;
  currencyId?: string;
  currency_id?: string;
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
  receiptNumber?: string | null;
  receipt_number?: string | null;
  notes?: string | null;
  createdAt?: string;
  created_at?: string;
  shop?: { id?: string; shopNumber?: string } | null;
  shop_number?: string | null;
  allocations?: RawElectricityPaymentAllocation[];
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function toStringValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function unwrapList(data: unknown): RawElectricityPayment[] {
  if (Array.isArray(data)) return data as RawElectricityPayment[];
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (Array.isArray(rec.data)) return rec.data as RawElectricityPayment[];
    if (Array.isArray(rec.results)) return rec.results as RawElectricityPayment[];
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
): ElectricityPaymentMeta {
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

function normalizeAllocation(
  raw: RawElectricityPaymentAllocation,
): ElectricityPaymentAllocation {
  return {
    id: raw.id ?? raw._id ?? "",
    paymentId: toStringValue(raw.paymentId ?? raw.payment_id),
    electricityBillId: toStringValue(
      raw.electricityBillId ?? raw.electricity_bill_id ?? raw.billId ?? raw.bill_id,
    ),
    amount: toNumber(raw.amount),
    createdAt: toStringValue(raw.createdAt ?? raw.created_at),
  };
}

function normalizeElectricityPayment(
  raw: RawElectricityPayment,
): ElectricityPayment {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: toStringValue(raw.marketId ?? raw.market_id),
    shopId: toStringValue(raw.shopId ?? raw.shop_id),
    tenantId: toStringValue(raw.tenantId ?? raw.tenant_id),
    amount: toNumber(raw.amount),
    currencyId: toStringValue(raw.currencyId ?? raw.currency_id),
    paymentDate: toStringValue(raw.paymentDate ?? raw.payment_date),
    paymentMethod: (raw.paymentMethod ?? raw.payment_method ?? "cash") as PaymentMethod,
    accountId: toStringValue(raw.accountId ?? raw.account_id),
    source: (raw.source ?? "BANK") as PaymentSource,
    isOpeningEntry: raw.isOpeningEntry ?? raw.is_opening_entry ?? false,
    collectedById: toStringValue(raw.collectedById ?? raw.collected_by_id),
    receiptNumber: raw.receiptNumber ?? raw.receipt_number ?? null,
    notes: raw.notes ?? null,
    createdAt: toStringValue(raw.createdAt ?? raw.created_at),
    allocations: Array.isArray(raw.allocations)
      ? raw.allocations.map(normalizeAllocation)
      : [],
    shop: raw.shop
      ? {
          id: raw.shop.id ?? toStringValue(raw.shopId ?? raw.shop_id),
          shopNumber: toStringValue(raw.shop.shopNumber ?? raw.shop_number),
        }
      : null,
  };
}

/**
 * مبلغی که هنوز به هیچ قبضی تخصیص نیافته است.
 *
 * پرداخت برق در دو گام ثبت می‌شود: ابتدا رکورد پرداخت ساخته می‌شود و سپس
 * در گام جداگانه به قبض متصل می‌گردد. تا پیش از آن گام، مبلغ پرداخت‌شده
 * در هیچ قبضی منعکس نمی‌شود.
 */
export function unallocatedAmount(payment: ElectricityPayment): number {
  const allocated = payment.allocations.reduce((sum, a) => sum + a.amount, 0);
  return Math.max(0, payment.amount - allocated);
}

/**
 * فهرست پرداخت‌های برق
 * GET /electricity/payments — پاسخ: { data: ElectricityPayment[], meta }
 */
export async function fetchElectricityPayments(
  params: FetchElectricityPaymentsParams = {},
): Promise<PaginatedElectricityPayments> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const limit = Math.max(1, Math.trunc(params.limit ?? 20));
  const { data } = await apiClient.get("/electricity/payments", {
    params: {
      page,
      limit,
      ...(params.shopId ? { shopId: params.shopId } : {}),
      ...(params.tenantId ? { tenantId: params.tenantId } : {}),
      ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {}),
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    },
  });
  return {
    items: unwrapList(data).map(normalizeElectricityPayment),
    meta: normalizeMeta(data, page, limit),
  };
}

/**
 * ثبت پرداخت برق جدید
 * POST /electricity/payments
 * body: { shopId, tenantId, amount, accountId, paymentMethod, receiptNumber, notes }
 * پاسخ: { id, marketId, shopId, tenantId, amount, currencyId, paymentDate,
 *          paymentMethod, accountId, source, isOpeningEntry, collectedById,
 *          receiptNumber, notes, createdAt }
 *
 * واحد پولی از حساب مقصد گرفته می‌شود و در body ارسال نمی‌گردد.
 */
export async function createElectricityPayment(
  payload: CreateElectricityPaymentPayload,
): Promise<ElectricityPayment> {
  const body: Record<string, unknown> = {
    shopId: payload.shopId,
    tenantId: payload.tenantId,
    amount: payload.amount,
    accountId: payload.accountId,
    paymentMethod: payload.paymentMethod,
  };
  if (payload.receiptNumber?.trim()) body.receiptNumber = payload.receiptNumber.trim();
  if (payload.notes?.trim()) body.notes = payload.notes.trim();
  const { data } = await apiClient.post("/electricity/payments", body);
  return normalizeElectricityPayment(unwrapItem(data));
}
