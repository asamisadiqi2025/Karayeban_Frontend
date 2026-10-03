import { apiClient } from "@/services/client";

/**
 * نقش‌های شناخته‌شده؛ هر رشته‌ی دیگری هم پذیرفته می‌شود تا نقش‌های سفارشی
 * (customRole) که از بک‌اند می‌آیند نشکنند.
 */
export const USER_ROLE_OPTIONS = [
  "ACCOUNTANT",
  "STAFF",
] as const;

export type KnownUserRole = (typeof USER_ROLE_OPTIONS)[number];
export type UserRole = KnownUserRole | (string & {});

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  fatherName?: string | null;
  grandfatherName?: string | null;
  tazkiraNumber?: string | null;
  address?: string | null;
  isActive?: boolean;
  marketId?: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  phone?: string | null;
  fatherName?: string | null;
  grandfatherName?: string | null;
  tazkiraNumber?: string | null;
  address?: string | null;
  isActive?: boolean;
  customRoleId?: string | null;
}

export interface UserCustomRole {
  id: string;
  name: string;
  description?: string | null;
}

/** خلاصه‌ی مارکتی که کاربر به آن تعلق دارد؛ همان شکلی که POST /users برمی‌گرداند. */
export interface UserMarket {
  id: string;
  name: string;
  nameEn: string | null;
  subdomain: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  details: string | null;
  baseCurrencyId: string | null;
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  customRoleId: string | null;
  marketId: string | null;
  // fatherName: string | null;
  // grandfatherName: string | null;
  phone: string | null;
  // tazkiraNumber: string | null;
  address?: string | null;
  profilePhoto?: string | null;
  grantedPermissions: string[] | null;
  extraPermissions: string[] | null;
  deniedPermissions: string[] | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  isDeleted: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  market: UserMarket | null;
  customRole: UserCustomRole | null;
}

export interface UserListParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  items: User[];
  meta: PaginatedMeta;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserPermissionItem {
  key: string;
  label: string;
  granted: boolean;
}

export interface UserPermissionSection {
  key: string;
  label: string;
  items: UserPermissionItem[];
}

export interface UserPermissions {
  userId: string;
  fullName: string;
  role: UserRole;
  /** آیا این کاربر اجازه‌ی تغییر دسترسی‌ها را دارد یا فقط نمایش. */
  editable: boolean;
  /**
   * منبع دسترسی‌ها: "role-default" یعنی از نقش گرفته شده،
   * "custom" یعنی دستی روی همین کاربر تنظیم شده است.
   */
  mode: string;
  sections: UserPermissionSection[];
}

interface RawUser {
  id?: string;
  _id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  username?: string;
  userName?: string;
  user_name?: string;
  email?: string;
  role?: string;
  roleName?: string;
  role_name?: string;
  customRoleId?: string | null;
  custom_role_id?: string | null;
  marketId?: string | null;
  market_id?: string | null;
  // fatherName?: string | null;
  // father_name?: string | null;
  // grandfatherName?: string | null;
  // grandfather_name?: string | null;
  phone?: string | null;
  mobile?: string | null;
  // tazkiraNumber?: string | null;
  // tazkira_number?: string | null;
  // address?: string | null;
  // profilePhoto?: string | null;
  // profile_photo?: string | null;
  grantedPermissions?: string[] | null;
  granted_permissions?: string[] | null;
  extraPermissions?: string[] | null;
  extra_permissions?: string[] | null;
  deniedPermissions?: string[] | null;
  denied_permissions?: string[] | null;
  isSuperAdmin?: boolean;
  is_super_admin?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  isDeleted?: boolean;
  is_deleted?: boolean;
  lastLogin?: string | null;
  last_login?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  market?: UserMarket | null;
  customRole?: UserCustomRole | null;
  custom_role?: UserCustomRole | null;
}

interface RawListResponse {
  data?: RawUser[];
  results?: RawUser[];
  meta?: Partial<PaginatedMeta>;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function toStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => String(item));
}

