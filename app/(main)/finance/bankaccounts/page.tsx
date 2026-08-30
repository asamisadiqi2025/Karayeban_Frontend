// import { PageHeader } from '@/components/page-header';
// import { Card } from '@/components/ui/card';

// import { AccountFormDialog } from './account-form-dialog';
// import { AccountsTable } from './accounts-table';
// import type { Account, CreateAccountInput, Currency } from './types';

// // نقاط اتصال به بک‌اند — این دو تابع و اکشن را با پیاده‌سازی واقعی پروژه
// // (مثلاً از @/lib/api یا @/lib/actions/accounts) جایگزین کنید.
// async function getAccounts(): Promise<Account[]> {
//   throw new Error('getAccounts() باید به API/دیتابیس واقعی پروژه وصل شود.');
// }

// async function getCurrencies(): Promise<Currency[]> {
//   throw new Error('getCurrencies() باید به صفحه‌ی تنظیمات ارز موجود در پروژه وصل شود.');
// }

// async function createAccount(input: CreateAccountInput): Promise<void> {
//   'use server';
//   throw new Error('createAccount() باید به Server Action یا API واقعی پروژه وصل شود.');
// }

// export default async function AccountsPage() {
//   const [accounts, currencies] = await Promise.all([getAccounts(), getCurrencies()]);

//   return (
//     <div className="space-y-6" dir="rtl">
//       <PageHeader
//         title="حساب‌ها"
//         description="مدیریت حساب‌های نقدی و بانکی"
//         action={
//           <AccountFormDialog currencies={currencies} onCreateAccount={createAccount} />
//         }
//       />

//       <Card className="p-0">
//         <AccountsTable accounts={accounts} />
//       </Card>
//     </div>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Landmark, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type AccountType = "cash" | "bank";

interface Currency {
  code: string;
  name: string;
  isBase: boolean;
}

// TODO(اتصال بک‌اند): از صفحه‌ی تنظیمات ارز واقعی پروژه بخوانید.
const currencies: Currency[] = [
  { code: "AFN", name: "افغانی", isBase: true },
  { code: "USD", name: "دالر امریکایی", isBase: false },
  { code: "EUR", name: "یورو", isBase: false },
  { code: "PKR", name: "کلدار پاکستانی", isBase: false },
];

interface Account {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  accountNumber: string;
  bankName: string;
  openingAmount: string;
  openingDate: string;
  exchangeRate: string;
}

const initialAccounts: Account[] = [
  {
    id: "ACC-01",
    name: "صندوق مرکزی",
    type: "cash",
    currencyCode: "AFN",
    accountNumber: "",
    bankName: "",
    openingAmount: "150000",
    openingDate: "1403-04-01",
    exchangeRate: "1",
  },
  {
    id: "ACC-02",
    name: "حساب جاری بانک ملی",
    type: "bank",
    currencyCode: "USD",
    accountNumber: "AF-3390214",
    bankName: "بانک ملی افغان",
    openingAmount: "5000",
    openingDate: "1403-03-15",
    exchangeRate: "70",
  },
];

const emptyForm = {
  name: "",
  type: "cash" as AccountType,
  currencyCode: "AFN",
  accountNumber: "",
  bankName: "",
  openingAmount: "",
  openingDate: "",
  exchangeRate: "1",
};

