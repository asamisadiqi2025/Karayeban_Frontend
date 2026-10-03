"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Filter,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailTable, type DetailRow } from "@/components/ui/detail-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { isoToDisplayDateTime } from "@/lib/date-picker";
import { ToastProvider, useToast } from "@/components/client/toast";
import { PaginationBar } from "@/components/client/dashboard/pagination-bar";
import {
  UserFormFields,
  UserRoleBadge,
  emptyUserForm,
  toUserBody,
  toUserUpdateBody,
  userRoleLabel,
  validateUserForm,
  type UserFormValues,
} from "@/components/client/users/user-form";

import {
  fetchUsersPaginated,
  createUser,
  updateUser,
  deleteUser,
  USER_ROLE_OPTIONS,
  type PaginatedMeta,
  type User,
} from "@/services/user.service";
import { resolveMediaUrl } from "@/services/market.service";
import { extractApiErrorMessage } from "@/services/client";

const ALL = "all";
const PAGE_SIZE = 20;

const emptyMeta: PaginatedMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const activeFilterOptions: { value: string; label: string }[] = [
  { value: ALL, label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

/** حرف اول نام برای آواتار جایگزین؛ با متن لاتین/فارسی هر دو کار می‌کند. */
function initialsOf(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed ? trimmed.charAt(0) : "؟";
}

function userToForm(user: User): UserFormValues {
  return {
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    password: "",
    role: user.role,
    phone: user.phone ?? "",
    // fatherName: user.fatherName ?? "",
    // grandfatherName: user.grandfatherName ?? "",
    // tazkiraNumber: user.tazkiraNumber ?? "",
    // address: user.address ?? "",
    isActive: user.isActive,
  };
}

export default function UsersPage() {
  return (
    <ToastProvider>
      <UsersPageContent />
    </ToastProvider>
  );
}

function UsersPageContent() {
  const toast = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [role, setRole] = useState<string>(ALL);
  const [activeFilter, setActiveFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormValues>(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  /**
   * وضعیت loading در هندلرهای کاربر ست می‌شود، نه داخل افکت، تا
   * react-hooks/set-state-in-effect رعایت شود.
   */
  useEffect(() => {
    let cancelled = false;
    fetchUsersPaginated({
      search: appliedSearch || undefined,
      role: role === ALL ? undefined : role,
      isActive:
        activeFilter === ALL ? undefined : activeFilter === "active",
      page,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return;
        setUsers(result.items);
        setMeta(result.meta);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setUsers([]);
        setError(extractApiErrorMessage(err, "خطا در دریافت کاربران"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedSearch, role, activeFilter, page, reloadToken]);

  const currentPage = meta.totalPages > 0 ? Math.min(page, meta.totalPages) : 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  function reload() {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }

  function goToPage(next: number) {
    setLoading(true);
    setPage(Math.min(Math.max(1, next), Math.max(1, meta.totalPages)));
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAppliedSearch(search.trim());
    setPage(1);
  }

  function changeRole(value: string | null) {
    setLoading(true);
    setRole(value ?? ALL);
    setPage(1);
  }

  function changeActiveFilter(value: string | null) {
    setLoading(true);
    setActiveFilter(value ?? ALL);
    setPage(1);
  }

  function clearFilters() {
    setLoading(true);
    setSearch("");
    setAppliedSearch("");
    setRole(ALL);
    setActiveFilter(ALL);
    setPage(1);
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyUserForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditingId(user.id);
    setForm(userToForm(user));
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(user: User) {
    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("کاربر با موفقیت حذف شد");
      reload();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "حذف کاربر ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const validationError = validateUserForm(form, {
      requirePassword: !editingId,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateUser(editingId, {
          ...toUserUpdateBody(form),
          isActive: form.isActive,
        });
        setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
        setDetailUser((prev) => (prev?.id === editingId ? updated : prev));
        toast.success("کاربر با موفقیت بروزرسانی شد");
      } else {
        const created = await createUser(toUserBody(form));
        setUsers((prev) => [created, ...prev]);
        toast.success("کاربر جدید با موفقیت ثبت شد");
        reload();
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "ثبت کاربر ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  const detailRows: DetailRow[] = detailUser
    ? [
        { label: "نام کامل", value: detailUser.fullName },
        { label: "نام کاربری", value: detailUser.username },
        { label: "ایمیل", value: detailUser.email },
        { label: "شماره تماس", value: detailUser.phone ?? "—" },
        {
          label: "نقش",
          value: (
            <UserRoleBadge
              role={detailUser.role}
              customRoleName={detailUser.customRole?.name}
            />
          ),
        },
        { label: "مارکت", value: detailUser.market?.name ?? "—" },
        // { label: "ولد", value: detailUser.fatherName ?? "—" },
        // { label: "ولدِ ولد", value: detailUser.grandfatherName ?? "—" },
        // { label: "شماره تذکره", value: detailUser.tazkiraNumber ?? "—" },
        // { label: "آدرس", value: detailUser.address ?? "—" },
        { label: "وضعیت حساب", value: detailUser.isActive ? "فعال" : "غیرفعال" },
        { label: "مدیر کل سیستم", value: detailUser.isSuperAdmin ? "بلی" : "خیر" },
        { label: "آخرین ورود", value: detailUser.lastLogin ? isoToDisplayDateTime(detailUser.lastLogin) : "—" },
        { label: "تاریخ ایجاد", value: detailUser.createdAt ? isoToDisplayDateTime(detailUser.createdAt) : "—" },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="مدیریت کاربران"
        description="ایجاد، ویرایش و مدیریت دسترسی کاربران مارکت"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            افزودن کاربر جدید
          </Button>
        }
      />

      {/* -------------------- Filters -------------------- */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">فیلترها</h2>
        </div>

        <form onSubmit={applySearch}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 text-right">
              <Label htmlFor="filter-user-search">جستجو</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filter-user-search"
                  dir="ltr"
                  placeholder="نام، نام کاربری، ایمیل یا تماس..."
                  className="pr-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label>نقش</Label>
              <Select value={role} onValueChange={changeRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه نقش‌ها">
                    {(value) =>
                      value === ALL
                        ? "همه نقش‌ها"
                        : userRoleLabel(String(value))
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>همه نقش‌ها</SelectItem>
                  {USER_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {userRoleLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 text-right">
              <Label>وضعیت</Label>
              <Select
                value={activeFilter}
                onValueChange={changeActiveFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه وضعیت‌ها">
                    {(value) =>
                      activeFilterOptions.find((o) => o.value === value)
                        ?.label ?? "همه وضعیت‌ها"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">اعمال فیلتر</Button>
              <Button type="button" variant="outline" onClick={clearFilters}>
                <RefreshCw data-icon="inline-start" />
                حذف فیلترها
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            همه کاربران
            {!loading && (
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                ({meta.total.toLocaleString("fa-AF")} مورد)
              </span>
            )}
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>کاربر</TableHead>
              <TableHead>ایمیل</TableHead>
              <TableHead>شماره تماس</TableHead>
              <TableHead>نقش</TableHead>
              <TableHead>مارکت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>آخرین ورود</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={reload}>
                      تلاش مجدد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  کاربری یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetailUser(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        {resolveMediaUrl(user.profilePhoto) && (
                          <AvatarImage
                            src={resolveMediaUrl(user.profilePhoto) as string}
                          />
                        )}
                        <AvatarFallback>
                          {initialsOf(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {user.fullName}
                        </p>
                        <p dir="ltr" className="truncate text-start text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {user.email || "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {user.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <UserRoleBadge
                      role={user.role}
                      customRoleName={user.customRole?.name}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.market?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        user.isActive
                          ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : "inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"
                      }
                    >
                      {user.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {user.lastLogin ? isoToDisplayDateTime(user.lastLogin) : "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/users/${user.id}/permissions`);
                        }}
                        aria-label="دسترسی‌ها"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailUser(user);
                        }}
                        aria-label="مشاهده جزییات"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(user);
                        }}
                        aria-label="ویرایش"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === user.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user);
                        }}
                        aria-label="حذف"
                      >
                        {deletingId === user.id ? (
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

        {meta.total > 0 && (
          <PaginationBar
            from={startIndex + 1}
            to={Math.min(startIndex + PAGE_SIZE, meta.total)}
            total={meta.total}
            page={currentPage}
            totalPages={meta.totalPages}
            onPageChange={goToPage}
            disabled={loading}
          />
        )}
      </Card>

      {/* -------------------- ایجاد / ویرایش کاربر -------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش کاربر" : "ایجاد کاربر جدید"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "اطلاعات کاربر را ویرایش کنید"
                : "اطلاعات کاربر جدید را وارد کنید"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <UserFormFields
              values={form}
              onChange={setForm}
              showIsActive={!!editingId}
              idPrefix={editingId ? "edit-user" : "create-user"}
            />

            {formError && (
              <p className="mt-5 whitespace-pre-line text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="mt-6 gap-2">
              <DialogClose render={<Button variant="outline" type="button" />}>
                انصراف
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {saving
                  ? "در حال ذخیره..."
                  : editingId
                    ? "ذخیره تغییرات"
                    : "ثبت کاربر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------- جزییات کاربر -------------------- */}
      <Dialog
        open={!!detailUser}
        onOpenChange={(open) => {
          if (!open) setDetailUser(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>جزییات کاربر</DialogTitle>
            <DialogDescription>
              {detailUser?.fullName} —{" "}
              {userRoleLabel(detailUser?.role ?? "", detailUser?.customRole?.name)}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-lg border">
            <DetailTable rows={detailRows} />
          </div>

          <DialogFooter className="mt-6 gap-2">
            <DialogClose render={<Button variant="outline" type="button" />}>
              بستن
            </DialogClose>
            {/* <Button
              type="button"
              onClick={() => {
                if (!detailUser) return;
                const target = detailUser;
                setDetailUser(null);
                openEditDialog(target);
              }}
            >
              <Pencil data-icon="inline-start" />
              ویرایش کاربر
            </Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}