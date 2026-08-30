"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Gauge, Loader2 } from "lucide-react";

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

type MeterStatus = "active" | "inactive";

interface Meter {
  id: string;
  serialNumber: string;
  shopCode: string;
  status: MeterStatus;
  previousReading: string;
  previousReadingDate: string;
  location: string;
}

const initialMeters: Meter[] = [
  {
    id: "MTR-01",
    serialNumber: "EM-10432",
    shopCode: "SHOP-014",
    status: "active",
    previousReading: "1284.5",
    previousReadingDate: "1403-05-01",
    location: "جلوی دکان، راهرو طبقه دوم",
  },
  {
    id: "MTR-02",
    serialNumber: "EM-10488",
    shopCode: "SHOP-021",
    status: "active",
    previousReading: "932",
    previousReadingDate: "1403-05-01",
    location: "کنار پیلر شماره ۳",
  },
  {
    id: "MTR-03",
    serialNumber: "EM-10501",
    shopCode: "SHOP-033",
    status: "inactive",
    previousReading: "0",
    previousReadingDate: "1403-04-10",
    location: "دکان تعطیل، طبقه همکف",
  },
];

const emptyForm = {
  serialNumber: "",
  shopCode: "",
  status: "active" as MeterStatus,
  previousReading: "",
  previousReadingDate: "",
  location: "",
};

export default function MetersPage() {
  const [meters, setMeters] = useState<Meter[]>(initialMeters);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | MeterStatus>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return meters.filter((m) => {
      const matchesFilter = filter === "all" || m.status === filter;
      const matchesQuery =
        query.trim() === "" ||
        m.serialNumber.includes(query) ||
        m.shopCode.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [meters, query, filter]);

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

  function openEditDialog(meter: Meter) {
    setEditingId(meter.id);
    setForm({
      serialNumber: meter.serialNumber,
      shopCode: meter.shopCode,
      status: meter.status,
      previousReading: meter.previousReading,
      previousReadingDate: meter.previousReadingDate,
      location: meter.location,
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setMeters((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: اتصال به بک‌اند NestJS — POST/PATCH /meters
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (editingId) {
      setMeters((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, ...form } : m))
      );
    } else {
      const newMeter: Meter = {
        id: `MTR-${String(meters.length + 1).padStart(2, "0")}`,
        ...form,
      };
      setMeters((prev) => [newMeter, ...prev]);
    }

    setLoading(false);
    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="میترهای برق"
        description="مدیریت میترهای برق دکان‌های مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            میتر جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">همه میترها</h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی شماره سریال یا کد دکان..."
                className="w-full pr-8 sm:w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="active">فعال</TabsTrigger>
                <TabsTrigger value="inactive">غیرفعال</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شماره سریال</TableHead>
              <TableHead>کد دکان</TableHead>
              <TableHead>درجه قبلی</TableHead>
              <TableHead>تاریخ خواندن قبلی</TableHead>
              <TableHead>موقعیت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((meter) => (
              <TableRow
                key={meter.id}
                className="cursor-pointer"
                onClick={() => openEditDialog(meter)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span dir="ltr" className="font-medium text-foreground">
                      {meter.serialNumber}
                    </span>
                  </div>
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  {meter.shopCode}
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  {meter.previousReading}
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  {meter.previousReadingDate}
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {meter.location || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={meter.status === "active" ? "success" : "secondary"}>
                    {meter.status === "active" ? "فعال" : "غیرفعال"}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(meter);
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
                        handleDelete(meter.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  میتری یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال افزودن / ویرایش میتر */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش میتر" : "افزودن میتر جدید"}</DialogTitle>
            <DialogDescription>
              اطلاعات میتر برق و دکان مربوطه را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serial-number">شماره سریال</Label>
                <Input
                  id="serial-number"
                  placeholder="مثلاً: EM-10432"
                  dir="ltr"
                  value={form.serialNumber}
                  onChange={handleChange("serialNumber")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-code">کد دکان</Label>
                <Input
                  id="shop-code"
                  placeholder="مثلاً: SHOP-014"
                  dir="ltr"
                  value={form.shopCode}
                  onChange={handleChange("shopCode")}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meter-status">وضعیت</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as MeterStatus }))
                  }
                >
                  <SelectTrigger id="meter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous-reading">درجه قبلی</Label>
                <Input
                  id="previous-reading"
                  type="number"
                  step="any"
                  dir="ltr"
                  placeholder="0"
                  value={form.previousReading}
                  onChange={handleChange("previousReading")}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="previous-reading-date">تاریخ خواندن قبلی</Label>
                <Input
                  id="previous-reading-date"
                  type="date"
                  dir="ltr"
                  value={form.previousReadingDate}
                  onChange={handleChange("previousReadingDate")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meter-location">موقعیت کنتور</Label>
                <Input
                  id="meter-location"
                  placeholder="مثلاً: جلوی دکان، راهرو طبقه دوم"
                  value={form.location}
                  onChange={handleChange("location")}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {loading ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "افزودن میتر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
