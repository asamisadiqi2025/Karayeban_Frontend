"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Loader2,
  Calendar,
  Coins,
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
  fetchContracts,
  deleteContract,
  type Contract,
  type ContractStatus,
} from "@/services/contract.service";
import { fetchShops, type Shop } from "@/services/shop.service";
import { fetchTenants, type Tenant } from "@/services/tenant.service";
import { fetchAddedCurrencies, type AddedCurrency } from "@/services/currency.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

export default function ContractsPage() {
  return (
    <ToastProvider>
      <ContractsPageContent />
    </ToastProvider>
  );
}

function ContractsPageContent() {
  const router = useRouter();
  const toast = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [shops, setShops] = useState<Shop[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currencies, setCurrencies] = useState<AddedCurrency[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchContracts();
      setContracts(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت قراردادها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchContracts(),
      fetchShops(),
      fetchTenants(),
      fetchAddedCurrencies(),
    ]).then(([conResult, shopResult, tenantResult, curResult]) => {
      if (cancelled) return;
      if (conResult.status === "fulfilled") {
        setContracts(Array.isArray(conResult.value) ? conResult.value : []);
      } else {
        setError(extractApiErrorMessage(conResult.reason, "خطا در دریافت قراردادها"));
      }
      if (shopResult.status === "fulfilled") setShops(shopResult.value);
      if (tenantResult.status === "fulfilled") setTenants(tenantResult.value);
      if (curResult.status === "fulfilled") setCurrencies(curResult.value);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const shopMap = useMemo(() => {
    const m = new Map<string, string>();
    shops.forEach((s) => m.set(s.id, s.name ?? `دوکان ${s.shopNumber}`));
    return m;
  }, [shops]);

  const tenantMap = useMemo(() => {
    const m = new Map<string, string>();
    tenants.forEach((t) => m.set(t.id, t.fullName));
    return m;
  }, [tenants]);

  const currencyMap = useMemo(() => {
    const m = new Map<string, string>();
    currencies.forEach((c) => m.set(c.id, `${c.name} (${c.code})`));
    return m;
  }, [currencies]);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (query.trim() === "") return true;
      const shopName = shopMap.get(c.shopId) ?? "";
      const tenantName = tenantMap.get(c.tenantId) ?? "";
      return shopName.includes(query) || tenantName.includes(query);
    });
  }, [contracts, query, shopMap, tenantMap]);

  async function handleDelete(contract: Contract) {
    setDeletingId(contract.id);
    try {
      await deleteContract(contract.id);
      setContracts((prev) => prev.filter((c) => c.id !== contract.id));
      toast.success("قرارداد با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف قرارداد ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    try { return new Date(dateStr).toLocaleDateString("fa-AF"); } catch { return dateStr; }
  }

  function statusLabel(status: ContractStatus): string {
    switch (status) {
      case "active": return "فعال";
      case "expired": return "منقضی";
      case "terminated": return "ختم شده";
      case "pending": return "انتظار";
      default: return status;
    }
  }

  function statusVariant(status: ContractStatus): "success" | "danger" | "secondary" | "outline" {
    switch (status) {
      case "active": return "success";
      case "terminated": return "danger";
      case "expired": return "outline";
      case "pending": return "secondary";
      default: return "outline";
    }
  }

  return (
    <div>
      <PageHeader
        title="قراردادها"
        description="مدیریت قراردادهای اجاره"
        action={
          <Button onClick={() => router.push("/contracts/preview")}>
            <Plus data-icon="inline-start" />
            ساخت قرارداد جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه قراردادها
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({filtered.length.toLocaleString("fa-AF")} مورد)
                </span>
              )}
            </h2>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجوی نام دوکان یا مستأجر..."
              className="w-full pr-8 sm:w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right pr-5">دوکان</TableHead>
              <TableHead className="text-right">مستأجر</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-right">تاریخ شروع</TableHead>
              <TableHead className="text-right">تاریخ پایان</TableHead>
              <TableHead className="text-right">کرایه</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}>تلاش مجدد</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  قراردادی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contract) => (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                >
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {shopMap.get(contract.shopId) ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenantMap.get(contract.tenantId) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(contract.status)}>
                      {statusLabel(contract.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(contract.startDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(contract.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                      {contract.rent.toLocaleString("fa-AF")}
                      <span className="text-xs text-muted-foreground">
                        {currencyMap.get(contract.currencyId) ?? ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId === contract.id}
                      onClick={(e) => { e.stopPropagation(); handleDelete(contract); }}>
                      {deletingId === contract.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
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
