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
import { clearAuth } from "@/lib/client/auth/token-storage";
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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // موقع لود اولیه‌ی اپ، با تکیه بر کوکی refresh token سعی می‌کنیم نشست قبلی را بازیابی کنیم
  useEffect(() => {
    let cancelled = false;

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
        if (loggedInUser.role === "admin" || loggedInUser.role === "superadmin") {
          if (!loggedInUser.isSetupComplete) {
            router.push("/market-profile");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
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
        if (newUser.role === "admin" || newUser.role === "superadmin") {
          if (!newUser.isSetupComplete) {
            router.push("/market-profile");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, "ثبت‌نام ناموفق بود"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchMe();
    setUser(currentUser);
  }, []);

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
      value={{ user, isLoading, isSubmitting, login, register, logout, refreshUser }}
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
