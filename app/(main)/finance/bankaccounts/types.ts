/**
 * نوع حساب: نقد (صندوق، بدون شماره حساب/بانک) یا حساب بانکی
 */
export type AccountType = 'CASH' | 'BANK';

export interface Currency {
  id: string;
  code: string; // مثال: AFN, USD
  name: string; // مثال: افغانی، دالر امریکایی
  isBase: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  accountNumber: string | null;
  bankName: string | null;
  openingAmount: number;
  openingDate: string; // ISO date
  exchangeRate: number;
  baseCurrencyEquivalent: number;
  createdAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currencyId: string;
  accountNumber: string | null;
  bankName: string | null;
  openingAmount: number;
  openingDate: string;
  exchangeRate: number;
}
