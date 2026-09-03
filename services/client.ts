import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/client/auth/token-storage";

// آدرس بک‌اند NestJS — در .env.local تعریف کنید: NEXT_PUBLIC_API_URL=...
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// افزودن خودکار Authorization header به هر درخواست
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// جلوگیری از ارسال چندباره‌ی درخواست refresh هم‌زمان از چند تب/درخواست
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    // این بک‌اند refreshToken را در بدنه‌ی پاسخ برمی‌گرداند (نه کوکی httpOnly)
    // پس خودمان باید آن را در بدنه‌ی درخواست refresh هم بفرستیم
    const { data } = await axios.post<any>(`${API_URL}/auth/refresh`, {
      refreshToken,
    });

    const newAccessToken = data?.accessToken ?? data?.access_token ?? null;
    const newRefreshToken = data?.refreshToken ?? data?.refresh_token ?? null;

    if (newAccessToken) setAccessToken(newAccessToken);
    if (newRefreshToken) setRefreshToken(newRefreshToken);

    return newAccessToken;
  } catch {
    return null;
  }
}

// اگر توکن منقضی شده باشد (401)، یک‌بار تلاش برای refresh و تکرار درخواست اصلی
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/me")
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      clearAuth();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * پیام خطای قابل‌نمایش را از پاسخ خطای بک‌اند NestJS استخراج می‌کند
 * (فرمت استاندارد NestJS: { message: string | string[], statusCode, error })
 */
export function extractApiErrorMessage(error: unknown, fallback = "خطایی رخ داد، لطفاً دوباره تلاش کنید"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message[0];
    if (typeof data?.message === "string") return data.message;
    if (error.code === "ERR_NETWORK") return "اتصال به سرور برقرار نشد";
  }
  return fallback;
}
