/**
 * نوع حساب: CASH (نقد/صندوق) یا BANK (حساب بانکی)
 * مطابق مقدار ارسال‌شده به POST /accounts
 */
export type AccountType = "CASH" | "BANK";

/**
 * واحد پولی اضافه‌شده به سیستم — خروجی GET /currencies
 */
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
}

/**
 * بدنه‌ی درخواست POST /accounts
 * برای نوع BANK فیلد bankName الزامی است
 */
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currencyId: string;
  openingBalance: {
    amount: number;
  };
  bankName?: string | null;
  accountNumber?: string | null;
}

/**
 * حساب نقدی/بانکی برگشتی از بک‌اند
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currencyId: string;
  currencyCode?: string;
  bankName?: string | null;
  accountNumber?: string | null;
  openingBalance: number;
}