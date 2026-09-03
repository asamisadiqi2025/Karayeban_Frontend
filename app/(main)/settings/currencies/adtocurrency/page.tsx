"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Loader2,
  Plus,
  CircleAlert,
  Check,
  Banknote,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";

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
  fetchCurrencyCatalog,
  fetchAddedCurrencies,
  addCurrencyToSystem,
  type CurrencyCatalogItem,
} from "@/services/currency.service";
import { fetchMyMarket } from "@/services/market.service";
import { extractApiErrorMessage } from "@/services/client";

export default function AdToCurrencyPage() {
  const [items, setItems] = useState<CurrencyCatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingCode, setAddingCode] = useState<string | null>(null);
  const [addedCodes, setAddedCodes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [marketId, setMarketId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsCount = items.length;
  const totalPages = Math.max(1, Math.ceil(resultsCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  // Fetch already-added currencies on mount
  const loadAdded = useCallback(async () => {
    try {
      const data = await fetchAddedCurrencies();
      const list = Array.isArray(data) ? data : [];
      setAddedCodes(list.map((c) => c.code));
    } catch {
      setAddedCodes([]);
    }
  }, []);

  useEffect(() => {
    loadAdded();
  }, [loadAdded]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const loadCatalog = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCurrencyCatalog(search);
      setItems(data);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت اطلاعات واحدهای پولی"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadCatalog(debouncedQuery);
  }, [debouncedQuery, loadCatalog]);

  function showFeedback(message: string, isError = false) {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);
  }

  async function handleAdd(item: CurrencyCatalogItem) {
    setAddingCode(item.code);
    try {
      await addCurrencyToSystem(item.code);
      await loadAdded();
      showFeedback(`واحد پولی ${item.name} با موفقیت اضافه شد`);
    } catch (err) {
      const msg = extractApiErrorMessage(err, "امکان افزودن این واحد پولی وجود نداشت");
      if (msg.includes("قبلاً")) {
        setAddedCodes((prev) => [...prev, item.code]);
      }
      showFeedback(msg, true);
    } finally {
      setAddingCode(null);
    }
  }

  const isAdded = (code: string) => addedCodes.includes(code);

  return (
    <div>
      <PageHeader
        title="دالر به واحد پولی"
        description="کاتالوگ واحدهای پولی جهان (ISO 4217) — جستجو کنید و به سیستم اضافه کنید"
      />

      <div className="space-y-4">
        {feedback && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            {feedback}
          </div>
        )}

        <Card className="p-0">
          {/* Header bar */}
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                همه واحدهای پولی جهان
                {!loading && (
                  <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                    ({resultsCount.toLocaleString("fa-AF")} مورد)
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
                <TableHead className="text-right">اعشار</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-sm">در حال بارگذاری...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <CircleAlert className="h-8 w-8 text-destructive" />
                      <p className="text-sm text-muted-foreground">{error}</p>
                      <Button variant="outline" size="sm" onClick={() => loadCatalog(debouncedQuery)}>
                        تلاش مجدد
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    واحد پولی‌ای یافت نشد
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    صفحه‌ای یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const alreadyAdded = isAdded(item.code);
                  return (
                    <TableRow key={item.code} className="hover:bg-muted/40">
                      <TableCell>
                        <span className="inline-flex min-w-[52px] items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                          {item.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.symbol ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.decimalDigits}
                      </TableCell>
                      <TableCell>
                        {alreadyAdded ? (
                          <Badge variant="success">اضافه شده</Badge>
                        ) : (
                          <Badge variant="secondary">در کاتالوگ</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          variant={alreadyAdded ? "secondary" : "default"}
                          size="sm"
                          disabled={alreadyAdded || addingCode === item.code}
                          onClick={() => handleAdd(item)}
                        >
                          {addingCode === item.code ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : alreadyAdded ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          {alreadyAdded ? "اضافه شده" : "افزودن"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination footer */}
          {!loading && !error && items.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                نشان دادن{" "}
                <span className="font-medium text-foreground">
                  {startIndex + 1}
                  {"–"}
                  {Math.min(startIndex + pageSize, resultsCount)}
                </span>{" "}
                از <span className="font-medium text-foreground">{resultsCount.toLocaleString("fa-AF")}</span>{" "}
                مورد — صفحه {currentPage.toLocaleString("fa-AF")} از{" "}
                {totalPages.toLocaleString("fa-AF")}
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>

                <span className="mx-1 min-w-[60px] text-center text-xs font-medium text-foreground">
                  {currentPage.toLocaleString("fa-AF")} / {totalPages.toLocaleString("fa-AF")}
                </span>

                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
