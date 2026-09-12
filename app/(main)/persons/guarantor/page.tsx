"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, UserCheck, Loader2 } from "lucide-react";

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
  fetchGuarantors,
  createGuarantor,
  updateGuarantor,
  deleteGuarantor,
  type Guarantor,
} from "@/services/guarantor.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  name: "",
  contact: "",
  idNumber: "",
  details: "",
};

export default function GuarantorsPage() {
  return (
    <ToastProvider>
      <GuarantorsPageContent />
    </ToastProvider>
  );
}

function GuarantorsPageContent() {
  const toast = useToast();
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
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
      const result = await fetchGuarantors();
      setGuarantors(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت ضامن‌ها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchGuarantors()
      .then((result) => {
        if (cancelled) return;
        setGuarantors(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت ضامن‌ها"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return guarantors.filter((g) => {
      const matchesQuery =
        query.trim() === "" ||
        g.name.includes(query) ||
        g.contact.includes(query) ||
        g.idNumber.includes(query);
      return matchesQuery;
    });
  }, [guarantors, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(guarantor: Guarantor) {
    setEditingId(guarantor.id);
    setForm({
      name: guarantor.name,
      contact: guarantor.contact,
      idNumber: guarantor.idNumber,
      details: guarantor.details,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(guarantor: Guarantor) {
    setDeletingId(guarantor.id);
    try {
      await deleteGuarantor(guarantor.id);
      setGuarantors((prev) => prev.filter((g) => g.id !== guarantor.id));
      toast.success("ضامن با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف ضامن ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("نام ضامن الزامی است");
      return;
    }
    if (!form.contact.trim()) {
      setFormError("شماره تماس الزامی است");
      return;
    }
    if (!form.idNumber.trim()) {
      setFormError("شماره تذکره الزامی است");
      return;
    }

    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      idNumber: form.idNumber.trim(),
      details: form.details.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateGuarantor(editingId, payload);
        setGuarantors((prev) =>
          prev.map((g) => (g.id === editingId ? updated : g)),
        );
        toast.success("ضامن با موفقیت بروزرسانی شد");
      } else {
        const created = await createGuarantor(payload);
        setGuarantors((prev) => [created, ...prev]);
        toast.success("ضامن جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت ضامن ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="ضامن‌ها"
        description="مدیریت اطلاعات ضامن‌های دکان‌داران"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن ضامن جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه ضامن‌ها
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
                placeholder="جستجوی نام، تماس یا تذکره..."
                className="w-full pr-8 sm:w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader >
            <TableRow className="">
              <TableHead className="text-right pr-5">نام ضامن</TableHead>
              <TableHead className="text-right">شماره تماس</TableHead>
              <TableHead className="text-right">شماره تذکره</TableHead>
              <TableHead className="text-right">توضیحات</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
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
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  ضامنی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((guarantor) => (
                <TableRow
                  key={guarantor.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(guarantor)}
                >
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {guarantor.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    dir="ltr"
                    className="text-right text-muted-foreground"
                  >
                    {guarantor.contact}
                  </TableCell>
                  <TableCell
                    dir="ltr"
                    className="text-right text-muted-foreground"
                  >
                    {guarantor.idNumber}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-right text-muted-foreground">
                    {guarantor.details || "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(guarantor);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === guarantor.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(guarantor);
                        }}
                      >
                        {deletingId === guarantor.id ? (
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

      {/* مودال افزودن / ویرایش ضامن */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>
                {editingId ? "ویرایش ضامن" : "افزودن ضامن جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات ضامن را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2 text-right">
                <Label htmlFor="guarantor-name">نام ضامن</Label>
                <Input
                  id="guarantor-name"
                  placeholder="مثلاً: احمد ولی"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="guarantor-contact">شماره تماس</Label>
                  <Input
                    id="guarantor-contact"
                    type="tel"
                    dir="ltr"
                    placeholder="07XXXXXXXX"
                    value={form.contact}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contact: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="guarantor-idNumber">شماره تذکره</Label>
                  <Input
                    id="guarantor-idNumber"
                    dir="ltr"
                    placeholder="مثلاً: TZ-001"
                    value={form.idNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idNumber: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="guarantor-details">توضیحات</Label>
                <Textarea
                  id="guarantor-details"
                  rows={3}
                  placeholder="مثلاً: همسایه دوکاندار"
                  value={form.details}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, details: e.target.value }))
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
                    : "افزودن ضامن"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
