// نگهداری accessToken (حافظه + sessionStorage) و refreshToken (localStorage)
// توجه: این بک‌اند برخلاف فرض اولیه، refreshToken را در کوکی httpOnly نمی‌گذارد،
// بلکه مستقیماً در بدنه‌ی پاسخ برمی‌گرداند، پس خودمان مسئول نگهداری آن هستیم.

const ACCESS_TOKEN_KEY = "karayehban_access_token";
const REFRESH_TOKEN_KEY = "karayehban_refresh_token";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window === "undefined") return;

  if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== "undefined") {
    inMemoryAccessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return inMemoryAccessToken;
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuth() {
  setAccessToken(null);
  setRefreshToken(null);
}
