import { apiClient } from "@/services/client";

export interface CreateAssetPayload {
  name: string;
  category: string;
  purchasePrice: number;
  currencyId: string;
  lifespanYears: number;
  purchaseDate: string;
  details?: string;
  marketId?: string;
}

export interface UpdateAssetPayload {
  name?: string;
  category?: string;
  purchasePrice?: number;
  currencyId?: string;
  lifespanYears?: number;
  purchaseDate?: string;
  details?: string;
  marketId?: string;
  status?: AssetStatus;
  warehouseId?: string | null;
}

export type AssetStatus = "active" | "disposed";

export interface AssetCurrency {
  id: string;
  code: string;
  name: string;
}

export interface DepreciationEvent {
  id: string;
  year?: number;
  amount?: number;
  bookValue?: number;
  date?: string;
  [key: string]: unknown;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  currencyId: string;
  lifespanYears: number;
  annualDepreciation: number;
  currentBookValue: number;
  purchaseDate: string;
  status: AssetStatus;
  details: string;
  marketId: string;
  warehouseId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  currency?: AssetCurrency;
  depreciationEvents: DepreciationEvent[];
}

export interface AssetListParams {
  category?: string;
  status?: AssetStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedAssets {
  items: Asset[];
  meta: PaginatedMeta;
}

export interface AssetCurrencySummary {
  currencyId: string;
  currencyCode: string;
  currencyName: string;
  count: number;
  totalPurchasePrice: number;
  totalCurrentBookValue: number;
}

export interface AssetSummary {
  marketId: string;
  totalAssets: number;
  activeAssets: number;
  disposedAssets: number;
  byCurrency: AssetCurrencySummary[];
}

interface RawAsset {
  id?: string;
  _id?: string;
  name?: string;
  category?: string;
  purchasePrice?: number | string;
  purchase_price?: number | string;
  currencyId?: string;
  currency_id?: string;
  lifespanYears?: number | string;
  lifespan_years?: number | string;
  annualDepreciation?: number | string;
  annual_depreciation?: number | string;
  currentBookValue?: number | string;
  current_book_value?: number | string;
  purchaseDate?: string;
  purchase_date?: string;
  status?: string;
  details?: string;
  description?: string;
  marketId?: string;
  market_id?: string;
  warehouseId?: string | null;
  warehouse_id?: string | null;
  isDeleted?: boolean;
  is_deleted?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  currency?: AssetCurrency;
  depreciationEvents?: DepreciationEvent[];
  depreciation_events?: DepreciationEvent[];
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function toStatus(value: unknown): AssetStatus {
  return value === "disposed" ? "disposed" : "active";
}

function normalizeAsset(raw: RawAsset): Asset {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? "",
    category: raw.category ?? "",
    purchasePrice: toNumber(raw.purchasePrice ?? raw.purchase_price),
    currencyId: raw.currencyId ?? raw.currency_id ?? "",
    lifespanYears: toNumber(raw.lifespanYears ?? raw.lifespan_years),
    annualDepreciation: toNumber(raw.annualDepreciation ?? raw.annual_depreciation),
    currentBookValue: toNumber(raw.currentBookValue ?? raw.current_book_value),
    purchaseDate: raw.purchaseDate ?? raw.purchase_date ?? "",
    status: toStatus(raw.status),
    details: raw.details ?? raw.description ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    warehouseId: raw.warehouseId ?? raw.warehouse_id ?? null,
    isDeleted: raw.isDeleted ?? raw.is_deleted ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
    currency: raw.currency,
    depreciationEvents: raw.depreciationEvents ?? raw.depreciation_events ?? [],
  };
}

interface RawListResponse {
  data?: RawAsset[];
  results?: RawAsset[];
  meta?: Partial<PaginatedMeta>;
}

function normalizeMeta(
  meta: Partial<PaginatedMeta> | undefined,
  count: number,
  page: number,
  limit: number,
): PaginatedMeta {
  return {
    total: meta?.total ?? count,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
    totalPages: meta?.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(count / limit)) : 1),
    hasNextPage: meta?.hasNextPage ?? false,
    hasPrevPage: meta?.hasPrevPage ?? false,
  };
}

/**
 * فهرست دارایی‌ها
 * GET /assets
 */
export async function fetchAssets(
  params: AssetListParams = {},
): Promise<Asset[]> {
  const { items } = await fetchAssetsPaginated(params);
  return items;
}

/**
 * فهرست صفحه‌بندی‌شده دارایی‌ها
 * GET /assets?category=&page=&limit=
 */
export async function fetchAssetsPaginated(
  params: AssetListParams = {},
): Promise<PaginatedAssets> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const query: Record<string, string> = { page: String(page), limit: String(limit) };
  if (params.category) query.category = params.category;
  if (params.status) query.status = params.status;

  const { data } = await apiClient.get("/assets", { params: query });
  const payload: RawListResponse = Array.isArray(data) ? { data } : (data ?? {});
  const rawItems = Array.isArray(data) ? (data as RawAsset[]) : (payload.data ?? payload.results ?? []);

  return {
    items: (rawItems ?? []).map(normalizeAsset),
    meta: normalizeMeta(payload.meta, rawItems?.length ?? 0, page, limit),
  };
}

/**
 * خلاصه دارایی‌ها
 * GET /assets/summary
 */
export async function fetchAssetSummary(): Promise<AssetSummary> {
  const { data } = await apiClient.get("/assets/summary");
  const raw = (data ?? {}) as Partial<AssetSummary> & {
    byCurrency?: Array<Partial<AssetCurrencySummary> & {
      totalPurchasePrice?: number | string;
      totalCurrentBookValue?: number | string;
    }>;
  };

  return {
    marketId: raw.marketId ?? "",
    totalAssets: toNumber(raw.totalAssets),
    activeAssets: toNumber(raw.activeAssets),
    disposedAssets: toNumber(raw.disposedAssets),
    byCurrency: (raw.byCurrency ?? []).map((row) => ({
      currencyId: row.currencyId ?? "",
      currencyCode: row.currencyCode ?? "",
      currencyName: row.currencyName ?? "",
      count: toNumber(row.count),
      totalPurchasePrice: toNumber(row.totalPurchasePrice),
      totalCurrentBookValue: toNumber(row.totalCurrentBookValue),
    })),
  };
}

/**
 * دریافت یک دارایی
 * GET /assets/:id
 */
export async function fetchAsset(id: string): Promise<Asset> {
  const { data } = await apiClient.get(`/assets/${id}`);
  return normalizeAsset(data ?? {});
}

/**
 * ایجاد دارایی جدید
 * POST /assets
 */
export async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
  const { data } = await apiClient.post("/assets", payload);
  return normalizeAsset(data ?? {});
}

/**
 * بروزرسانی دارایی
 * PATCH /assets/:id
 */
export async function updateAsset(
  id: string,
  payload: UpdateAssetPayload,
): Promise<Asset> {
  const { data } = await apiClient.patch(`/assets/${id}`, payload);
  return normalizeAsset(data ?? {});
}

/**
 * حذف دارایی
 * DELETE /assets/:id
 */
export async function deleteAsset(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(`/assets/${id}`);
  return data ?? {};
}