function getCurrency(code: string): Currency | undefined {
  return currencies.find((c) => c.code === code);
}

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: string, currencyCode: string) {
  return `${toNumber(value).toLocaleString("fa-IR")} ${currencyCode}`;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | AccountType>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchesFilter = filter === "all" || a.type === filter;
      const matchesQuery =
        query.trim() === "" ||
        a.name.includes(query) ||
        a.accountNumber.includes(query) ||
        a.bankName.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [accounts, query, filter]);

  const baseCurrency = useMemo(() => currencies.find((c) => c.isBase), []);
  const selectedCurrency = getCurrency(form.currencyCode);
  const isBaseCurrencySelected = selectedCurrency?.isBase ?? false;

  const baseEquivalent = useMemo(() => {
    const amount = toNumber(form.openingAmount);
    const rate = isBaseCurrencySelected ? 1 : toNumber(form.exchangeRate);
    return (amount * rate).toLocaleString("fa-IR", { maximumFractionDigits: 2 });
  }, [form.openingAmount, form.exchangeRate, isBaseCurrencySelected]);

  function handleChange<K extends keyof typeof emptyForm>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(account: Account) {
    setEditingId(account.id);
    setForm({
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      openingAmount: account.openingAmount,
      openingDate: account.openingDate,
      exchangeRate: account.exchangeRate,
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: اتصال به بک‌اند NestJS — POST/PATCH /accounts
    await new Promise((resolve) => setTimeout(resolve, 500));

    const normalized: Account = {
      id: editingId ?? `ACC-${String(accounts.length + 1).padStart(2, "0")}`,
      ...form,
      accountNumber: form.type === "bank" ? form.accountNumber : "",
      bankName: form.type === "bank" ? form.bankName : "",
      exchangeRate: isBaseCurrencySelected ? "1" : form.exchangeRate,
    };

    if (editingId) {
      setAccounts((prev) => prev.map((a) => (a.id === editingId ? normalized : a)));
    } else {
      setAccounts((prev) => [normalized, ...prev]);
    }

    setLoading(false);
    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="حساب‌ها"
        description="مدیریت حساب‌های نقدی و بانکی مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن حساب جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">همه حساب‌ها</h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی نام حساب، شماره یا بانک..."
                className="w-full pr-8 sm:w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="cash">نقد</TabsTrigger>
                <TabsTrigger value="bank">بانکی</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام حساب</TableHead>
              <TableHead>نوع</TableHead>
              <TableHead>ارز</TableHead>
              <TableHead>شماره حساب / بانک</TableHead>
              <TableHead>مبلغ افتتاحیه</TableHead>
              <TableHead>معادل ارز پایه</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((account) => {
              const currency = getCurrency(account.currencyCode);
              const rate = currency?.isBase ? 1 : toNumber(account.exchangeRate);
              const equivalent = (toNumber(account.openingAmount) * rate).toLocaleString(
                "fa-IR",
                { maximumFractionDigits: 2 }
              );

              return (
                <TableRow
                  key={account.id}
                  className="cursor-pointer"
                  onClick={() => openEditDialog(account)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{account.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.type === "cash" ? "secondary" : "outline"}>
                      {account.type === "cash" ? "نقد" : "بانکی"}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {account.currencyCode}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {account.type === "bank"
                      ? `${account.accountNumber} — ${account.bankName}`
                      : "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {formatAmount(account.openingAmount, account.currencyCode)}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {equivalent} {baseCurrency?.code}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(account);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(account.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  حسابی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال ایجاد بانک / ویرایش حساب */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش حساب" : "ایجاد بانک"}</DialogTitle>
            <DialogDescription>
              اطلاعات حساب نقدی یا بانکی را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* ۱. نام حساب */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="account-name">نام حساب</Label>
                <Input
                  id="account-name"
                  placeholder="مثلاً: صندوق مرکزی"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                />
              </div>

              {/* ۲. نوع حساب */}
              <div className="space-y-2">
                <Label htmlFor="account-type">نوع حساب</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as AccountType }))
                  }
                >
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقد</SelectItem>
                    <SelectItem value="bank">حساب بانکی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ۳. ارز حساب */}
              <div className="space-y-2">
                <Label htmlFor="account-currency">ارز حساب</Label>
                <Select
                  value={form.currencyCode}
                  onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}
                >
                  <SelectTrigger id="account-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ۴ و ۵. شماره حساب و نام بانک — فقط برای نوع «حساب بانکی» */}
            {form.type === "bank" && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-number">شماره حساب</Label>
                  <Input
                    id="account-number"
                    dir="ltr"
                    placeholder="مثلاً: AF-3390214"
                    value={form.accountNumber}
                    onChange={handleChange("accountNumber")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">نام بانک</Label>
                  <Input
                    id="bank-name"
                    placeholder="مثلاً: بانک ملی افغان"
                    value={form.bankName}
                    onChange={handleChange("bankName")}
                    required
                  />
                </div>
              </div>
            )}

            {/* ۶. افتتاحیه حساب */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                افتتاحیه حساب
              </Label>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="opening-amount">مبلغ اولیه</Label>
                  <Input
                    id="opening-amount"
                    type="number"
                    step="any"
                    dir="ltr"
                    placeholder="0"
                    value={form.openingAmount}
                    onChange={handleChange("openingAmount")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opening-date">تاریخ افتتاح</Label>
                  {/*
                    یادداشت: تقویم شمسی افغانستان هنوز ساخته نشده. فعلاً از
                    input تاریخ میلادی استفاده شده؛ بعد از ساخته‌شدن کامپوننت
                    تقویم شمسی، همین‌جا جایگزین شود.
                  */}
                  <Input
                    id="opening-date"
                    type="date"
                    dir="ltr"
                    value={form.openingDate}
                    onChange={handleChange("openingDate")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange-rate">نرخ تبدیل</Label>
                  <Input
                    id="exchange-rate"
                    type="number"
                    step="any"
                    dir="ltr"
                    disabled={isBaseCurrencySelected}
                    value={isBaseCurrencySelected ? "1" : form.exchangeRate}
                    onChange={handleChange("exchangeRate")}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ۷. معادل به ارز پایه — محاسبه‌شده، فقط‌خواندنی */}
            <div className="space-y-2">
              <Label htmlFor="base-equivalent">معادل به ارز پایه</Label>
              <Input
                id="base-equivalent"
                readOnly
                dir="ltr"
                tabIndex={-1}
                className="bg-muted font-medium"
                value={`${baseEquivalent} ${baseCurrency?.code ?? ""}`}
              />
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {loading ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "ثبت حساب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
