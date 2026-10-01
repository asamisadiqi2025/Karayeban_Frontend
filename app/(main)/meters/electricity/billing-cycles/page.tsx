"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, CalendarRange, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  fetchBillingCycles,
  createBillingCycle,
  billingCycleKey,
  type BillingCycle,
} from "@/services/billing-cycle.service";
import { extractApiErrorMessage } from "@/services/client";
import { isoToDisplayDateTime, todayPersian } from "@/lib/date-picker";
import { ToastProvider, useToast } from "@/components/client/toast";

const fa = "fa-AF";

const PERIOD_OPTIONS = [1, 2];

const MIN_JALALI_YEAR = 1300;
const MAX_JALALI_YEAR = 1500;

function durationLabel(months: number): string {
  if (months === 1) return "ماهانه";
  if (months === 2) return "هر ۲ ماه";
  return `هر ${months.toLocaleString(fa)} ماه`;
}

export default function BillingCyclesPage() {
  return (
    <ToastProvider>
      <BillingCyclesPageContent />
    </ToastProvider>
  );
}

function BillingCyclesPageContent() {
  const toast = useToast();
  const [rows, setRows] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    year: String(todayPersian().year),
    monthsPerPeriod: "2",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBillingCycles();
      setRows(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "خطا در دریافت مدت زمان قرائت میتر"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchBillingCycles()
      .then((result) => {
        if (cancelled) return;
        setRows(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, "خطا در دریافت مدت زمان قرائت میتر"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (q === "") return rows;
    return rows.filter(
      (r) =>
        String(r.year).includes(q) ||
        String(r.monthsPerPeriod).includes(q) ||
        durationLabel(r.monthsPerPeriod).includes(q),
    );
  }, [rows, query]);

  function openCreateDialog() {
    setForm({
      year: String(todayPersian().year),
      monthsPerPeriod: "2",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const year = Number(form.year);
    if (form.year.trim() === "" || !Number.isInteger(year)) {
      setFormError("سال باید یک عدد صحیح باشد");
      return;
    }
    if (year < MIN_JALALI_YEAR || year > MAX_JALALI_YEAR) {
      setFormError(`سال باید بین ${MIN_JALALI_YEAR} تا ${MAX_JALALI_YEAR} باشد`);
      return;
    }
    const monthsPerPeriod = Number(form.monthsPerPeriod);
    if (
      form.monthsPerPeriod.trim() === "" ||
      !Number.isInteger(monthsPerPeriod) ||
      monthsPerPeriod < 1 ||
      monthsPerPeriod > 12
    ) {
      setFormError("مدت دوره باید عددی بین ۱ تا ۱۲ ماه باشد");
      return;
    }

    setSaving(true);
    try {
      const created = await createBillingCycle({ year, monthsPerPeriod });
      const createdKey = billingCycleKey(created);
      setRows((prev) => [
        created,
        ...prev.filter((r) => billingCycleKey(r) !== createdKey),
      ]);
      toast.success("مدت زمان قرائت با موفقیت ثبت شد");
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت مدت زمان قرائت ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="مدت زمان قرائت میتر"
        description="تعیین سال و فاصله زمانی بین قرائت‌های میترهای برق"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن مدت زمان
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              دوره‌های قرائت
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                  ({filtered.length.toLocaleString(fa)} مورد)
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی سال یا مدت دوره..."
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
              <TableHead className="text-center">سال</TableHead>
              <TableHead className="text-center">مدت زمان قرائت</TableHead>
              <TableHead className="text-center">تعداد ماه</TableHead>
              <TableHead className="text-center">تاریخ ثبت</TableHead>
              {/* <TableHead className="text-center">آخرین بروزرسانی</TableHead> */}
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
                  مدت زمانی برای قرائت میتر تعریف نشده است
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cycle) => (
                <TableRow key={billingCycleKey(cycle)} className="hover:bg-muted/40">
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {cycle.year ? cycle.year.toLocaleString(fa) : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {durationLabel(cycle.monthsPerPeriod)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {cycle.monthsPerPeriod > 0
                      ? `${cycle.monthsPerPeriod.toLocaleString(fa)} ماه`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {cycle.createdAt ? isoToDisplayDateTime(cycle.createdAt) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال ثبت مدت زمان قرائت میتر */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>افزودن مدت زمان قرائت</DialogTitle>
            <DialogDescription>
              سال شمسی و تعداد ماه بین دو قرائت متوالی میتر را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="billing-cycle-year">سال</Label>
                <Input
                  id="billing-cycle-year"
                  type="number"
                  step="1"
                  min={MIN_JALALI_YEAR}
                  max={MAX_JALALI_YEAR}
                  dir="ltr"
                  placeholder="1405"
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="billing-cycle-period">مدت زمان قرائت</Label>
                <Select
                  value={form.monthsPerPeriod}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, monthsPerPeriod: value ?? "" }))
                  }
                >
                  <SelectTrigger id="billing-cycle-period" className="w-full">
                    <SelectValue placeholder="انتخاب مدت دوره">
                      {(value) =>
                        value ? durationLabel(Number(value)) : "انتخاب مدت دوره"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((months) => (
                      <SelectItem key={months} value={String(months)}>
                        {durationLabel(months)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose render={<Button variant="outline" type="button" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {saving ? "در حال ثبت..." : "ثبت مدت زمان"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
