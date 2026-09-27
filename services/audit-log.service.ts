import { apiClient } from "@/services/client";

/**
 * Known audit actions. The `(string & {})` member keeps autocomplete for the
 * values we know about while still accepting any new action the backend adds.
 */
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "RESTORE"
  | (string & {});

export interface AuditLogUser {
  id: string;
  fullName: string;
  username: string;
}

export interface AuditLog {
  id: string;
  marketId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  meta: AuditLogMeta;
}

export interface FetchAuditLogsParams {
  page?: number;
  limit?: number;
}

interface RawAuditLogUser {
  id?: string;
  _id?: string;
  fullName?: string;
  full_name?: string;
  username?: string;
  user_name?: string;
}

interface RawAuditLog {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  userId?: string;
  user_id?: string;
  action?: string;
  entityType?: string;
  entity_type?: string;
  entityId?: string;
  entity_id?: string;
  oldData?: unknown;
  old_data?: unknown;
  newData?: unknown;
  new_data?: unknown;
  ipAddress?: string;
  ip_address?: string;
  userAgent?: string;
  user_agent?: string;
  createdAt?: string;
  created_at?: string;
  user?: RawAuditLogUser | null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function unwrapList(data: unknown): RawAuditLog[] {
  if (Array.isArray(data)) return data as RawAuditLog[];
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (Array.isArray(rec.data)) return rec.data as RawAuditLog[];
    if (Array.isArray(rec.results)) return rec.results as RawAuditLog[];
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
): AuditLogMeta {
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

function normalizeAuditLog(raw: RawAuditLog): AuditLog {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    userId: raw.userId ?? raw.user_id ?? "",
    action: (raw.action ?? "").toUpperCase(),
    entityType: raw.entityType ?? raw.entity_type ?? "",
    entityId: raw.entityId ?? raw.entity_id ?? "",
    oldData: asObject(raw.oldData ?? raw.old_data),
    newData: asObject(raw.newData ?? raw.new_data),
    ipAddress: raw.ipAddress ?? raw.ip_address ?? "",
    userAgent: raw.userAgent ?? raw.user_agent ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    user: raw.user
      ? {
          id: raw.user.id ?? raw.user._id ?? raw.userId ?? raw.user_id ?? "",
          fullName: raw.user.fullName ?? raw.user.full_name ?? "",
          username: raw.user.username ?? raw.user.user_name ?? "",
        }
      : null,
  };
}

/**
 * فهرست سوابق فعالیت کاربران
 * GET /audit-logs — پاسخ: { data: AuditLog[], meta }
 *
 * NOTE: the endpoint currently accepts only `page` and `limit`. Filtering in the
 * UI is therefore done client-side over the fetched page — no filter params are
 * invented here, because an unsupported query param is silently ignored by
 * NestJS and would make the filter look broken.
 */
export async function fetchAuditLogs(
  params: FetchAuditLogsParams = {},
): Promise<PaginatedAuditLogs> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const limit = Math.max(1, Math.trunc(params.limit ?? 20));
  const { data } = await apiClient.get("/audit-logs", { params: { page, limit } });
  return {
    items: unwrapList(data).map(normalizeAuditLog),
    meta: normalizeMeta(data, page, limit),
  };
}

/**
 * دریافت یک سند فعالیت
 * GET /audit-logs/:id
 */
export async function fetchAuditLog(id: string): Promise<AuditLog> {
  const { data } = await apiClient.get(`/audit-logs/${id}`);
  return normalizeAuditLog(unwrapItem(data) as RawAuditLog);
}
