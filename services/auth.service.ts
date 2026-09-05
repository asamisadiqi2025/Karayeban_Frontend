import { apiClient } from "@/services/client";
import { setAccessToken, setRefreshToken } from "@/lib/client/auth/token-storage";
import { fetchMyMarket } from "@/services/market.service";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId?: string;
  marketId?: string;
  isSetupComplete: boolean;
}

export interface LoginPayload {
  /** ایمیل یا شماره موبایل — بک‌اند این فیلد را identifier می‌خواهد */
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  org: string;
  email: string;
  password: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

/**
 * بک‌اندهای مختلف فرمت کمی متفاوت برمی‌گردونن؛ این تابع فیلدهای رایج رو یکسان می‌کنه
 */
function normalizeTokenResponse(raw: any): TokenResponse {
  return {
    accessToken: raw.accessToken ?? raw.access_token ?? raw.token,
    refreshToken: raw.refreshToken ?? raw.refresh_token,
    expiresIn: raw.expiresIn ?? raw.expires_in,
  };
}

function normalizeUser(raw: any): AuthUser {
  return {
    id: raw.id ?? raw._id ?? raw.sub ?? "",
    firstName: raw.firstName ?? raw.first_name ?? raw.name?.split(" ")[0] ?? "",
    lastName:
      raw.lastName ??
      raw.last_name ??
      raw.name?.split(" ").slice(1).join(" ") ??
      "",
    email: raw.email ?? "",
    role: (raw.role ?? raw.roleName ?? "user").toLowerCase(),
    orgId: raw.orgId ?? raw.org_id ?? raw.organizationId,
    isSetupComplete: raw.isSetupComplete ?? raw.is_setup_complete ?? raw.setupComplete ?? false,
  };
}

// POST /auth/login — با identifier (ایمیل یا شماره) + password
// پاسخ فقط شامل توکن‌هاست، بدون اطلاعات کاربر؛ برای همین بعدش fetchMe صدا زده می‌شود
export async function loginRequest(payload: LoginPayload): Promise<{ user: AuthUser }> {
  const { data } = await apiClient.post("/auth/login", payload);
  const tokens = normalizeTokenResponse(data);

  if (!tokens.accessToken) {
    throw new Error("سرور توکن دسترسی را برنگرداند");
  }

  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);

  const user = await fetchMe();
  return { user };
}

// POST /auth/register
export async function registerRequest(payload: RegisterPayload): Promise<{ user: AuthUser }> {
  const { data } = await apiClient.post("/auth/register", payload);
  const tokens = normalizeTokenResponse(data);

  if (!tokens.accessToken) {
    throw new Error("سرور توکن دسترسی را برنگرداند");
  }

  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);

  const user = await fetchMe();
  return { user };
}

// POST /auth/logout
export async function logoutRequest(): Promise<void> {
  await apiClient.post("/auth/logout");
}

// GET /auth/me — بازیابی پروفایل کامل کاربر با استفاده از access token
export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get("/auth/me");
  const user = normalizeUser(data);

  // اگر بک‌اند فیلد isSetupComplete را برنگرداند، آن را از مارکت جاری کاربر می‌خوانیم
  // (GET /markets فیلد isSetupComplete مربوط به مارکت را برمی‌گرداند)
  if (data.isSetupComplete === undefined && data.is_setup_complete === undefined && data.setupComplete === undefined) {
    try {
      const market = await fetchMyMarket();
      user.marketId = market.id;
      user.isSetupComplete = market.isSetupComplete;
    } catch {
      user.isSetupComplete = false;
    }
  }

  return user;
}
