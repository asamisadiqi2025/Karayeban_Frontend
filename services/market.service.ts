import { apiClient, API_URL } from "@/services/client";

export interface CreateMarketPayload {
  name: string;
  address: string;
  subdomain: string;
  logo: string;
  baseCurrency: string;
  phone: string;
  email: string;
}

export interface UpdateMarketProfilePayload {
  name?: string;
  address?: string;
  logo?: string;
  baseCurrency?: string;
  phone?: string;
  email?: string;
  details?: string;
}

/**
 * آپلود لوگوی مارکت
 * POST /uploads/market-logos — multipart/form-data با فیلد file، آدرس فایل را برمی‌گرداند
 */
export async function uploadMarketLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  // بدون این هدر، axios داده‌ی FormData را به JSON تبدیل می‌کند و boundary از بین می‌رود
  const { data } = await apiClient.post("/uploads/market-logos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const url = extractUploadedUrl(data);
  if (!url) {
    throw new Error("آدرس لوگو از سرور دریافت نشد");
  }
  return url;
}

/** بک‌اند ممکن است آدرس فایل را با کلیدهای مختلف برگرداند؛ همه را یکسان می‌کنیم */
function extractUploadedUrl(data: unknown): string | null {
  if (typeof data === "string") return data || null;
  if (!data || typeof data !== "object") return null;

  const source = data as Record<string, unknown>;
  const keys = ["url", "path", "logo", "logoUrl", "fileUrl", "filePath", "location", "src"];

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value) return value;
  }

  const nested = source.data;
  if (nested && typeof nested === "object") {
    return extractUploadedUrl(nested);
  }

  return null;
}

/**
 * آدرس فایل‌های استاتیک روی origin سرور سرو می‌شود، نه زیر پیشوند /api/v1
 * (پیشوند سراسری فقط روی route‌ها اعمال می‌شود، نه روی فایل‌های آپلودی).
 */
const API_ORIGIN = API_URL.replace(/\/+$/, "").replace(/\/api\/v\d+$/i, "");

/**
 * آدرس فایل ممکن است نسبی باشد (مثلاً /uploads/market-logos/logo.png یا فقط نام فایل)
 * تا در <img> قابل استفاده شود با origin سرور کامل می‌شود.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;

  // اگر بک‌اند آدرس کامل با پیشوند /api/v1 را برگردانده، پیشوند را حذف کن
  let path = url.trim();
  const apiPathMatch = API_URL.replace(/\/+$/, "").match(/^(https?:\/\/[^/]+)(\/.*)$/);
  if (apiPathMatch && path.startsWith(apiPathMatch[2])) {
    path = path.slice(apiPathMatch[2].length);
  }

  // اگر فقط نام فایل باشد، داخل پوشه‌ی لوگوی مارکت قرار می‌گیرد
  const normalized = path.includes("/")
    ? `${path.startsWith("/") ? "" : "/"}${path}`
    : `/uploads/market-logos/${path}`;

  return `${API_ORIGIN}${normalized}`;
}

export interface Market {
  id: string;
  name: string;
  address: string | null;
  subdomain: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  details: string | null;
  baseCurrencyId: string | null;
  /** اگر بک‌-end کد ارز را همراه رابطه برگرداند، اینجا پر می‌شود */
  baseCurrencyCode?: string | null;
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RawMarket {
  baseCurrencyId?: string | null;
  base_currency_id?: string | null;
  baseCurrency?: string | { id?: string; code?: string } | null;
  logo?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
}

/**
 * بک‌اند گاهی به‌جای baseCurrencyId خودِ رابطه را برمی‌گرداند و گاهی کد را.
 * هر سه حالت را یکسان می‌کنیم تا فرم بتواند ارز پایه را نمایش دهد.
 */
function normalizeMarket(raw: Market): Market {
  const source = raw as Market & RawMarket;
  const baseCurrency = source.baseCurrency;
  const nested =
    baseCurrency && typeof baseCurrency === "object" ? baseCurrency : null;

  return {
    ...raw,
    logo: source.logo ?? source.logo_url ?? source.logoUrl ?? null,
    baseCurrencyId:
      source.baseCurrencyId ?? source.base_currency_id ?? nested?.id ?? null,
    baseCurrencyCode:
      (typeof baseCurrency === "string" ? baseCurrency : nested?.code) ?? null,
  };
}

/**
 * ایجاد مارکت جدید
 * POST /markets — فقط SUPER_ADMIN مجاز است
 */
export async function createMarket(payload: CreateMarketPayload): Promise<Market> {
  const { data } = await apiClient.post<Market>("/markets", payload);
  return normalizeMarket(data);
}

/**
 * بروزرسانی پروفایل مارکت
 * PATCH /markets/:id/profile — SUPER_ADMIN و ADMIN (مالک مارکت) مجازند
 */
export async function updateMarketProfile(
  id: string,
  payload: UpdateMarketProfilePayload
): Promise<Market> {
  const { data } = await apiClient.patch<Market>(`/markets/${id}/profile`, payload);
  return normalizeMarket(data);
}

/**
 * گت مارکت جاری کاربر
 * GET /markets — فیلد isSetupComplete را برمی‌گرداند
 */
export async function fetchMyMarket(): Promise<Market> {
  const { data } = await apiClient.get<Market[] | Market>("/markets");
  if (Array.isArray(data)) {
    const market = data[0];
    if (!market) throw new Error("مارکتی برای این کاربر یافت نشد");
    return normalizeMarket(market);
  }
  return normalizeMarket(data);
}