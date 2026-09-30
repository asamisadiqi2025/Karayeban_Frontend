import { apiClient } from "@/services/client";

export interface CreateBillingCyclePayload {
  year: number;
  monthsPerPeriod: number;
}

export interface BillingCycle {
  id: string;
  marketId: string;
  year: number;
  monthsPerPeriod: number;
  createdAt: string;
  updatedAt: string;
}

interface RawBillingCycle {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  year?: string | number;
  jalaliYear?: string | number;
  jalali_year?: string | number;
  monthsPerPeriod?: string | number;
  months_per_period?: string | number;
  periodLength?: string | number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function toStringValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function normalizeBillingCycle(raw: RawBillingCycle): BillingCycle {
  const year = toNumber(raw.year ?? raw.jalaliYear ?? raw.jalali_year);
  const monthsPerPeriod = toNumber(
    raw.monthsPerPeriod ?? raw.months_per_period ?? raw.periodLength,
  );
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: toStringValue(raw.marketId ?? raw.market_id),
    year,
    monthsPerPeriod,
    createdAt: toStringValue(raw.createdAt ?? raw.created_at),
    updatedAt: toStringValue(raw.updatedAt ?? raw.updated_at),
  };
}

/**
 * کلید پایدار برای هر ردیف.
 *
 * بک‌اند گاهی یک رکورد را چند بار در پاسخ فهرست تکرار می‌کند؛ شناسه خالی
 * هم برای رکوردهای بدون شناسه ممکن است پیش بیاید. هر دو حالت در
 * fetchBillingCycles به‌صورت یکتا dedupe می‌شوند.
 */
export function billingCycleKey(cycle: BillingCycle): string {
  return cycle.id || `${cycle.marketId}:${cycle.year}:${cycle.monthsPerPeriod}`;
}

/**
 * فهرست دوره‌های قرائت میتر برق
 * GET /electricity/billing-cycles — پاسخ: { data: BillingCycle[], meta }
 *
 * رکوردهای تکراری (یکسان بودن شناسه) حذف می‌شوند تا کلید React یکتا بماند.
 */
export async function fetchBillingCycles(): Promise<BillingCycle[]> {
  const { data } = await apiClient.get("/electricity/billing-cycles");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  const seen = new Set<string>();
  const unique: BillingCycle[] = [];
  for (const item of items) {
    const cycle = normalizeBillingCycle(item);
    const key = billingCycleKey(cycle);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(cycle);
  }
  return unique;
}

/**
 * ثبت مدت زمان قرائت میتر جدید
 * POST /electricity/billing-cycles
 * body: { year, monthsPerPeriod }
 * پاسخ: { id, marketId, year, monthsPerPeriod, createdAt, updatedAt }
 */
export async function createBillingCycle(
  payload: CreateBillingCyclePayload,
): Promise<BillingCycle> {
  const { data } = await apiClient.post("/electricity/billing-cycles", {
    year: payload.year,
    monthsPerPeriod: payload.monthsPerPeriod,
  });
  return normalizeBillingCycle(data ?? {});
}
