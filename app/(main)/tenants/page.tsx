"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Users, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import {
  fetchTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  type Tenant,
  type TenantGender,
} from "@/services/tenant.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

const GENDER_LABEL: Record<TenantGender, string> = {
  male: "مرد",
  female: "زن",
};

const emptyForm = {
  fullName: "",
  fatherName: "",
  idNumber: "",
  contact: "",
  gender: "male" as TenantGender,
  details: "",
};

export default function TenantsPage() {
  return (
    <ToastProvider>
      <TenantsPageContent />
    </ToastProvider>
  );
}

function TenantsPageContent() {
  const toast = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
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
      const result = await fetchTenants();
      setTenants(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت مستأجرین"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTenants()
      .then((result) => {
        if (cancelled) return;
        setTenants(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت مستأجرین"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      const matchesQuery =
        query.trim() === "" ||
        t.fullName.includes(query) ||
        t.fatherName.includes(query) ||
        t.idNumber.includes(query) ||
        t.contact.includes(query);
      return matchesQuery;
    });
  }, [tenants, query]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(tenant: Tenant) {
    setEditingId(tenant.id);
    setForm({
      fullName: tenant.fullName,
      fatherName: tenant.fatherName,
      idNumber: tenant.idNumber,
      contact: tenant.contact,
      gender: tenant.gender,
      details: tenant.details,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(tenant: Tenant) {
    setDeletingId(tenant.id);
    try {
      await deleteTenant(tenant.id);
      setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
      toast.success("مستأجر با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف مستأجر ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.fullName.trim()) {
      setFormError("نام کامل مستأجر الزامی است");
      return;
    }
    if (!form.fatherName.trim()) {
      setFormError("نام پدر الزامی است");
      return;
    }
    if (!form.idNumber.trim()) {
      setFormError("شماره تذکره الزامی است");
      return;
    }
    if (!form.contact.trim()) {
      setFormError("شماره تماس الزامی است");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      fatherName: form.fatherName.trim(),
      idNumber: form.idNumber.trim(),
      contact: form.contact.trim(),
      gender: form.gender,
      details: form.details.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateTenant(editingId, payload);
        setTenants((prev) =>
          prev.map((t) => (t.id === editingId ? updated : t)),
        );
        toast.success("مستأجر با موفقیت بروزرسانی شد");
      } else {
        const created = await createTenant(payload);
        setTenants((prev) => [created, ...prev]);
        toast.success("مستأجر جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت مستأجر ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="مستأجرین"
        description="مدیریت مستأجرین مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن مستأجر جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              همه مستأجرین
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
                placeholder="جستجوی نام، تذکره یا تماس..."
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
              <TableHead className="text-right">نام کامل</TableHead>
              <TableHead className="text-right">ولد</TableHead>
              <TableHead className="text-right">شماره تذکره</TableHead>
              <TableHead className="text-right">شماره تماس</TableHead>
              <TableHead className="text-right">جنسیت</TableHead>
              <TableHead className="text-right">توضیحات</TableHead>
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
                    <Button variant="outline" size="sm" onClick={load}>
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  مستأجری یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => openEditDialog(tenant)}
                >
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {tenant.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {tenant.fatherName}
                  </TableCell>
                  <TableCell
                    dir="ltr"
                    className="text-right text-muted-foreground"
                  >
                    {tenant.idNumber}
                  </TableCell>
                  <TableCell
                    dir="ltr"
                    className="text-right text-muted-foreground"
                  >
                    {tenant.contact}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {GENDER_LABEL[tenant.gender]}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-right text-muted-foreground">
                    {tenant.details || "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(tenant);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === tenant.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tenant);
                        }}
                      >
                        {deletingId === tenant.id ? (
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

      {/* مودال افزودن / ویرایش مستأجر */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle className="text-right">
                {editingId ? "ویرایش مستأجر" : "افزودن مستأجر جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات مستأجر را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="tenant-fullName">نام کامل</Label>
                  <Input
                    id="tenant-fullName"
                    placeholder="مثلاً: کریم داد"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="tenant-fatherName">ولد</Label>
                  <Input
                    id="tenant-fatherName"
                    placeholder="مثلاً: رحیم داد"
                    value={form.fatherName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fatherName: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="tenant-idNumber">شماره تذکره</Label>
                  <Input
                    id="tenant-idNumber"
                    dir="ltr"
                    placeholder="مثلاً: TN-0233101"
                    value={form.idNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idNumber: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="tenant-contact">شماره تماس</Label>
                  <Input
                    id="tenant-contact"
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
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="tenant-gender">جنسیت</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, gender: v as TenantGender }))
                  }
                >
                  <SelectTrigger id="tenant-gender" className="w-full">
                    <SelectValue>{GENDER_LABEL[form.gender]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">مرد</SelectItem>
                    <SelectItem value="female">زن</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="tenant-details">جزییات</Label>
                <Textarea
                  id="tenant-details"
                  rows={3}
                  placeholder="مثلاً: دوکاندار قدیمی مارکت"
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
                    : "افزودن مستأجر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}