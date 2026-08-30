"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Store, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

// TODO(اتصال بک‌اند): از صفحه‌ی تنظیمات طبقات واقعی پروژه بخوانید.
interface Floor {
  id: string;
  name: string;
}

const floors: Floor[] = [
  { id: "basement", name: "زیرزمین" },
  { id: "ground", name: "همکف" },
  { id: "first", name: "طبقه اول" },
  { id: "second", name: "طبقه دوم" },
  { id: "third", name: "طبقه سوم" },
];

function getFloor(id: string): Floor | undefined {
  return floors.find((f) => f.id === id);
}

type PropertyType = "shop" | "unit" | "stall";
type PropertyStatus = "vacant" | "under_repair" | "rented";

const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  shop: "دوکان",
  unit: "واحد",
  stall: "بساط",
};

const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  vacant: "خالی",
  under_repair: "در حال تعمیر",
  rented: "کرایه داده شده",
};

interface Property {
  id: string;
  shopNumber: string;
  floorId: string;
  area: string;
  location: string;
  type: PropertyType;
  status: PropertyStatus;
  details: string;
}

const initialProperties: Property[] = [
  {
    id: "PRP-01",
    shopNumber: "14",
    floorId: "ground",
    area: "24",
    location: "ردیف اول، نزدیک دروازه ورودی",
    type: "shop",
    status: "rented",
    details: "دارای دو کرکره برقی",
  },
  {
    id: "PRP-02",
    shopNumber: "21",
    floorId: "first",
    area: "12",
    location: "کنار پیلر شماره ۳",
    type: "stall",
    status: "vacant",
    details: "",
  },
  {
    id: "PRP-03",
    shopNumber: "33",
    floorId: "second",
    area: "40",
    location: "انتهای راهرو",
    type: "unit",
    status: "under_repair",
    details: "تعویض سیم‌کشی برق در حال انجام است",
  },
];

const emptyForm = {
  shopNumber: "",
  floorId: "",
  area: "",
  location: "",
  type: "shop" as PropertyType,
  status: "vacant" as PropertyStatus,
  details: "",
};

function statusBadgeProps(status: PropertyStatus): {
  variant: "success" | "secondary" | "outline";
  className?: string;
} {
  switch (status) {
    case "vacant":
      return { variant: "success" };
    case "rented":
      return { variant: "secondary" };
    case "under_repair":
      return {
        variant: "outline",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      };
  }
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | PropertyStatus>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchesFilter = filter === "all" || p.status === filter;
      const matchesQuery =
        query.trim() === "" ||
        p.shopNumber.includes(query) ||
        p.location.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [properties, query, filter]);

  function handleChange<K extends keyof typeof emptyForm>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(property: Property) {
    setEditingId(property.id);
    setForm({
      shopNumber: property.shopNumber,
      floorId: property.floorId,
      area: property.area,
      location: property.location,
      type: property.type,
      status: property.status,
      details: property.details,
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: اتصال به بک‌اند NestJS — POST/PATCH /properties
    await new Promise((resolve) => setTimeout(resolve, 500));

    const normalized: Property = {
      id: editingId ?? `PRP-${String(properties.length + 1).padStart(2, "0")}`,
      ...form,
    };

    if (editingId) {
      setProperties((prev) =>
        prev.map((p) => (p.id === editingId ? normalized : p)),
      );
    } else {
      setProperties((prev) => [normalized, ...prev]);
    }

    setLoading(false);
    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="دوکان‌ها و املاک"
        description="مدیریت دوکان‌ها، واحدها و بساط‌های مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن دوکان جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه دوکان‌ها
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی شماره دوکان یا موقعیت..."
                className="w-full pr-8 sm:w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="vacant">خالی</TabsTrigger>
                <TabsTrigger value="rented">کرایه داده شده</TabsTrigger>
                <TabsTrigger value="under_repair">در حال تعمیر</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شماره دوکان</TableHead>
              <TableHead>طبقه</TableHead>
              <TableHead>نوع</TableHead>
              <TableHead>مساحت</TableHead>
              <TableHead>موقعیت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((property) => {
              const badge = statusBadgeProps(property.status);
              return (
                <TableRow
                  key={property.id}
                  className="cursor-pointer"
                  onClick={() => openEditDialog(property)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span dir="ltr" className="font-medium text-foreground">
                        {property.shopNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getFloor(property.floorId)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {PROPERTY_TYPE_LABEL[property.type]}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {property.area ? `${property.area} م²` : "—"}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {property.location || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant} className={badge.className}>
                      {PROPERTY_STATUS_LABEL[property.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(property);
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
                          handleDelete(property.id);
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
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  دوکانی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال ایجاد دوکان یا ملک / ویرایش */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش دوکان" : "ایجاد دوکان یا ملک"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات دوکان، واحد یا بساط را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* شماره دوکان و طبقه */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="shop-number">شماره دوکان</Label>
                <Input
                  id="shop-number"
                  dir="ltr"
                  placeholder="مثلاً: 14"
                  value={form.shopNumber}
                  onChange={handleChange("shopNumber")}
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="property-floor">طبقه</Label>
                <Select
                  value={form.floorId}
                  onValueChange={(v) => setForm((f) => ({ ...f, floorId: v ?? "" }))}
                >
                  <SelectTrigger id="property-floor" className="w-full">
                    <SelectValue placeholder="انتخاب طبقه" />
                  </SelectTrigger>

                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* مساحت و نوع */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="property-area">مساحت</Label>

                <div className="relative">
                  <Input
                    id="property-area"
                    type="number"
                    step="any"
                    dir="ltr"
                    placeholder="0"
                    className="pl-10"
                    value={form.area}
                    onChange={handleChange("area")}
                    required
                  />

                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    م²
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="property-type">نوع دوکان یا ملک</Label>

                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      type: v as PropertyType,
                    }))
                  }
                >
                  <SelectTrigger id="property-type" className="w-full">
                    <SelectValue placeholder="انتخاب نوع" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="shop">دوکان</SelectItem>
                    <SelectItem value="unit">واحد</SelectItem>
                    <SelectItem value="stall">بساط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* موقعیت */}
            <div className="space-y-2 text-right">
              <Label htmlFor="property-location">موقعیت</Label>

              <Input
                id="property-location"
                placeholder="مثلاً: ردیف اول، نزدیک دروازه ورودی"
                value={form.location}
                onChange={handleChange("location")}
              />
            </div>

            {/* وضعیت */}
            <div className="space-y-2 text-right">
              <Label htmlFor="property-status">وضعیت</Label>

              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as PropertyStatus,
                  }))
                }
              >
                <SelectTrigger id="property-status" className="w-full">
                  <SelectValue placeholder="انتخاب وضعیت" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="vacant">خالی</SelectItem>
                  <SelectItem value="under_repair">در حال تعمیر</SelectItem>
                  <SelectItem value="rented">کرایه داده شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* جزییات */}
            <div className="space-y-2 text-right">
              <Label htmlFor="property-details">جزییات</Label>

              <Textarea
                id="property-details"
                placeholder="توضیحات تکمیلی درباره دوکان یا ملک..."
                rows={4}
                value={form.details}
                onChange={handleChange("details")}
              />
            </div>

            {/* دکمه‌ها */}
            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose
                render={
                  <Button variant="outline" type="button">
                    انصراف
                  </Button>
                }
              />

              <Button type="submit" disabled={loading}>
                {loading && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}

                {loading
                  ? "در حال ذخیره..."
                  : editingId
                    ? "ذخیره تغییرات"
                    : "ثبت دوکان"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
