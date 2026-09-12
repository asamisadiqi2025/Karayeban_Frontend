"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Landmark, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  fetchShareholders,
  createShareholder,
  updateShareholder,
  deleteShareholder,
  type Shareholder,
} from "@/services/shareholder.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const emptyForm = {
  fullName: "",
  contact: "",
  idNumber: "",
};

export default function OwnersPage() {
  return (
    <ToastProvider>
      <OwnersPageContent />
    </ToastProvider>
  );
}

function OwnersPageContent() {
  const toast = useToast();
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
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
      const result = await fetchShareholders();
      setShareholders(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت مالکین"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchShareholders()
      .then((result) => {
        if (cancelled) return;
        setShareholders(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت مالکین"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return shareholders.filter((s) => {
      const matchesQuery =
        query.trim() === "" ||
        s.fullName.includes(query) ||
        s.contact.includes(query) ||
        s.idNumber.includes(query);
      return matchesQuery;
    });
  }, [shareholders, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(shareholder: Shareholder) {
    setEditingId(shareholder.id);
    setForm({
      fullName: shareholder.fullName,
      contact: shareholder.contact,
      idNumber: shareholder.idNumber,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(shareholder: Shareholder) {
    setDeletingId(shareholder.id);
    try {
      await deleteShareholder(shareholder.id);
      setShareholders((prev) => prev.filter((s) => s.id !== shareholder.id));
      toast.success("مالک با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف مالک ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.fullName.trim()) {
      setFormError("نام مالک الزامی است");
      return;
    }
    if (!form.contact.trim()) {
      setFormError("شماره تماس الزامی است");
      return;
    }
    if (!form.idNumber.trim()) {
      setFormError("شماره شناسایی الزامی است");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      contact: form.contact.trim(),
      idNumber: form.idNumber.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateShareholder(editingId, payload);
        setShareholders((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s)),
        );
        toast.success("مالک با موفقیت بروزرسانی شد");
      } else {
        const created = await createShareholder(payload);
        setShareholders((prev) => [created, ...prev]);
        toast.success("مالک جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت مالک ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="مالکین"
        description="مدیریت اطلاعات مالکین"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن مالک جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه مالکین
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
                placeholder="جستجوی نام، تماس یا شماره شناسایی..."
                className="w-full pr-8 sm:w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right pr-5">نام مالک</TableHead>
              <TableHead className="text-right">شماره تماس</TableHead>
              <TableHead className="text-right">شماره شناسایی</TableHead>
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
                  مالکی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((shareholder) => (
                <TableRow
                  key={shareholder.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(shareholder)}
                >
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {shareholder.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    dir="ltr"
                    className="text-right text-muted-foreground"
                  >
                    {shareholder.contact}
                  </TableCell>
                  <TableCell
                    dir="ltr"
                    className="text-right text-muted-foreground"
                  >
                    {shareholder.idNumber}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(shareholder);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === shareholder.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(shareholder);
                        }}
                      >
                        {deletingId === shareholder.id ? (
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

      {/* مودال افزودن / ویرایش مالک */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>
                {editingId ? "ویرایش مالک" : "افزودن مالک جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات مالک را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2 text-right">
                <Label htmlFor="shareholder-fullName">نام مالک</Label>
                <Input
                  id="shareholder-fullName"
                  placeholder="مثلاً: حاجی سهراب"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="shareholder-contact">شماره تماس</Label>
                  <Input
                    id="shareholder-contact"
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
                  <Label htmlFor="shareholder-idNumber">شماره شناسایی</Label>
                  <Input
                    id="shareholder-idNumber"
                    dir="ltr"
                    placeholder="مثلاً: SH-0101"
                    value={form.idNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idNumber: e.target.value }))
                    }
                    required
                  />
                </div>
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
                    : "افزودن مالک"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