function normalizeUser(raw: RawUser): User {
  return {
    id: raw.id ?? raw._id ?? "",
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? "",
    username: raw.username ?? raw.userName ?? raw.user_name ?? "",
    email: raw.email ?? "",
    role: raw.role ?? raw.roleName ?? raw.role_name ?? "USER",
    customRoleId: raw.customRoleId ?? raw.custom_role_id ?? null,
    marketId: raw.marketId ?? raw.market_id ?? null,
    // fatherName: raw.fatherName ?? raw.father_name ?? null,
    // grandfatherName: raw.grandfatherName ?? raw.grandfather_name ?? null,
    phone: raw.phone ?? raw.mobile ?? null,
    // tazkiraNumber: raw.tazkiraNumber ?? raw.tazkira_number ?? null,
    // address: raw.address ?? null,
    // profilePhoto: raw.profilePhoto ?? raw.profile_photo ?? null,
    grantedPermissions:
      toStringList(raw.grantedPermissions ?? raw.granted_permissions),
    extraPermissions: toStringList(raw.extraPermissions ?? raw.extra_permissions),
    deniedPermissions: toStringList(
      raw.deniedPermissions ?? raw.denied_permissions,
    ),
    isSuperAdmin: toBoolean(raw.isSuperAdmin ?? raw.is_super_admin),
    isActive: toBoolean(raw.isActive ?? raw.is_active, true),
    isDeleted: toBoolean(raw.isDeleted ?? raw.is_deleted),
    lastLogin: raw.lastLogin ?? raw.last_login ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
    market: raw.market ?? null,
    customRole: raw.customRole ?? raw.custom_role ?? null,
  };
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
    totalPages:
      meta?.totalPages ??
      (limit > 0 ? Math.max(1, Math.ceil(count / limit)) : 1),
    hasNextPage: meta?.hasNextPage ?? false,
    hasPrevPage: meta?.hasPrevPage ?? false,
  };
}

/**
 * فهرست کاربران
 * GET /users
 */
export async function fetchUsers(params: UserListParams = {}): Promise<User[]> {
  const { items } = await fetchUsersPaginated(params);
  return items;
}

/**
 * فهرست صفحه‌بندی‌شده کاربران
 * GET /users?search=&role=&isActive=&page=&limit=
 */
export async function fetchUsersPaginated(
  params: UserListParams = {},
): Promise<PaginatedUsers> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const query: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };
  if (params.search) query.search = params.search;
  if (params.role) query.role = params.role;
  if (params.isActive !== undefined) {
    query.isActive = String(params.isActive);
  }

  const { data } = await apiClient.get("/users", { params: query });
  const payload: RawListResponse = Array.isArray(data)
    ? { data }
    : (data ?? {});
  const rawItems = Array.isArray(data)
    ? (data as RawUser[])
    : (payload.data ?? payload.results ?? []);

  return {
    items: (rawItems ?? []).map(normalizeUser),
    meta: normalizeMeta(payload.meta, rawItems?.length ?? 0, page, limit),
  };
}

/**
 * دریافت یک کاربر
 * GET /users/:id
 */
export async function fetchUser(id: string): Promise<User> {
  const { data } = await apiClient.get(`/users/${id}`);
  return normalizeUser(data ?? {});
}

/**
 * ایجاد کاربر جدید
 * POST /users
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post("/users", payload);
  return normalizeUser(data ?? {});
}

/**
 * بروزرسانی کاربر
 * PATCH /users/:id
 */
export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<User> {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return normalizeUser(data ?? {});
}

/**
 * حذف کاربر
 * DELETE /users/:id
 */
export async function deleteUser(id: string): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(`/users/${id}`);
  return data ?? {};
}

/**
 * دسترسی‌های کاربر، گروه‌بندی‌شده بر اساس بخش‌ها
 * GET /users/:id/permissions
 */
export async function fetchUserPermissions(
  id: string,
): Promise<UserPermissions> {
  const { data } = await apiClient.get<UserPermissions>(
    `/users/${id}/permissions`,
  );
  const raw = (data ?? {}) as Partial<UserPermissions>;

  return {
    userId: raw.userId ?? id,
    fullName: raw.fullName ?? "",
    role: raw.role ?? "USER",
    editable: raw.editable ?? false,
    mode: raw.mode ?? "role-default",
    sections: (raw.sections ?? []).map((section) => ({
      key: section.key ?? "",
      label: section.label ?? section.key ?? "",
      items: (section.items ?? []).map((item) => ({
        key: item.key ?? "",
        label: item.label ?? item.key ?? "",
        granted: item.granted ?? false,
      })),
    })),
  };
}