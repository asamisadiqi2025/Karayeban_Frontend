"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Trash2, Coins, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  fetchAddedCurrencies,
  deleteCurrencyFromSystem,
  type AddedCurrency,
} from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAddedCurrencies();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت واحدهای پولی"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`آیا از حذف واحد پولی «${name}» اطمینان دارید؟`)) return;

    setDeletingId(id);
    try {
      await deleteCurrencyFromSystem(id);
      await load();
    } catch (err) {
      alert(extractApiErrorMessage(err, "حذف واحد پولی ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = currencies.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="واحدهای پولی"
        description="مدیریت واحدهای پولی سیستم"
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              واحدهای پولی اضافه شده
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({filtered.length.toLocaleString("fa-AF")} مورد)
                </span>
              )}
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس کد یا نام..."
              className="w-full pr-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">کد</TableHead>
              <TableHead className="text-right">نام واحد پولی</TableHead>
              <TableHead className="text-right">سیمبول</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}>
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {query ? "واحد پولی‌ای یافت نشد" : "هنوز واحد پولی اضافه نشده است"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((currency) => (
                <TableRow key={currency.id} className="hover:bg-muted/40">
                  <TableCell>
                    <span className="inline-flex min-w-[52px] items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                      {currency.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{currency.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {currency.symbol ?? "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId === currency.id}
                      onClick={() => handleDelete(currency.id, currency.name)}
                    >
                      {deletingId === currency.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
