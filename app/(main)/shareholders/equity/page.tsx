"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  PieChart,
  Loader2,
  Landmark,
} from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createEquity,
  updateEquity,
  fetchEquities,
  type ShareholderEquity,
} from "@/services/shareholder-equity.service";
import { fetchShareholders, type Shareholder } from "@/services/shareholder.service";
import { extractApiErrorMessage } from "@/services/client";
import { ToastProvider, useToast } from "@/components/client/toast";

export default function ShareholderEquityPage() {
  return (
    <ToastProvider>
      <ShareholderEquityContent />
    </ToastProvider>
  );
}

function ShareholderEquityContent() {
  const toast = useToast();
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [equitiesMap, setEquitiesMap] = useState<Record<string, ShareholderEquity[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
  const [selectedShareholderId, setSelectedShareholderId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShareholders();
      const list = Array.isArray(result) ? result : [];
      setShareholders(list);

      const eqMap: Record<string, ShareholderEquity[]> = {};
      await Promise.all(
        list.map(async (sh) => {
          try {
            const eqs = await fetchEquities(sh.id);
            eqMap[sh.id] = Array.isArray(eqs) ? eqs : [];
          } catch {
            eqMap[sh.id] = [];
          }
        }),
      );
      setEquitiesMap(eqMap);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت سهامداران"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAddDialog() {
    setDialogMode("add");
    setEditingShareholder(null);
    setSelectedShareholderId("");
    setPercentage("");
    setNotes("");
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(shareholder: Shareholder) {
    setDialogMode("edit");
    setEditingShareholder(shareholder);
    setSelectedShareholderId(shareholder.id);
    setPercentage(shareholder.currentPercentage || "0");
    setNotes("");
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const shareholderId = dialogMode === "add" ? selectedShareholderId : editingShareholder?.id;
    if (!shareholderId) {
      setFormError("سهامدار را انتخاب کنید");
      return;
    }

    const pct = Number(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setFormError("درصد باید بین ۰ تا ۱۰۰ باشد");
      return;
    }

    setSaving(true);
    try {
      const existingEquities = equitiesMap[shareholderId] || [];
      const payload = { percentage: pct, notes: notes.trim() };

      if (existingEquities.length > 0) {
        const latest = existingEquities[0];
        await updateEquity(shareholderId, latest.id, payload);
      } else {
        await createEquity(shareholderId, payload);
      }

      setShareholders((prev) =>
        prev.map((sh) =>
          sh.id === shareholderId
            ? { ...sh, currentPercentage: String(pct) }
            : sh,
        ),
      );

      toast.success(
        dialogMode === "add"
          ? "درصد سهام با موفقیت ثبت شد"
          : "درصد سهام با موفقیت بروزرسانی شد",
      );
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت درصد سهام ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  const totalPercentage = shareholders.reduce(
    (sum, sh) => sum + (Number(sh.currentPercentage) || 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="درصد سهام"
        description="مشاهده و مدیریت درصد سهام هر سهامدار"
        action={
          <Button onClick={openAddDialog}>
            <Plus data-icon="inline-start" />
            افزودن درصد سهام
          </Button>
        }
      />

      {loading ? (
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      ) : error ? (
        <Card className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            تلاش مجدد
          </Button>
        </Card>
      ) : shareholders.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16">
          <PieChart className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">سهامداری تعریف نشده است</p>
        </Card>
      ) : (
        <>
          {/* Summary Card */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Landmark className="h-4 w-4" />
                <span className="text-xs font-semibold">تعداد سهامداران</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {shareholders.length.toLocaleString("fa-AF")}
              </p>
            </Card>
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <PieChart className="h-4 w-4" />
                <span className="text-xs font-semibold">مجموع درصدها</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  Math.abs(totalPercentage - 100) < 0.01
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {totalPercentage.toLocaleString("fa-AF")}٪
              </p>
            </Card>
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <PieChart className="h-4 w-4" />
                <span className="text-xs font-semibold">باقی‌مانده</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  Math.abs(totalPercentage - 100) < 0.01
                    ? "text-green-600"
                    : "text-foreground"
                }`}
              >
                {(100 - totalPercentage).toLocaleString("fa-AF")}٪
              </p>
            </Card>
          </div>

          {/* Shareholders Table */}
          <Card className="p-0">
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold text-foreground">
                سهامداران
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({shareholders.length.toLocaleString("fa-AF")} مورد)
                </span>
              </h2>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right pr-5">نام سهامدار</TableHead>
                  <TableHead className="text-right">شماره تماس</TableHead>
                  <TableHead className="text-right">درصد سهام</TableHead>
                  <TableHead className="text-right">نمودار</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareholders.map((shareholder) => {
                  const pct = Number(shareholder.currentPercentage) || 0;
                  return (
                    <TableRow key={shareholder.id}>
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
                      <TableCell>
                        <span
                          className={`font-bold ${
                            pct > 0 ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {pct.toLocaleString("fa-AF")}٪
                        </span>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(shareholder)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-right">
              <DialogTitle>
                {dialogMode === "add" ? "افزودن درصد سهام" : "ویرایش درصد سهام"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "add"
                  ? "سهامدار و درصد سهام را مشخص کنید"
                  : `درصد سهام ${editingShareholder?.fullName} را وارد کنید`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {dialogMode === "add" && (
                <div className="space-y-2 text-right">
                  <Label>انتخاب سهامدار</Label>
                  <Select
                    value={selectedShareholderId}
                    onValueChange={(v) => setSelectedShareholderId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب سهامدار">
                        {(value) =>
                          shareholders.find((s) => s.id === value)?.fullName ??
                          "انتخاب سهامدار"
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
              )}

              <div className="space-y-2 text-right">
                <Label htmlFor="equity-percentage">درصد سهام</Label>
                <div className="relative">
                  <Input
                    id="equity-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    dir="ltr"
                    placeholder="0"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    required
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ٪
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="equity-notes">توضیحات (اختیاری)</Label>
                <Input
                  id="equity-notes"
                  placeholder="مثلاً: تنظیم اولیه"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter className="gap-2">
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
                  : dialogMode === "add"
                    ? "افزودن"
                    : "ذخیره"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
