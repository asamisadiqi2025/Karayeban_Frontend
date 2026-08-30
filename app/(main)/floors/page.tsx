"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Layers } from "lucide-react";

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

type FloorStatus = "active" | "inactive";

interface Floor {
  id: string;
  number: string;
  name: string;
  status: FloorStatus;
  details: string;
}

const initialFloors: Floor[] = [
  {
    id: "FLR-01",
    number: "0",
    name: "همکف",
    status: "active",
    details: "طبقه همکف، ورودی اصلی مارکت",
  },
  {
    id: "FLR-02",
    number: "1",
    name: "طبقه اول",
    status: "active",
    details: "دکان‌های پوشاک و لوازم خانگی",
  },
  {
    id: "FLR-03",
    number: "2",
    name: "طبقه دوم",
    status: "active",
    details: "",
  },
  {
    id: "FLR-04",
    number: "3",
    name: "طبقه سوم",
    status: "inactive",
    details: "در حال بازسازی",
  },
];

const emptyForm = {
  number: "",
  name: "",
  status: "active" as FloorStatus,
  details: "",
};

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>(initialFloors);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | FloorStatus>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return floors.filter((f) => {
      const matchesFilter = filter === "all" || f.status === filter;
      const matchesQuery =
        query.trim() === "" ||
        f.name.includes(query) ||
        f.number.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [floors, query, filter]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(floor: Floor) {
    setEditingId(floor.id);
    setForm({
      number: floor.number,
      name: floor.name,
      status: floor.status,
      details: floor.details,
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setFloors((prev) => prev.filter((f) => f.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      setFloors((prev) =>
        prev.map((f) => (f.id === editingId ? { ...f, ...form } : f)),
      );
    } else {
      const newFloor: Floor = {
        id: `FLR-${String(floors.length + 1).padStart(2, "0")}`,
        ...form,
      };
      setFloors((prev) => [newFloor, ...prev]);
    }

    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="طبقات"
        description="مدیریت طبقات مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            طبقه جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">همه طبقات</h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی طبقه..."
                className="w-full pr-8 sm:w-56"
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
                <TabsTrigger value="active">فعال</TabsTrigger>
                <TabsTrigger value="inactive">غیرفعال</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شماره طبقه</TableHead>
              <TableHead>نام طبقه</TableHead>
              <TableHead>جزییات</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((floor) => (
              <TableRow
                key={floor.id}
                className="cursor-pointer"
                onClick={() => openEditDialog(floor)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">
                      {floor.number}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {floor.name}
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-muted-foreground">
                  {floor.details || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      floor.status === "active" ? "success" : "secondary"
                    }
                  >
                    {floor.status === "active" ? "فعال" : "غیرفعال"}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(floor);
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
                        handleDelete(floor.id);
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
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  طبقه‌ای یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال افزودن / ویرایش طبقه */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader className="text-right">
        <DialogTitle>
          {editingId ? "ویرایش طبقه" : "افزودن طبقه جدید"}
        </DialogTitle>
        <DialogDescription>
          اطلاعات طبقه را وارد کنید
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* شماره طبقه و نام طبقه */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2 text-right">
            <Label htmlFor="floor-number">شماره طبقه</Label>
            <Input
              id="floor-number"
              dir="ltr"
              placeholder="مثلاً: 0"
              value={form.number}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  number: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2 text-right">
            <Label htmlFor="floor-name">نام طبقه</Label>
            <Input
              id="floor-name"
              placeholder="مثلاً: همکف"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                }))
              }
              required
            />
          </div>
        </div>

        {/* وضعیت */}
        <div className="space-y-2 text-right">
          <Label htmlFor="floor-status">وضعیت</Label>

          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                status: v as FloorStatus,
              }))
            }
          >
            <SelectTrigger id="floor-status" className="w-full">
              <SelectValue placeholder="انتخاب وضعیت" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="inactive">غیرفعال</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* جزییات */}
        <div className="space-y-2 text-right">
          <Label htmlFor="floor-details">جزییات</Label>

          <Textarea
            id="floor-details"
            rows={4}
            placeholder="توضیحات تکمیلی درباره این طبقه"
            value={form.details}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                details: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <DialogClose
          render={
            <Button type="button" variant="outline">
              انصراف
            </Button>
          }
        />

        <Button type="submit">
          {editingId ? "ذخیره تغییرات" : "افزودن طبقه"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
    </div>
  );
}
