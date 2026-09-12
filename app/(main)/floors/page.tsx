"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Layers, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import {
  fetchFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  type Floor,
} from "@/services/floor.service";
import { extractApiErrorMessage } from "@/services/client";
import { fetchMyMarket } from "@/services/market.service";
import { ToastProvider, useToast } from "@/components/client/toast";
import { useAuth } from "@/contexts/auth-context";

const emptyForm = {
  floorNumber: "",
  name: "",
  details: "",
};

export default function FloorsPage() {
  return (
    <ToastProvider>
      <FloorsPageContent />
    </ToastProvider>
  );
}

function FloorsPageContent() {
  const toast = useToast();
  const { user } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFloors();
      setFloors(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت طبقات"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchFloors()
      .then((result) => {
        if (cancelled) return;
        setFloors(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت طبقات"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return floors.filter((f) => {
      const matchesQuery =
        query.trim() === "" ||
        f.name.includes(query) ||
        String(f.floorNumber).includes(query);
      return matchesQuery;
    });
  }, [floors, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(floor: Floor) {
    setEditingId(floor.id);
    setForm({
      floorNumber: String(floor.floorNumber),
      name: floor.name,
      details: floor.details,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(floor: Floor) {
    setDeletingId(floor.id);
    try {
      await deleteFloor(floor.id);
      setFloors((prev) => prev.filter((f) => f.id !== floor.id));
      toast.success("طبقه با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف طبقه ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const floorNumber = Number(form.floorNumber);
    if (!Number.isInteger(floorNumber)) {
      setFormError("شماره طبقه باید عدد صحیح باشد");
      return;
    }
    if (!form.name.trim()) {
      setFormError("نام طبقه الزامی است");
      return;
    }

    let marketId = user?.marketId;
    if (!marketId) {
      if (!editingId) {
        try {
          const market = await fetchMyMarket();
          marketId = market.id;
        } catch {
          setFormError("شناسه مارکت یافت نشد");
          return;
        }
      }
    }

    const basePayload = {
      floorNumber,
      name: form.name.trim(),
      details: form.details.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateFloor(editingId, basePayload);
        setFloors((prev) =>
          prev.map((f) => (f.id === editingId ? updated : f)),
        );
        toast.success("طبقه با موفقیت بروزرسانی شد");
      } else {
        const created = await createFloor({
          ...basePayload,
          marketId: marketId!,
        });
        setFloors((prev) => [created, ...prev]);
        toast.success("طبقه جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت طبقه ناموفق بود"));
    } finally {
      setSaving(false);
    }
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
            <h2 className="text-sm font-semibold text-foreground">
              همه طبقات
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({filtered.length.toLocaleString("fa-AF")} مورد)
                </span>
              )}
            </h2>
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
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شماره طبقه</TableHead>
              <TableHead>نام طبقه</TableHead>
              <TableHead>جزییات</TableHead>
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
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  طبقه‌ای یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((floor) => (
                <TableRow
                  key={floor.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(floor)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground" dir="ltr">
                        {floor.floorNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {floor.name}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-muted-foreground">
                    {floor.details || "—"}
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
                        disabled={deletingId === floor.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(floor);
                        }}
                      >
                        {deletingId === floor.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="floor-number">شماره طبقه</Label>
                  <Input
                    id="floor-number"
                    type="number"
                    step="1"
                    min="0"
                    dir="ltr"
                    placeholder="مثلاً: 0"
                    value={form.floorNumber}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        floorNumber: e.target.value,
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

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    انصراف
                  </Button>
                }
              />

              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                )}
                {saving
                  ? "در حال ذخیره..."
                  : editingId
                    ? "ذخیره تغییرات"
                    : "افزودن طبقه"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
