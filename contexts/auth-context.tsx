"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  fetchMe,
  loginRequest,
  logoutRequest,
  registerRequest,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "@/services/auth.service";
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
} from "@/lib/client/auth/token-storage";
import { extractApiErrorMessage } from "@/services/client";

interface AuthContextValue {
  user: AuthUser | null;
  /** در حال بررسی نشست فعلی (اولین بار که اپ لود می‌شود) */
  isLoading: boolean;
  /** در حال ارسال درخواست ورود/ثبت‌نام/خروج */
  isSubmitting: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // موقع لود اولیه‌ی اپ، اگر توکنی ذخیره شده باشد نشست قبلی را بازیابی می‌کنیم.
  // بدون توکن اصلاً /auth/me صدا زده نمی‌شود تا از حلقه‌ی ۴۰۱ → ریدایرکت جلوگیری شود.
  useEffect(() => {
    let cancelled = false;

    if (!getAccessToken() && !getRefreshToken()) {
      setIsLoading(false);
      return;
    }

    fetchMe()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);
      try {
        const { user: loggedInUser } = await loginRequest(payload);
        setUser(loggedInUser);
        router.push("/dashboard");
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, "ایمیل یا رمز عبور اشتباه است"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsSubmitting(true);
      try {
        const { user: newUser } = await registerRequest(payload);
        setUser(newUser);
        router.push("/dashboard");
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, "ثبت‌نام ناموفق بود"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await logoutRequest();
    } catch {
      // حتی اگر درخواست خروج در سرور با خطا مواجه شد، نشست محلی را پاک می‌کنیم
    } finally {
      clearAuth();
      setUser(null);
      setIsSubmitting(false);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isSubmitting, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth باید داخل AuthProvider استفاده شود");
  }
  return ctx;
}
