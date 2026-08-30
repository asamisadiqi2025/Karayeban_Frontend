"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeftRight, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

// TODO(اتصال بک‌اند): از API واقعی حساب‌ها بخوانید (همان صفحه‌ی حساب‌ها).
interface AccountOption {
  id: string;
  name: string;
  currencyCode: string;
}

const accounts: AccountOption[] = [
  { id: "ACC-01", name: "صندوق مرکزی", currencyCode: "AFN" },
  { id: "ACC-02", name: "حساب جاری بانک ملی", currencyCode: "USD" },
  { id: "ACC-03", name: "صندوق فرعی طبقه دوم", currencyCode: "AFN" },
];

function getAccount(id: string): AccountOption | undefined {
  return accounts.find((a) => a.id === id);
}

interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  description: string;
}

const initialTransfers: Transfer[] = [
  {
    id: "TRF-01",
    fromAccountId: "ACC-02",
    toAccountId: "ACC-01",
    amount: "500",
    date: "1403-05-10",
    description: "انتقال جهت مصارف نقدی ماهانه",
  },
];

const emptyForm = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  date: "",
  description: "",
};

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: string, currencyCode: string) {
  return `${toNumber(value).toLocaleString("fa-IR")} ${currencyCode}`;
}

export default function AccountTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [sameAccountError, setSameAccountError] = useState(false);

  const filtered = useMemo(() => {
    if (query.trim() === "") return transfers;
    return transfers.filter((t) => {
      const from = getAccount(t.fromAccountId)?.name ?? "";
      const to = getAccount(t.toAccountId)?.name ?? "";
      return (
        from.includes(query) || to.includes(query) || t.description.includes(query)
      );
    });
  }, [transfers, query]);

  const fromAccount = getAccount(form.fromAccountId);
  const toAccount = getAccount(form.toAccountId);
  const currencyMismatch =
    !!fromAccount && !!toAccount && fromAccount.currencyCode !== toAccount.currencyCode;

  function handleChange<K extends keyof typeof emptyForm>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setSameAccountError(false);
    setDialogOpen(true);
  }

  function openEditDialog(transfer: Transfer) {
    setEditingId(transfer.id);
    setForm({
      fromAccountId: transfer.fromAccountId,
      toAccountId: transfer.toAccountId,
      amount: transfer.amount,
      date: transfer.date,
      description: transfer.description,
    });
    setSameAccountError(false);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setTransfers((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.fromAccountId === form.toAccountId) {
      setSameAccountError(true);
      return;
    }
    setSameAccountError(false);
    setLoading(true);

    // TODO: اتصال به بک‌اند NestJS — POST/PATCH /account-transfers
    await new Promise((resolve) => setTimeout(resolve, 500));

    const normalized: Transfer = {
      id: editingId ?? `TRF-${String(transfers.length + 1).padStart(2, "0")}`,
      ...form,
    };

    if (editingId) {
      setTransfers((prev) => prev.map((t) => (t.id === editingId ? normalized : t)));
    } else {
      setTransfers((prev) => [normalized, ...prev]);
    }

    setLoading(false);
    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="انتقال بین حساب‌ها"
        description="انتقال وجه بین حساب‌های نقدی و بانکی"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            انتقال جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">همه انتقالی‌ها</h2>
          </div>

          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجوی حساب یا توضیحات..."
              className="w-full pr-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>از حساب</TableHead>
              <TableHead>به حساب</TableHead>
              <TableHead>مبلغ</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead>توضیحات</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((transfer) => {
              const from = getAccount(transfer.fromAccountId);
              const to = getAccount(transfer.toAccountId);
              return (
                <TableRow
                  key={transfer.id}
                  className="cursor-pointer"
                  onClick={() => openEditDialog(transfer)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {from?.name ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{to?.name ?? "—"}</TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {formatAmount(transfer.amount, from?.currencyCode ?? "")}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {transfer.date}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {transfer.description || "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(transfer);
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
                          handleDelete(transfer.id);
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
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  انتقالی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

     
     {/* مودال انتقال حساب */}
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader className="text-right">
      <DialogTitle>
        {editingId ? "ویرایش انتقال" : "انتقال بین حساب‌ها"}
      </DialogTitle>

      <DialogDescription>
        مبلغ مورد نظر را از یک حساب به حساب دیگر انتقال دهید
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* حساب مبدأ و مقصد */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor="from-account">از حساب</Label>

          <Select
            value={form.fromAccountId}
            onValueChange={(v) => {
              setSameAccountError(false);
              setForm((f) => ({ ...f, fromAccountId: v }));
            }}
          >
            <SelectTrigger id="from-account" className="w-full">
              <SelectValue placeholder="انتخاب حساب مبدأ" />
            </SelectTrigger>

            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.currencyCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor="to-account">به حساب</Label>

          <Select
            value={form.toAccountId}
            onValueChange={(v) => {
              setSameAccountError(false);
              setForm((f) => ({ ...f, toAccountId: v }));
            }}
          >
            <SelectTrigger id="to-account" className="w-full">
              <SelectValue placeholder="انتخاب حساب مقصد" />
            </SelectTrigger>

            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.currencyCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {sameAccountError && (
            <p className="text-xs text-destructive">
              حساب مبدأ و مقصد نمی‌توانند یکسان باشند
            </p>
          )}
        </div>
      </div>

      {/* هشدار تفاوت ارز */}
      {currencyMismatch && !sameAccountError && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          توجه: ارز حساب مبدأ ({fromAccount?.currencyCode}) با حساب مقصد (
          {toAccount?.currencyCode}) متفاوت است. مبلغ بدون تبدیل ارز ثبت می‌شود.
        </p>
      )}

      {/* مبلغ و تاریخ */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 text-right">
          <Label htmlFor="transfer-amount">مبلغ</Label>

          <div className="relative">
            <Input
              id="transfer-amount"
              type="number"
              step="any"
              dir="ltr"
              placeholder="0"
              className="pl-14"
              value={form.amount}
              onChange={handleChange("amount")}
              required
            />

            {fromAccount && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {fromAccount.currencyCode}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-right">
          <Label htmlFor="transfer-date">تاریخ</Label>

          <Input
            id="transfer-date"
            type="date"
            dir="ltr"
            value={form.date}
            onChange={handleChange("date")}
            required
          />
        </div>
      </div>

      {/* توضیحات */}
      <div className="space-y-2 text-right">
        <Label htmlFor="transfer-description">توضیحات</Label>

        <Textarea
          id="transfer-description"
          placeholder="مثلاً: انتقال جهت مصارف نقدی ماهانه"
          rows={4}
          value={form.description}
          onChange={handleChange("description")}
        />
      </div>

      {/* دکمه‌ها */}
      <DialogFooter className="gap-2 sm:gap-2">
        <DialogClose
          render={
            <Button type="button" variant="outline">
              انصراف
            </Button>
          }
        />

        <Button type="submit" disabled={loading}>
          {loading && (
            <Loader2
              data-icon="inline-start"
              className="animate-spin"
            />
          )}

          {loading
            ? "در حال ذخیره..."
            : editingId
              ? "ذخیره تغییرات"
              : "ثبت انتقال"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
    </div>
  );
}
