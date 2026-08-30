"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, UserCheck, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
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

type RelationType =
  | "father"
  | "mother"
  | "spouse"
  | "brother"
  | "sister"
  | "child"
  | "uncle"
  | "aunt"
  | "friend"
  | "colleague"
  | "other";

const RELATION_LABEL: Record<RelationType, string> = {
  father: "پدر",
  mother: "مادر",
  spouse: "همسر",
  brother: "برادر",
  sister: "خواهر",
  child: "فرزند",
  uncle: "عمو / کاکا",
  aunt: "عمه / خاله",
  friend: "دوست",
  colleague: "همکار",
  other: "سایر",
};

const RELATION_OPTIONS = Object.entries(RELATION_LABEL) as [RelationType, string][];

interface Guarantor {
  id: string;
  name: string;
  phone: string;
  tazkiraNumber: string;
  relation: RelationType;
  relationOther: string;
}

const initialGuarantors: Guarantor[] = [
  {
    id: "GRT-01",
    name: "عبدالقادر احمدی",
    phone: "0700112233",
    tazkiraNumber: "12-4-56789",
    relation: "brother",
    relationOther: "",
  },
  {
    id: "GRT-02",
    name: "محمد نعیم رحیمی",
    phone: "0788445566",
    tazkiraNumber: "07-9-12345",
    relation: "friend",
    relationOther: "",
  },
];

const emptyForm = {
  name: "",
  phone: "",
  tazkiraNumber: "",
  relation: "father" as RelationType,
  relationOther: "",
};

function relationLabel(g: Pick<Guarantor, "relation" | "relationOther">) {
  return g.relation === "other" && g.relationOther.trim() !== ""
    ? g.relationOther
    : RELATION_LABEL[g.relation];
}

export default function GuarantorsPage() {
  const [guarantors, setGuarantors] = useState<Guarantor[]>(initialGuarantors);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    if (query.trim() === "") return guarantors;
    return guarantors.filter(
      (g) =>
        g.name.includes(query) ||
        g.phone.includes(query) ||
        g.tazkiraNumber.includes(query)
    );
  }, [guarantors, query]);

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

  function openEditDialog(guarantor: Guarantor) {
    setEditingId(guarantor.id);
    setForm({
      name: guarantor.name,
      phone: guarantor.phone,
      tazkiraNumber: guarantor.tazkiraNumber,
      relation: guarantor.relation,
      relationOther: guarantor.relationOther,
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setGuarantors((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: اتصال به بک‌اند NestJS — POST/PATCH /guarantors
    await new Promise((resolve) => setTimeout(resolve, 500));

    const normalized: Guarantor = {
      id: editingId ?? `GRT-${String(guarantors.length + 1).padStart(2, "0")}`,
      ...form,
      relationOther: form.relation === "other" ? form.relationOther : "",
    };

    if (editingId) {
      setGuarantors((prev) => prev.map((g) => (g.id === editingId ? normalized : g)));
    } else {
      setGuarantors((prev) => [normalized, ...prev]);
    }

    setLoading(false);
    setDialogOpen(false);
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
            <h2 className="text-sm font-semibold text-foreground">همه ضامن‌ها</h2>
          </div>

          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجوی نام، شماره تماس یا تذکره..."
              className="w-full pr-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام ضامن</TableHead>
              <TableHead>شماره تماس</TableHead>
              <TableHead>شماره تذکره</TableHead>
              <TableHead>نسبت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((guarantor) => (
              <TableRow
                key={guarantor.id}
                className="cursor-pointer"
                onClick={() => openEditDialog(guarantor)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{guarantor.name}</span>
                  </div>
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  {guarantor.phone}
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  {guarantor.tazkiraNumber}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {relationLabel(guarantor)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(guarantor.id);
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
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  ضامنی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال ایجاد ضامن / ویرایش */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش ضامن" : "ایجاد ضامن"}</DialogTitle>
            <DialogDescription>
              اطلاعات ضامن را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* ۱. نام ضامن */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="guarantor-name">نام ضامن</Label>
                <Input
                  id="guarantor-name"
                  placeholder="مثلاً: عبدالقادر احمدی"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                />
              </div>

              {/* ۲. شماره تماس */}
              <div className="space-y-2">
                <Label htmlFor="guarantor-phone">شماره تماس</Label>
                <Input
                  id="guarantor-phone"
                  type="tel"
                  dir="ltr"
                  placeholder="07XXXXXXXX"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  required
                />
              </div>

              {/* ۳. شماره تذکره */}
              <div className="space-y-2">
                <Label htmlFor="guarantor-tazkira">شماره تذکره</Label>
                <Input
                  id="guarantor-tazkira"
                  dir="ltr"
                  placeholder="مثلاً: 12-4-56789"
                  value={form.tazkiraNumber}
                  onChange={handleChange("tazkiraNumber")}
                  required
                />
              </div>

              {/* ۴. نسبت */}
              <div className="space-y-2">
                <Label htmlFor="guarantor-relation">نسبت</Label>
                <Select
                  value={form.relation}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, relation: v as RelationType }))
                  }
                >
                  <SelectTrigger id="guarantor-relation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.relation === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="guarantor-relation-other">توضیح نسبت</Label>
                  <Input
                    id="guarantor-relation-other"
                    placeholder="مثلاً: همسایه"
                    value={form.relationOther}
                    onChange={handleChange("relationOther")}
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {loading ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "ثبت ضامن"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
