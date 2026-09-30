"use client";

import { useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";

import afghanLocale from "@/lib/date-picker/afghan-locale";
import { isoToPersianDate, persianDateToIso } from "@/lib/date-picker";
import { cn } from "@/lib/shared/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AddedCurrency } from "@/services/currency.service";
import type { AssetStatus } from "@/services/asset.service";

export interface AssetFormValues {
  name: string;
  category: string;
  purchasePrice: string;
  currencyId: string;
  lifespanYears: string;
  purchaseDate: string;
  status: AssetStatus;
  details: string;
}

export const emptyAssetForm: AssetFormValues = {
  name: "",
  category: "",
  purchasePrice: "",
  currencyId: "",
  lifespanYears: "",
  purchaseDate: "",
  status: "active",
  details: "",
};

export const assetStatusOptions: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "فعال" },
  { value: "disposed", label: "از رده خارج شده" },
];

export function assetStatusLabel(status: AssetStatus): string {
  return status === "disposed" ? "از رده خارج شده" : "فعال";
}

/** مقادیر فرم یک دارایی را اعتبارسنجی می‌کند؛ در صورت خطا پیام فارسی برمی‌گرداند. */
export function validateAssetForm(values: AssetFormValues): string | null {
  if (!values.name.trim()) {
    return "نام دارایی الزامی است";
  }
  if (!values.category.trim()) {
    return "دسته‌بندی الزامی است";
  }
  const price = Number(values.purchasePrice);
  if (values.purchasePrice.trim() === "" || !Number.isFinite(price) || price < 0) {
    return "قیمت خرید باید عددی مثبت باشد";
  }
  if (!values.currencyId) {
    return "انتخاب واحد پولی الزامی است";
  }
  const lifespan = Number(values.lifespanYears);
  if (values.lifespanYears.trim() === "" || !Number.isFinite(lifespan) || lifespan <= 0) {
    return "عمر مفید باید عددی بزرگ‌تر از صفر باشد";
  }
  if (!values.purchaseDate) {
    return "تاریخ خرید الزامی است";
  }
  return null;
}

/** مقادیر فرم را به بدنه‌ی قابل ارسال برای POST /assets و PATCH /assets/:id تبدیل می‌کند. */
export function toAssetBody(values: AssetFormValues) {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    purchasePrice: Number(values.purchasePrice),
    currencyId: values.currencyId,
    lifespanYears: Number(values.lifespanYears),
    purchaseDate: values.purchaseDate,
    details: values.details.trim(),
  };
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const isActive = status === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
      )}
    >
      {assetStatusLabel(status)}
    </span>
  );
}

interface AssetFormFieldsProps {
  values: AssetFormValues;
  onChange: (next: AssetFormValues) => void;
  currencies: AddedCurrency[];
  /** وضعیت فقط در ویرایش قابل تغییر است، چون POST /assets آن را نمی‌پذیرد. */
  showStatus?: boolean;
  idPrefix?: string;
}

export function AssetFormFields({
  values,
  onChange,
  currencies,
  showStatus = false,
  idPrefix = "asset",
}: AssetFormFieldsProps) {
  const currencyName = useMemo(
    () => (id: string) => currencies.find((c) => c.id === id)?.name ?? "",
    [currencies],
  );

  const set = (patch: Partial<AssetFormValues>) => onChange({ ...values, ...patch });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-name`}>نام دارایی</Label>
          <Input
            id={`${idPrefix}-name`}
            placeholder="مثلاً: کولر برقی"
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-category`}>دسته‌بندی</Label>
          <Input
            id={`${idPrefix}-category`}
            placeholder="مثلاً: سخت‌افزار"
            value={values.category}
            onChange={(e) => set({ category: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-price`}>قیمت خرید</Label>
          <Input
            id={`${idPrefix}-price`}
            type="number"
            step="any"
            min="0"
            dir="ltr"
            placeholder="0"
            value={values.purchasePrice}
            onChange={(e) => set({ purchasePrice: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-currency`}>واحد پولی</Label>
          <Select
            value={values.currencyId}
            onValueChange={(v) => set({ currencyId: v ?? "" })}
          >
            <SelectTrigger id={`${idPrefix}-currency`} className="w-full">
              <SelectValue placeholder="انتخاب واحد پولی">
                {(value) => currencyName(String(value)) || "انتخاب واحد پولی"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currencies.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  واحد پولی تعریف نشده است
                </SelectItem>
              ) : (
                currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-lifespan`}>عمر مفید (سال)</Label>
          <Input
            id={`${idPrefix}-lifespan`}
            type="number"
            min="1"
            dir="ltr"
            placeholder="مثلاً: 5"
            value={values.lifespanYears}
            onChange={(e) => set({ lifespanYears: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor={`${idPrefix}-date`}>تاریخ خرید</Label>
          <DatePicker
            calendar={persian}
            locale={afghanLocale}
            calendarPosition="bottom-right"
            containerClassName="w-full"
            placeholder="تاریخ خرید را انتخاب کنید"
            value={
              values.purchaseDate ? isoToPersianDate(values.purchaseDate) : undefined
            }
            onChange={(date) => {
              if (date?.isValid) {
                set({ purchaseDate: persianDateToIso(date) });
              }
            }}
          />
        </div>
      </div>

      {showStatus && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2 text-right">
            <Label htmlFor={`${idPrefix}-status`}>وضعیت</Label>
            <Select
              value={values.status}
              onValueChange={(v) => set({ status: (v as AssetStatus) ?? "active" })}
            >
              <SelectTrigger id={`${idPrefix}-status`} className="w-full">
                <SelectValue>
                  {(value) => assetStatusLabel((value as AssetStatus) ?? "active")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {assetStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-2 text-right">
        <Label htmlFor={`${idPrefix}-details`}>جزییات</Label>
        <Textarea
          id={`${idPrefix}-details`}
          rows={4}
          placeholder="توضیحات تکمیلی..."
          value={values.details}
          onChange={(e) => set({ details: e.target.value })}
        />
      </div>
    </div>
  );
}

/** react-multi-date-picker needs a global override of .rmdp-input */
export function DatePickerStyles() {
  return (
    <style jsx global>{`
      .rmdp-input {
        width: 100%;
        height: 36px;
        border-radius: 6px;
        border: 1px solid hsl(var(--border));
        background: transparent;
        padding: 0 12px;
        font-size: 14px;
      }
      .rmdp-input:focus {
        outline: none;
        border-color: hsl(var(--ring));
      }
    `}</style>
  );
}
