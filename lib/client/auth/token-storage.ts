// نگهداری accessToken و refreshToken در localStorage (مشترک بین تب‌ها)
// توجه: این بک‌اند برخلاف فرض اولیه، refreshToken را در کوکی httpOnly نمی‌گذارد،
// بلکه مستقیماً در بدنه‌ی پاسخ برمی‌گرداند، پس خودمان مسئول نگهداری آن هستیم.

const ACCESS_TOKEN_KEY = "karayehban_access_token";
const REFRESH_TOKEN_KEY = "karayehban_refresh_token";
const LOGGED_OUT_KEY = "karayehban_logged_out";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window === "undefined") return;

  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== "undefined") {
    inMemoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
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
  if (typeof window !== "undefined") {
    localStorage.setItem(LOGGED_OUT_KEY, Date.now().toString());
  }
}

/**
 * بررسی آیا در تب دیگری خروج انجام شده است
 * اگر فلگ خروج وجود داشته باشد ولی refresh token وجود نداشته باشد
 * یعنی تب دیگری خروج کرده و ما باید نشست خود را پاک کنیم.
 */
export function hasLoggedOutInOtherTab(): boolean {
  if (typeof window === "undefined") return false;
  const loggedOutFlag = localStorage.getItem(LOGGED_OUT_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  // اگر فلگ خروج وجود دارد ولی refresh token وجود ندارد، یعنی خروج قبلاً انجام شده
  return !!loggedOutFlag && !refreshToken;
}

export function clearLoggedOutFlag() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOGGED_OUT_KEY);
  }
}
