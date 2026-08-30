"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Landmark } from "lucide-react";

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

type BankType = "دولتی" | "خصوصی" | "اسلامی";

// TODO: این لیست باید از همون منبع واحدهای پولی (settings/currencies) بیاد،
// فعلاً برای استقلال این صفحه به‌صورت نمونه تعریف شده
const currencyOptions = [
  { code: "AFN", label: "افغانی افغانستان" },
  { code: "USD", label: "دلار آمریکا" },
  { code: "IRT", label: "تومان ایران" },
  { code: "PKR", label: "روپیه پاکستان" },
  { code: "EUR", label: "یورو" },
];

interface Bank {
  id: string;
  name: string;
  type: BankType;
  currencyCode: string;
  openingBalance: string;
}

const initialBanks: Bank[] = [
  { id: "BNK-01", name: "بانک ملی افغان", type: "دولتی", currencyCode: "AFN", openingBalance: "500000" },
  { id: "BNK-02", name: "بانک عزیزی", type: "خصوصی", currencyCode: "USD", openingBalance: "12000" },
  { id: "BNK-03", name: "بانک اسلامی افغانستان", type: "اسلامی", currencyCode: "AFN", openingBalance: "80000" },
  { id: "BNK-04", name: "بانک کابل", type: "خصوصی", currencyCode: "AFN", openingBalance: "230000" },
];

const emptyForm = {
  name: "",
  type: "دولتی" as BankType,
  currencyCode: currencyOptions[0].code,
  openingBalance: "",
};

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | BankType>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return banks.filter((b) => {
      const matchesFilter = filter === "all" || b.type === filter;
      const matchesQuery = query.trim() === "" || b.name.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [banks, query, filter]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(bank: Bank) {
    setEditingId(bank.id);
    setForm({
      name: bank.name,
      type: bank.type,
      currencyCode: bank.currencyCode,
      openingBalance: bank.openingBalance,
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setBanks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      setBanks((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...form } : b))
      );
    } else {
      const newBank: Bank = {
        id: `BNK-${String(banks.length + 1).padStart(2, "0")}`,
        ...form,
      };
      setBanks((prev) => [newBank, ...prev]);
    }

    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="بانک‌ها"
        description="مدیریت بانک‌ها و حساب‌های افتتاح‌شده"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            بانک جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">همه بانک‌ها</h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی بانک..."
                className="w-full pr-8 sm:w-56"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="دولتی">دولتی</TabsTrigger>
                <TabsTrigger value="خصوصی">خصوصی</TabsTrigger>
                <TabsTrigger value="اسلامی">اسلامی</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام بانک</TableHead>
              <TableHead>نوع بانک</TableHead>
              <TableHead>واحد پولی</TableHead>
              <TableHead>افتتاحیه</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((bank) => {
              const currency = currencyOptions.find((c) => c.code === bank.currencyCode);

              return (
                <TableRow
                  key={bank.id}
                  className="cursor-pointer"
                  onClick={() => openEditDialog(bank)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{bank.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bank.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {currency?.code ?? bank.currencyCode}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {Number(bank.openingBalance).toLocaleString("fa-IR")}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(bank);
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
                          handleDelete(bank.id);
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
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  بانکی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال افزودن / ویرایش بانک */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{editingId ? "ویرایش بانک" : "افزودن بانک جدید"}</DialogTitle>
              <DialogDescription>اطلاعات بانک و حساب افتتاح‌شده را وارد کنید</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* نام بانک */}
              <div className="space-y-2 text-right">
                <Label htmlFor="bank-name">نام بانک</Label>
                <Input
                  id="bank-name"
                  placeholder="مثلاً: بانک ملی افغان"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              {/* نوع بانک و واحد پولی */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="bank-type">نوع بانک</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as BankType }))}
                  >
                    <SelectTrigger id="bank-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="دولتی">دولتی</SelectItem>
                      <SelectItem value="خصوصی">خصوصی</SelectItem>
                      <SelectItem value="اسلامی">اسلامی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="bank-currency">کدام واحد پولی</Label>
                  <Select
                    value={form.currencyCode}
                    onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}
                  >
                    <SelectTrigger id="bank-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* افتتاحیه */}
              <div className="space-y-2 text-right">
                <Label htmlFor="bank-opening">افتتاحیه</Label>
                <Input
                  id="bank-opening"
                  type="number"
                  step="any"
                  dir="ltr"
                  placeholder="مبلغ افتتاحیه"
                  value={form.openingBalance}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, openingBalance: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">
                {editingId ? "ذخیره تغییرات" : "افزودن بانک"}
              </Button>
              <DialogClose render={<Button type="button" variant="outline" />}>
                انصراف
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
