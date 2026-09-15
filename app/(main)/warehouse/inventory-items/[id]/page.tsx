"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Package, Loader2, Calendar, Warehouse, Tag, Coins } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  fetchInventoryItem,
  type InventoryItem,
  type InventoryTransaction,
} from "@/services/inventory-item.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider } from "@/components/client/toast";

export default function InventoryItemDetailPage() {
  return (
    <ToastProvider>
      <InventoryItemDetailContent />
    </ToastProvider>
  );
}

function InventoryItemDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInventoryItem(id);
      setItem(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت جزییات جنس"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <PageHeader title="جزییات جنس" description="در حال بارگذاری..." />
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div>
        <PageHeader title="جزییات جنس" description="خطا" />
        <Card className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">{error || "جنس یافت نشد"}</p>
          <Button variant="outline" size="sm" onClick={load}>
            تلاش مجدد
          </Button>
        </Card>
      </div>
    );
  }

  const quantity = Number(item.quantity) || 0;
  const averageCost = Number(item.averageCost) || 0;
  const totalValue = quantity * averageCost;

  return (
    <div>
      <PageHeader
        title={item.name}
        description={`جزییات جنس "${item.name}"`}
        action={
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowRight data-icon="inline-start" className="h-4 w-4" />
            بازگشت
          </Button>
        }
      />

      {/* اطلاعات جنس */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<Package className="h-4 w-4" />}
          label="نام جنس"
          value={item.name}
        />
        <InfoCard
          icon={<Tag className="h-4 w-4" />}
          label="واحد"
          value={item.unit}
        />
        <InfoCard
          icon={<Warehouse className="h-4 w-4" />}
          label="گدام"
          value={item.warehouse?.name ?? "—"}
        />
        <InfoCard
          icon={<Coins className="h-4 w-4" />}
          label="دسته‌بندی"
          value={item.category?.name ?? "—"}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<Package className="h-4 w-4" />}
          label="موجودی"
          value={`${quantity.toLocaleString("fa-AF")} ${item.unit}`}
        />
        <InfoCard
          icon={<Coins className="h-4 w-4" />}
          label="فی متوسط"
          value={`${averageCost.toLocaleString("fa-AF")} ${item.currency?.code ?? ""}`}
        />
        <InfoCard
          icon={<Coins className="h-4 w-4" />}
          label="ارزش کل"
          value={`${totalValue.toLocaleString("fa-AF")} ${item.currency?.code ?? ""}`}
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="تاریخ ایجاد"
          value={item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-AF") : "—"}
        />
      </div>

      {item.details && (
        <Card className="mb-6 p-4">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">جزییات</p>
          <p className="text-sm text-foreground">{item.details}</p>
        </Card>
      )}

      {/* تراکنش‌ها */}
      <Card className="p-0">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold text-foreground">
            تراکنش‌ها
            <span className="mr-1.5 text-xs font-normal text-muted-foreground">
              ({item.transactions.length.toLocaleString("fa-AF")} مورد)
            </span>
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">نوع</TableHead>
              <TableHead className="text-right">تعداد</TableHead>
              <TableHead className="text-right">مبلغ کل</TableHead>
              <TableHead className="text-right">تاریخ</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {item.transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  تراکنشی ثبت نشده است
                </TableCell>
              </TableRow>
            ) : (
              item.transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} unit={item.unit} />
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </Card>
  );
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  ADJUSTMENT: "تنظیم",
  PURCHASE: "خرید",
  SALE: "فروش",
  RETURN: "برگشت",
  TRANSFER: "انتقال",
};

function TransactionRow({ tx, unit }: { tx: InventoryTransaction; unit: string }) {
  const typeLabel = TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type;
  const quantity = Number(tx.quantity) || 0;
  const totalAmount = Number(tx.totalAmount) || 0;

  return (
    <TableRow>
      <TableCell>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {typeLabel}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground" dir="ltr">
        {quantity.toLocaleString("fa-AF")} {unit}
      </TableCell>
      <TableCell className="text-muted-foreground" dir="ltr">
        {totalAmount.toLocaleString("fa-AF")}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {tx.transactionDate
          ? new Date(tx.transactionDate).toLocaleDateString("fa-AF")
          : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {tx.notes || "—"}
      </TableCell>
    </TableRow>
  );
}
