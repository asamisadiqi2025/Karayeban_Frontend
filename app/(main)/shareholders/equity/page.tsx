"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  PieChart,
  Loader2,
  X,
} from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchEquities,
  createEquity,
  updateEquity,
  deleteEquity,
  type ShareholderEquity,
} from "@/services/shareholder-equity.service";
import { fetchShareholders, type Shareholder } from "@/services/shareholder.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

interface EntryForm {
  shareholderId: string;
  percentage: string;
}

const emptyForm = {
  entries: [{ shareholderId: "", percentage: "" }] as EntryForm[],
  notes: "",
};

export default function ShareholderEquityPage() {
  return (
    <ToastProvider>
      <ShareholderEquityPageContent />
    </ToastProvider>
  );
}

function ShareholderEquityPageContent() {
  const toast = useToast();
  const [equities, setEquities] = useState<ShareholderEquity[]>([]);
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [selectedShareholderId, setSelectedShareholderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShareholders()
      .then((result) => {
        if (cancelled) return;
        setShareholders(Array.isArray(result) ? result : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadEquities = useCallback(async (shareholderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEquities(shareholderId);
      setEquities(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت سهامداری"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedShareholderId) {
      loadEquities(selectedShareholderId);
    } else {
      setEquities([]);
    }
  }, [selectedShareholderId, loadEquities]);

  const filtered = useMemo(() => {
    return equities.filter((eq) => {
      if (query.trim() === "") return true;
      return eq.notes.toLowerCase().includes(query.toLowerCase());
    });
  }, [equities, query]);

  function getShareholderName(id: string): string {
    return shareholders.find((s) => s.id === id)?.fullName ?? id;
  }

  function getTotalPercentage(entries: ShareholderEquity["entries"]): number {
    return entries.reduce((sum, e) => sum + e.percentage, 0);
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm({
      entries: [{ shareholderId: selectedShareholderId, percentage: "" }],
      notes: "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(equity: ShareholderEquity) {
    setEditingId(equity.id);
    setForm({
      entries:
        equity.entries.length > 0
          ? equity.entries.map((e) => ({
              shareholderId: e.shareholderId,
              percentage: String(e.percentage),
            }))
          : [{ shareholderId: selectedShareholderId, percentage: "" }],
      notes: equity.notes,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(equity: ShareholderEquity) {
    if (!selectedShareholderId) return;
    setDeletingId(equity.id);
    try {
      await deleteEquity(selectedShareholderId, equity.id);
      setEquities((prev) => prev.filter((eq) => eq.id !== equity.id));
      toast.success("سهامداری با موفقیت حذف شد");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف سهامداری ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  function addEntry() {
    setForm((f) => ({
      ...f,
      entries: [...f.entries, { shareholderId: "", percentage: "" }],
    }));
  }

  function removeEntry(index: number) {
    setForm((f) => ({
      ...f,
      entries: f.entries.filter((_, i) => i !== index),
    }));
  }

  function updateEntry(index: number, field: keyof EntryForm, value: string) {
    setForm((f) => ({
      ...f,
      entries: f.entries.map((e, i) =>
        i === index ? { ...e, [field]: value } : e,
      ),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!selectedShareholderId) {
      setFormError("ابتدا یک سهامدار انتخاب کنید");
      return;
    }

    const validEntries = form.entries.filter(
      (en) => en.shareholderId && en.percentage,
    );

    if (validEntries.length === 0) {
      setFormError("حداقل یک سهامدار با درصد مشخص اضافه کنید");
      return;
    }

    for (const en of validEntries) {
      const pct = Number(en.percentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        setFormError(`درصد سهامدار "${getShareholderName(en.shareholderId)}" نامعتبر است`);
        return;
      }
    }

    const total = validEntries.reduce((s, en) => s + Number(en.percentage), 0);
    if (Math.abs(total - 100) > 0.01) {
      setFormError(`مجموع درصدها باید ۱۰۰٪ باشد (الان ${total.toLocaleString("fa-AF")}٪ است)`);
      return;
    }

    const payload = {
      entries: validEntries.map((en) => ({
        shareholderId: en.shareholderId,
        percentage: Number(en.percentage),
      })),
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateEquity(selectedShareholderId, editingId, payload);
        setEquities((prev) =>
          prev.map((eq) => (eq.id === editingId ? updated : eq)),
        );
        toast.success("سهامداری با موفقیت بروزرسانی شد");
      } else {
        const created = await createEquity(selectedShareholderId, payload);
        setEquities((prev) => [created, ...prev]);
        toast.success("سهامداری جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(
        extractApiErrorMessage(err, "ثبت سهامداری ناموفق بود"),
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedShareholderName = shareholders.find(
    (s) => s.id === selectedShareholderId,
  )?.fullName;

  return (
    <div>
      <PageHeader
        title="سهامداری"
        description="مدیریت توزیع سهام سهامداران"
      />

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-right">
              <Label>انتخاب سهامدار</Label>
              <p className="text-xs text-muted-foreground">
                ابتدا سهامدار مورد نظر را انتخاب کنید تا سهامداری‌های او نمایش داده شود
              </p>
            </div>
            <Select
              value={selectedShareholderId}
              onValueChange={(v) => setSelectedShareholderId(v ?? "")}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="انتخاب سهامدار">
                  {(value) =>
                    shareholders.find((s) => s.id === value)?.fullName ??
                    "انتخاب سهامدار"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {initialLoading ? (
                  <SelectItem value="__loading__" disabled>
                    در حال بارگذاری...
                  </SelectItem>
                ) : shareholders.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    سهامداری تعریف نشده
                  </SelectItem>
                ) : (
                  shareholders.map((sh) => (
                    <SelectItem key={sh.id} value={sh.id}>
                      {sh.fullName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {selectedShareholderId && (
        <>
          <Card className="mt-4 p-0">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  سهامداری‌های {selectedShareholderName}
                  {!loading && (
                    <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                      ({filtered.length.toLocaleString("fa-AF")} مورد)
                    </span>
                  )}
                </h2>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="h-3.5 w-3.5" />
                  افزودن سهامداری
                </Button>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="جستجوی توضیحات..."
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
                  <TableHead className="text-right pr-5">توضیحات</TableHead>
                  <TableHead className="text-right">تعداد سهامداران</TableHead>
                  <TableHead className="text-right">مجموع درصد</TableHead>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadEquities(selectedShareholderId)}
                        >
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
                      سهامداری یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((equity) => {
                    const total = getTotalPercentage(equity.entries);
                    return (
                      <TableRow
                        key={equity.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => openEditDialog(equity)}
                      >
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                              <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground">
                              {equity.notes || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {equity.entries.length.toLocaleString("fa-AF")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              Math.abs(total - 100) < 0.01
                                ? "text-green-600 font-medium"
                                : "text-destructive font-medium"
                            }
                          >
                            {total.toLocaleString("fa-AF")}٪
                          </span>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(equity);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={deletingId === equity.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(equity);
                              }}
                            >
                              {deletingId === equity.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>

          {/* مودال افزودن / ویرایش سهامداری */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[700px]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <DialogHeader className="text-right">
                  <DialogTitle>
                    {editingId ? "ویرایش سهامداری" : "افزودن سهامداری جدید"}
                  </DialogTitle>
                  <DialogDescription>
                    توزیع درصد سهام هر سهامدار را مشخص کنید
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>توزیع سهام</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEntry}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        افزودن سهامدار
                      </Button>
                    </div>

                    {form.entries.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-end gap-2 rounded-lg border p-3"
                      >
                        <div className="flex-1 space-y-1 text-right">
                          {index === 0 && (
                            <Label className="text-xs text-muted-foreground">
                              سهامدار
                            </Label>
                          )}
                          <Select
                            value={entry.shareholderId}
                            onValueChange={(v) =>
                              updateEntry(index, "shareholderId", v ?? "")
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="انتخاب سهامدار">
                                {(value) =>
                                  shareholders.find((s) => s.id === value)
                                    ?.fullName ?? "انتخاب سهامدار"
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {shareholders.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                  سهامداری تعریف نشده
                                </SelectItem>
                              ) : (
                                shareholders.map((sh) => (
                                  <SelectItem key={sh.id} value={sh.id}>
                                    {sh.fullName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-28 space-y-1 text-right">
                          {index === 0 && (
                            <Label className="text-xs text-muted-foreground">
                              درصد
                            </Label>
                          )}
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              dir="ltr"
                              placeholder="0"
                              value={entry.percentage}
                              onChange={(e) =>
                                updateEntry(index, "percentage", e.target.value)
                              }
                            />
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                             ٪
                            </span>
                          </div>
                        </div>

                        <div className="flex items-end">
                          {index === 0 && (
                            <div className="h-5" />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={form.entries.length <= 1}
                            onClick={() => removeEntry(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {form.entries.length > 0 && (
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-muted-foreground">مجموع:</span>
                        <span
                          className={
                            Math.abs(
                              form.entries.reduce(
                                (s, en) => s + (Number(en.percentage) || 0),
                                0,
                              ) - 100,
                            ) < 0.01
                              ? "font-medium text-green-600"
                              : "font-medium text-destructive"
                          }
                        >
                          {form.entries
                            .reduce(
                              (s, en) => s + (Number(en.percentage) || 0),
                              0,
                            )
                            .toLocaleString("fa-AF")}
                          ٪
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-right">
                    <Label htmlFor="equity-notes">توضیحات</Label>
                    <Textarea
                      id="equity-notes"
                      rows={2}
                      placeholder="مثلاً: تنظیم اولیه"
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
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
                        : "افزودن سهامداری"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
