"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/shared/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  USER_ROLE_OPTIONS,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserRole,
} from "@/services/user.service";

export interface UserFormValues {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
}

export const emptyUserForm: UserFormValues = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  role: "USER",
  phone: "",
  isActive: true,
};

const ROLE_LABEL: Record<string, string> = {
  ACCOUNTANT: "حسابدار",
  STAFF: "کارمند",
};

/** برچسب فارسی نقش؛ نقش‌های سفارشی (customRole) نام خودشان را نشان می‌دهند. */
export function userRoleLabel(role: string, customRoleName?: string | null) {
  if (customRoleName) return customRoleName;
  return ROLE_LABEL[role] ?? role;
}

export function UserRoleBadge({
  role,
  customRoleName,
}: {
  role: string;
  customRoleName?: string | null;
}) {
  const label = userRoleLabel(role, customRoleName);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        role === "SUPER_ADMIN"
          ? "bg-violet-50 text-violet-700"
          : role === "ADMIN"
            ? "bg-blue-50 text-blue-700"
            : role === "ACCOUNTANT"
              ? "bg-amber-50 text-amber-700"
              : "bg-secondary text-secondary-foreground",
      )}
    >
      {label}
    </span>
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^0?\d{9,10}$/;
const USERNAME_LETTER = /[A-Za-z]/;
const USERNAME_DIGIT = /[0-9]/;
/** فقط حروف کوچک انگلیسی، عدد، خط تیره‌ی زیرین و نقطه مجاز است. */
const USERNAME_PATTERN = /^[a-z0-9_.]+$/;

/** مقادیر فرم یک کاربر را اعتبارسنجی می‌کند؛ در صورت خطا پیام فارسی برمی‌گرداند. */
export function validateUserForm(
  values: UserFormValues,
  { requirePassword = true }: { requirePassword?: boolean } = {},
): string | null {
  if (!values.fullName.trim()) {
    return "نام کامل الزامی است";
  }
  if (!values.username.trim()) {
    return "نام کاربری الزامی است";
  }
  const username = values.username.trim();
  if (!USERNAME_LETTER.test(username) || !USERNAME_DIGIT.test(username)) {
    return "نام کاربری باید حداقل یک حرف و یک عدد داشته باشد";
  }
  if (username.length < 8) {
    return "نام کاربری باید حداقل ۸ کاراکتر باشد";
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "نام کاربری فقط می‌تواند شامل حروف کوچک انگلیسی، عدد، _ و . باشد";
  }
  if (!values.email.trim()) {
    return "ایمیل الزامی است";
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    return "ایمیل معتبر نیست";
  }
  if (requirePassword || values.password.trim()) {
    if (!values.password.trim()) {
      return "رمز عبور الزامی است";
    }
    if (values.password.trim().length < 6) {
      return "رمز عبور باید حداقل ۶ کاراکتر باشد";
    }
  }
  if (!values.role) {
    return "انتخاب نقش الزامی است";
  }
  if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) {
    return "شماره تماس معتبر نیست";
  }
  return null;
}

/**
 * مقادیر فرم را به بدنه‌ی قابل ارسال برای POST /users تبدیل می‌کند.
 * فیلدهای خالی به null تبدیل می‌شوند تا بک‌اند مقدار قبلی را پاک نکند.
 */
export function toUserBody(values: UserFormValues): CreateUserPayload {
  const optional = (value: string) => (value.trim() ? value.trim() : null);

  return {
    fullName: values.fullName.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
    password: values.password.trim(),
    role: values.role,
    phone: optional(values.phone),
  };
}

/**
 * همان بدنه‌ی بالا برای PATCH /users/:id؛ رمز عبور فقط وقتی ارسال می‌شود که
 * پر شده باشد، تا رمز قبلی کاربر پاک نشود.
 */
export function toUserUpdateBody(values: UserFormValues): UpdateUserPayload {
  const { password, ...rest } = toUserBody(values);
  return password ? { ...rest, password } : rest;
}

interface UserFormFieldsProps {
  values: UserFormValues;
  onChange: (next: UserFormValues) => void;
  /**
   * حالت ویرایش: وضعیت فعال/غیرفعال نمایش داده می‌شود و رمز عبور اختیاری می‌شود
   * (خالی گذاشتن یعنی رمز قبلی دست‌نخورده بماند).
   */
  showIsActive?: boolean;
  idPrefix?: string;
}

export function UserFormFields({
  values,
  onChange,
  showIsActive = false,
  idPrefix = "user",
}: UserFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);

  const set = (patch: Partial<UserFormValues>) =>
    onChange({ ...values, ...patch });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-fullName`}>نام کامل</Label>
          <Input
            id={`${idPrefix}-fullName`}
            placeholder="مثلاً: احمد رحیمی"
            value={values.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-username`}>نام کاربری</Label>
          <Input
            id={`${idPrefix}-username`}
            dir="ltr"
            placeholder="ahmad.rahmaty_1"
            value={values.username}
            onChange={(e) => set({ username: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            حداقل ۸ کاراکتر، شامل حرف و عدد — فقط حروف کوچک انگلیسی، عدد، _ و .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-email`}>ایمیل</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            dir="ltr"
            placeholder="name@example.com"
            value={values.email}
            onChange={(e) => set({ email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-password`}>
            رمز عبور
            {!showIsActive && (
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                (حداقل ۶ کاراکتر)
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id={`${idPrefix}-password`}
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="new-password"
              placeholder={showIsActive ? "برای تغییر، رمز جدید" : "••••••"}
              className="px-9"
              value={values.password}
              onChange={(e) => set({ password: e.target.value })}
              required={!showIsActive}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-role`}>نقش</Label>
          <Select
            value={values.role}
            onValueChange={(v) => set({ role: v ?? "USER" })}
          >
            <SelectTrigger id={`${idPrefix}-role`} className="w-full">
              <SelectValue>{(value) => userRoleLabel(String(value))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {USER_ROLE_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {userRoleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-phone`}>شماره تماس</Label>
          <Input
            id={`${idPrefix}-phone`}
            type="tel"
            dir="ltr"
            placeholder="07XXXXXXXX"
            value={values.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
        </div>
      </div>

      {showIsActive && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2 text-right">
            <Label htmlFor={`${idPrefix}-isActive`}>وضعیت حساب</Label>
            <Select
              value={values.isActive ? "active" : "inactive"}
              onValueChange={(v) => set({ isActive: v === "active" })}
            >
              <SelectTrigger id={`${idPrefix}-isActive`} className="w-full">
                <SelectValue>
                  {(value) => (value === "active" ? "فعال" : "غیرفعال")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

    
    </div>
  );
}