import { apiClient } from "@/services/client";

export const ELECTRICITY_BILL_STATUSES = [
  "PENDING",
  "PARTIAL",
  "PAID",
  "OVERDUE",
] as const;

export type ElectricityBillStatus = (typeof ELECTRICITY_BILL_STATUSES)[number];

export interface CreateElectricityBillPayload {
  contractId: string;
  year: number;
  periodNumber: number;
  totalAmount: number;
  meterId: string;
  currentReading: number;
  currencyId: string;
  notes?: string | null;
}

export interface ElectricityBill {
  id: string;
  marketId: string;
  shopId: string;
  meterId: string;
  tenantId: string;
  contractId: string;
  billingCycleId: string;
  year: number;
  periodNumber: number;
  periodStart: string;
  periodEnd: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currencyId: string;
  status: ElectricityBillStatus;
  isOpeningEntry: boolean;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ElectricityBillMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedElectricityBills {
  items: ElectricityBill[];
  meta: ElectricityBillMeta;
}

export interface FetchElectricityBillsParams {
  page?: number;
  limit?: number;
  year?: number;
  periodNumber?: number;
  meterId?: string;
  status?: ElectricityBillStatus | "";
}

interface RawElectricityBill {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  shopId?: string;
  shop_id?: string;
  meterId?: string;
  meter_id?: string;
  tenantId?: string;
  tenant_id?: string;
  contractId?: string;
  contract_id?: string;
  billingCycleId?: string;
  billing_cycle_id?: string;
  year?: unknown;
  periodNumber?: unknown;
  period_number?: unknown;
  periodStart?: string;
  period_start?: string;
  periodEnd?: string;
  period_end?: string;
  previousReading?: unknown;
  previous_reading?: unknown;
  currentReading?: unknown;
  current_reading?: unknown;
  totalAmount?: unknown;
  total_amount?: unknown;
  paidAmount?: unknown;
  paid_amount?: unknown;
  remainingAmount?: unknown;
  remaining_amount?: unknown;
  currencyId?: string;
  currency_id?: string;
  status?: string;
  isOpeningEntry?: boolean;
  is_opening_entry?: boolean;
  notes?: string | null;
  createdById?: string;
  created_by_id?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  // بک‌اند فعلاً این کلید را با فاصله برمی‌گرداند؛ تا اصلاح آن هر دو حالت پذیرفته می‌شود.
  "updated At"?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function toStringValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function toStatus(value: unknown): ElectricityBillStatus {
  const status = typeof value === "string" ? value.toUpperCase() : "";
  return ELECTRICITY_BILL_STATUSES.includes(status as ElectricityBillStatus)
    ? (status as ElectricityBillStatus)
    : "PENDING";
}

function unwrapList(data: unknown): RawElectricityBill[] {
  if (Array.isArray(data)) return data as RawElectricityBill[];
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (Array.isArray(rec.data)) return rec.data as RawElectricityBill[];
    if (Array.isArray(rec.results)) return rec.results as RawElectricityBill[];
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
): ElectricityBillMeta {
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

function normalizeElectricityBill(raw: RawElectricityBill): ElectricityBill {
  const previousReading = toNumber(raw.previousReading ?? raw.previous_reading);
  const currentReading = toNumber(raw.currentReading ?? raw.current_reading);

  return {
    id: raw.id ?? raw._id ?? "",
    marketId: toStringValue(raw.marketId ?? raw.market_id),
    shopId: toStringValue(raw.shopId ?? raw.shop_id),
    meterId: toStringValue(raw.meterId ?? raw.meter_id),
    tenantId: toStringValue(raw.tenantId ?? raw.tenant_id),
    contractId: toStringValue(raw.contractId ?? raw.contract_id),
    billingCycleId: toStringValue(raw.billingCycleId ?? raw.billing_cycle_id),
    year: toNumber(raw.year),
    periodNumber: toNumber(raw.periodNumber ?? raw.period_number),
    periodStart: toStringValue(raw.periodStart ?? raw.period_start),
    periodEnd: toStringValue(raw.periodEnd ?? raw.period_end),
    previousReading,
    currentReading,
    consumption: Math.max(0, currentReading - previousReading),
    totalAmount: toNumber(raw.totalAmount ?? raw.total_amount),
    paidAmount: toNumber(raw.paidAmount ?? raw.paid_amount),
    remainingAmount: toNumber(raw.remainingAmount ?? raw.remaining_amount),
    currencyId: toStringValue(raw.currencyId ?? raw.currency_id),
    status: toStatus(raw.status),
    isOpeningEntry: raw.isOpeningEntry ?? raw.is_opening_entry ?? false,
    notes: raw.notes ?? null,
    createdById: toStringValue(raw.createdById ?? raw.created_by_id),
    createdAt: toStringValue(raw.createdAt ?? raw.created_at),
    updatedAt: toStringValue(raw.updatedAt ?? raw.updated_at ?? raw["updated At"]),
  };
}

/**
 * فهرست قبض‌های برق
 * GET /electricity/bills — پاسخ: { data: ElectricityBill[], meta }
 */
export async function fetchElectricityBills(
  params: FetchElectricityBillsParams = {},
): Promise<PaginatedElectricityBills> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const limit = Math.max(1, Math.trunc(params.limit ?? 20));
  const { data } = await apiClient.get("/electricity/bills", {
    params: {
      page,
      limit,
      ...(params.year ? { year: params.year } : {}),
      ...(params.periodNumber ? { periodNumber: params.periodNumber } : {}),
      ...(params.meterId ? { meterId: params.meterId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return {
    items: unwrapList(data).map(normalizeElectricityBill),
    meta: normalizeMeta(data, page, limit),
  };
}

/**
 * ثبت قبض برق جدید
 * POST /electricity/bills
 * body: { contractId, year, periodNumber, totalAmount, meterId, currentReading, currencyId, notes }
 * پاسخ: { id, marketId, shopId, meterId, tenantId, contractId, billingCycleId, year,
 *          periodNumber, periodStart, periodEnd, previousReading, currentReading,
 *          totalAmount, paidAmount, remainingAmount, currencyId, status,
 *          isOpeningEntry, notes, createdById, createdAt, updatedAt }
 */
export async function createElectricityBill(
  payload: CreateElectricityBillPayload,
): Promise<ElectricityBill> {
  const body: Record<string, unknown> = {
    contractId: payload.contractId,
    year: payload.year,
    periodNumber: payload.periodNumber,
    totalAmount: payload.totalAmount,
    meterId: payload.meterId,
    currentReading: payload.currentReading,
    currencyId: payload.currencyId,
  };
  if (payload.notes !== undefined && payload.notes !== null) body.notes = payload.notes;
  const { data } = await apiClient.post("/electricity/bills", body);
  return normalizeElectricityBill(unwrapItem(data));
}
