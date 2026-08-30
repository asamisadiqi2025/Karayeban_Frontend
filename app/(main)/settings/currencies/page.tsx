// // "use client";

// // import { useMemo, useState } from "react";
// // import { Plus, Search, Pencil, Trash2, Coins } from "lucide-react";

// // import { PageHeader } from "@/components/server/dashboard/page-header";
// // import { Card } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Badge } from "@/components/ui/badge";
// // import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogDescription,
// //   DialogFooter,
// //   DialogClose,
// // } from "@/components/ui/dialog";
// // import {
// //   Table,
// //   TableHeader,
// //   TableBody,
// //   TableRow,
// //   TableHead,
// //   TableCell,
// // } from "@/components/ui/table";

// // type CurrencyStatus = "active" | "inactive";

// // interface Currency {
// //   id: string;
// //   name: string;
// //   code: string;
// //   symbol: string;
// //   rate: string;
// //   status: CurrencyStatus;
// // }

// // const initialCurrencies: Currency[] = [
// //   { id: "CUR-01", name: "افغانی افغانستان", code: "AFN", symbol: "؋", rate: "1", status: "active" },
// //   { id: "CUR-02", name: "دلار آمریکا", code: "USD", symbol: "$", rate: "70.50", status: "active" },
// //   { id: "CUR-03", name: "تومان ایران", code: "IRT", symbol: "تومان", rate: "0.0017", status: "active" },
// //   { id: "CUR-04", name: "روپیه پاکستان", code: "PKR", symbol: "₨", rate: "0.25", status: "inactive" },
// //   { id: "CUR-05", name: "یورو", code: "EUR", symbol: "€", rate: "76.20", status: "active" },
// // ];

// // const emptyForm = { name: "", code: "", symbol: "", rate: "", status: "active" as CurrencyStatus };

// // export default function CurrenciesPage() {
// //   const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
// //   const [query, setQuery] = useState("");
// //   const [filter, setFilter] = useState<"all" | CurrencyStatus>("all");

// //   const [dialogOpen, setDialogOpen] = useState(false);
// //   const [editingId, setEditingId] = useState<string | null>(null);
// //   const [form, setForm] = useState(emptyForm);

// //   const filtered = useMemo(() => {
// //     return currencies.filter((c) => {
// //       const matchesFilter = filter === "all" || c.status === filter;
// //       const matchesQuery =
// //         query.trim() === "" ||
// //         c.name.includes(query) ||
// //         c.code.toLowerCase().includes(query.toLowerCase());
// //       return matchesFilter && matchesQuery;
// //     });
// //   }, [currencies, query, filter]);

// //   function openCreateDialog() {
// //     setEditingId(null);
// //     setForm(emptyForm);
// //     setDialogOpen(true);
// //   }

// //   function openEditDialog(currency: Currency) {
// //     setEditingId(currency.id);
// //     setForm({
// //       name: currency.name,
// //       code: currency.code,
// //       symbol: currency.symbol,
// //       rate: currency.rate,
// //       status: currency.status,
// //     });
// //     setDialogOpen(true);
// //   }

// //   function handleDelete(id: string) {
// //     setCurrencies((prev) => prev.filter((c) => c.id !== id));
// //   }

// //   function handleSubmit(e: React.FormEvent) {
// //     e.preventDefault();

// //     if (editingId) {
// //       setCurrencies((prev) =>
// //         prev.map((c) => (c.id === editingId ? { ...c, ...form } : c))
// //       );
// //     } else {
// //       const newCurrency: Currency = {
// //         id: `CUR-${String(currencies.length + 1).padStart(2, "0")}`,
// //         ...form,
// //       };
// //       setCurrencies((prev) => [newCurrency, ...prev]);
// //     }

// //     setDialogOpen(false);
// //   }

// //   return (
// //     <div>
// //       <PageHeader
// //         title="واحدهای پولی"
// //         description="مدیریت واحدهای پولی و نرخ تبدیل آن‌ها"
// //         action={
// //           <Button onClick={openCreateDialog}>
// //             <Plus data-icon="inline-start" />
// //             واحد پولی جدید
// //           </Button>
// //         }
// //       />

// //       <Card className="p-0">
// //         <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
// //           <div>
// //             <h2 className="text-sm font-semibold text-foreground">همه واحدهای پولی</h2>
// //           </div>

// //           <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
// //             <div className="relative">
// //               <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
// //               <Input
// //                 placeholder="جستجوی واحد پولی..."
// //                 className="w-full pr-8 sm:w-56"
// //                 value={query}
// //                 onChange={(e) => setQuery(e.target.value)}
// //               />
// //             </div>

// //             <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
// //               <TabsList>
// //                 <TabsTrigger value="all">همه</TabsTrigger>
// //                 <TabsTrigger value="active">فعال</TabsTrigger>
// //                 <TabsTrigger value="inactive">غیرفعال</TabsTrigger>
// //               </TabsList>
// //             </Tabs>
// //           </div>
// //         </div>

// //         <Table>
// //           <TableHeader>
// //             <TableRow>
// //               <TableHead>کد</TableHead>
// //               <TableHead>نام واحد پولی</TableHead>
// //               <TableHead>سیمبول</TableHead>
// //               <TableHead>نرخ تبدیل</TableHead>
// //               <TableHead>وضعیت</TableHead>
// //               <TableHead className="text-left">عملیات</TableHead>
// //             </TableRow>
// //           </TableHeader>
// //           <TableBody>
// //             {filtered.map((currency) => (
// //               <TableRow
// //                 key={currency.id}
// //                 className="cursor-pointer"
// //                 onClick={() => openEditDialog(currency)}
// //               >
// //                 <TableCell className="font-medium text-foreground">{currency.code}</TableCell>
// //                 <TableCell>
// //                   <div className="flex items-center gap-2">
// //                     <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
// //                       <Coins className="h-3.5 w-3.5 text-muted-foreground" />
// //                     </div>
// //                     <span className="font-medium text-foreground">{currency.name}</span>
// //                   </div>
// //                 </TableCell>
// //                 <TableCell className="text-muted-foreground">{currency.symbol}</TableCell>
// //                 <TableCell className="font-medium text-foreground">{currency.rate}</TableCell>
// //                 <TableCell>
// //                   <Badge variant={currency.status === "active" ? "success" : "secondary"}>
// //                     {currency.status === "active" ? "فعال" : "غیرفعال"}
// //                   </Badge>
// //                 </TableCell>
// //                 <TableCell className="text-left">
// //                   <div className="flex items-center justify-end gap-1">
// //                     <Button
// //                       variant="ghost"
// //                       size="icon-sm"
// //                       onClick={(e) => {
// //                         e.stopPropagation();
// //                         openEditDialog(currency);
// //                       }}
// //                     >
// //                       <Pencil className="h-3.5 w-3.5" />
// //                     </Button>
// //                     <Button
// //                       variant="ghost"
// //                       size="icon-sm"
// //                       className="text-destructive hover:bg-destructive/10 hover:text-destructive"
// //                       onClick={(e) => {
// //                         e.stopPropagation();
// //                         handleDelete(currency.id);
// //                       }}
// //                     >
// //                       <Trash2 className="h-3.5 w-3.5" />
// //                     </Button>
// //                   </div>
// //                 </TableCell>
// //               </TableRow>
// //             ))}

// //             {filtered.length === 0 && (
// //               <TableRow>
// //                 <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
// //                   واحد پولی‌ای یافت نشد
// //                 </TableCell>
// //               </TableRow>
// //             )}
// //           </TableBody>
// //         </Table>
// //       </Card>

// //       {/* مودال افزودن / ویرایش واحد پولی */}
// //       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
// //         <DialogContent>
// //           <form onSubmit={handleSubmit} className="space-y-4">
// //             <DialogHeader>
// //               <DialogTitle>
// //                 {editingId ? "ویرایش واحد پولی" : "افزودن واحد پولی جدید"}
// //               </DialogTitle>
// //               <DialogDescription>
// //                 اطلاعات واحد پولی و نرخ تبدیل آن را وارد کنید
// //               </DialogDescription>
// //             </DialogHeader>

// //             <div className="space-y-3">
// //               <div className="space-y-1.5 text-right">
// //                 <Label htmlFor="cur-name">نام واحد پولی</Label>
// //                 <Input
// //                   id="cur-name"
// //                   placeholder="مثلاً: افغانی افغانستان"
// //                   value={form.name}
// //                   onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
// //                   required
// //                 />
// //               </div>

// //               <div className="grid grid-cols-2 gap-3">
// //                 <div className="space-y-1.5 text-right">
// //                   <Label htmlFor="cur-code">کد واحد پولی</Label>
// //                   <Input
// //                     id="cur-code"
// //                     placeholder="مثلاً: AFN"
// //                     dir="ltr"
// //                     value={form.code}
// //                     onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
// //                     required
// //                   />
// //                 </div>

// //                 <div className="space-y-1.5 text-right">
// //                   <Label htmlFor="cur-symbol">سیمبول واحد پولی</Label>
// //                   <Input
// //                     id="cur-symbol"
// //                     placeholder="مثلاً: ؋"
// //                     value={form.symbol}
// //                     onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
// //                     required
// //                   />
// //                 </div>
// //               </div>

// //               <div className="grid grid-cols-2 gap-3">
// //                 <div className="space-y-1.5 text-right">
// //                   <Label htmlFor="cur-rate">نرخ واحد پولی</Label>
// //                   <Input
// //                     id="cur-rate"
// //                     type="number"
// //                     step="any"
// //                     dir="ltr"
// //                     placeholder="0.00"
// //                     value={form.rate}
// //                     onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
// //                     required
// //                   />
// //                 </div>

// //                 <div className="space-y-1.5 text-right">
// //                   <Label htmlFor="cur-status">وضعیت واحد پولی</Label>
// //                   <Select
// //                     value={form.status}
// //                     onValueChange={(v) =>
// //                       setForm((f) => ({ ...f, status: v as CurrencyStatus }))
// //                     }
// //                   >
// //                     <SelectTrigger id="cur-status">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="active">فعال</SelectItem>
// //                       <SelectItem value="inactive">غیرفعال</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             </div>

// //             <DialogFooter>
// //               <Button type="submit">{editingId ? "ذخیره تغییرات" : "افزودن واحد پولی"}</Button>
// //               <DialogClose
// //                 render={<Button type="button" variant="outline" />}
// //               >
// //                 انصراف
// //               </DialogClose>
// //             </DialogFooter>
// //           </form>
// //         </DialogContent>
// //       </Dialog>
// //     </div>
// //   );
// // }


// "use client";

// import { useMemo, useState } from "react";
// import { Plus, Search, Pencil, Trash2, Coins } from "lucide-react";

// import { PageHeader } from "@/components/server/dashboard/page-header";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
//   DialogClose,
// } from "@/components/ui/dialog";
// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableRow,
//   TableHead,
//   TableCell,
// } from "@/components/ui/table";

// type CurrencyStatus = "active" | "inactive";

// interface Currency {
//   id: string;
//   name: string;
//   code: string;
//   symbol: string;
//   rate: string;
//   status: CurrencyStatus;
// }

// const initialCurrencies: Currency[] = [
//   { id: "CUR-01", name: "افغانی افغانستان", code: "AFN", symbol: "؋", rate: "1", status: "active" },
//   { id: "CUR-02", name: "دلار آمریکا", code: "USD", symbol: "$", rate: "70.50", status: "active" },
//   { id: "CUR-03", name: "تومان ایران", code: "IRT", symbol: "تومان", rate: "0.0017", status: "active" },
//   { id: "CUR-04", name: "روپیه پاکستان", code: "PKR", symbol: "₨", rate: "0.25", status: "inactive" },
//   { id: "CUR-05", name: "یورو", code: "EUR", symbol: "€", rate: "76.20", status: "active" },
// ];

// const emptyForm = { name: "", code: "", symbol: "", rate: "", status: "active" as CurrencyStatus };

// export default function CurrenciesPage() {
//   const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
//   const [query, setQuery] = useState("");
//   const [filter, setFilter] = useState<"all" | CurrencyStatus>("all");

//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [form, setForm] = useState(emptyForm);

//   const filtered = useMemo(() => {
//     return currencies.filter((c) => {
//       const matchesFilter = filter === "all" || c.status === filter;
//       const matchesQuery =
//         query.trim() === "" ||
//         c.name.includes(query) ||
//         c.code.toLowerCase().includes(query.toLowerCase());
//       return matchesFilter && matchesQuery;
//     });
//   }, [currencies, query, filter]);

//   function openCreateDialog() {
//     setEditingId(null);
//     setForm(emptyForm);
//     setDialogOpen(true);
//   }

//   function openEditDialog(currency: Currency) {
//     setEditingId(currency.id);
//     setForm({
//       name: currency.name,
//       code: currency.code,
//       symbol: currency.symbol,
//       rate: currency.rate,
//       status: currency.status,
//     });
//     setDialogOpen(true);
//   }

//   function handleDelete(id: string) {
//     setCurrencies((prev) => prev.filter((c) => c.id !== id));
//   }

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     if (editingId) {
//       setCurrencies((prev) =>
//         prev.map((c) => (c.id === editingId ? { ...c, ...form } : c))
//       );
//     } else {
//       const newCurrency: Currency = {
//         id: `CUR-${String(currencies.length + 1).padStart(2, "0")}`,
//         ...form,
//       };
//       setCurrencies((prev) => [newCurrency, ...prev]);
//     }

//     setDialogOpen(false);
//   }

//   return (
//     <div>
//       <PageHeader
//         title="واحدهای پولی"
//         description="مدیریت واحدهای پولی و نرخ تبدیل آن‌ها"
//         action={
//           <Button onClick={openCreateDialog}>
//             <Plus data-icon="inline-start" />
//             واحد پولی جدید
//           </Button>
//         }
//       />

//       <Card className="p-0">
//         <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h2 className="text-sm font-semibold text-foreground">همه واحدهای پولی</h2>
//           </div>

//           <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
//             <div className="relative">
//               <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 placeholder="جستجوی واحد پولی..."
//                 className="w-full pr-8 sm:w-56"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//               />
//             </div>

//             <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
//               <TabsList>
//                 <TabsTrigger value="all">همه</TabsTrigger>
//                 <TabsTrigger value="active">فعال</TabsTrigger>
//                 <TabsTrigger value="inactive">غیرفعال</TabsTrigger>
//               </TabsList>
//             </Tabs>
//           </div>
//         </div>

//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>کد</TableHead>
//               <TableHead>نام واحد پولی</TableHead>
//               <TableHead>سیمبول</TableHead>
//               <TableHead>نرخ تبدیل</TableHead>
//               <TableHead>وضعیت</TableHead>
//               <TableHead className="text-left">عملیات</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filtered.map((currency) => (
//               <TableRow
//                 key={currency.id}
//                 className="cursor-pointer"
//                 onClick={() => openEditDialog(currency)}
//               >
//                 <TableCell className="font-medium text-foreground">{currency.code}</TableCell>
//                 <TableCell>
//                   <div className="flex items-center gap-2">
//                     <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
//                       <Coins className="h-3.5 w-3.5 text-muted-foreground" />
//                     </div>
//                     <span className="font-medium text-foreground">{currency.name}</span>
//                   </div>
//                 </TableCell>
//                 <TableCell className="text-muted-foreground">{currency.symbol}</TableCell>
//                 <TableCell className="font-medium text-foreground">{currency.rate}</TableCell>
//                 <TableCell>
//                   <Badge variant={currency.status === "active" ? "success" : "secondary"}>
//                     {currency.status === "active" ? "فعال" : "غیرفعال"}
//                   </Badge>
//                 </TableCell>
//                 <TableCell className="text-left">
//                   <div className="flex items-center justify-end gap-1">
//                     <Button
//                       variant="ghost"
//                       size="icon-sm"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         openEditDialog(currency);
//                       }}
//                     >
//                       <Pencil className="h-3.5 w-3.5" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="icon-sm"
//                       className="text-destructive hover:bg-destructive/10 hover:text-destructive"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDelete(currency.id);
//                       }}
//                     >
//                       <Trash2 className="h-3.5 w-3.5" />
//                     </Button>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             ))}

//             {filtered.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
//                   واحد پولی‌ای یافت نشد
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </Card>

//       {/* مودال افزودن / ویرایش واحد پولی */}
//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent>
//           {/* <form onSubmit={handleSubmit} className="space-y-4">
//             <DialogHeader>
//               <DialogTitle>
//                 {editingId ? "ویرایش واحد پولی" : "افزودن واحد پولی جدید"}
//               </DialogTitle>
//               <DialogDescription>
//                 اطلاعات واحد پولی و نرخ تبدیل آن را وارد کنید
//               </DialogDescription>
//             </DialogHeader>

//             <div className="space-y-3">
//               <div className="space-y-1.5 text-right">
//                 <Label htmlFor="cur-name">نام واحد پولی</Label>
//                 <Input
//                   id="cur-name"
//                   placeholder="مثلاً: افغانی افغانستان"
//                   value={form.name}
//                   onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
//                   required
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5 text-right">
//                   <Label htmlFor="cur-code">کد واحد پولی</Label>
//                   <Input
//                     id="cur-code"
//                     placeholder="مثلاً: AFN"
//                     dir="ltr"
//                     value={form.code}
//                     onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
//                     required
//                   />
//                 </div>

//                 <div className="space-y-1.5 text-right">
//                   <Label htmlFor="cur-symbol">سیمبول واحد پولی</Label>
//                   <Input
//                     id="cur-symbol"
//                     placeholder="مثلاً: ؋"
//                     value={form.symbol}
//                     onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5 text-right">
//                   <Label htmlFor="cur-rate">نرخ واحد پولی</Label>
//                   <Input
//                     id="cur-rate"
//                     type="number"
//                     step="any"
//                     dir="ltr"
//                     placeholder="0.00"
//                     value={form.rate}
//                     onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
//                     required
//                   />
//                 </div>

//                 <div className="space-y-1.5 text-right">
//                   <Label htmlFor="cur-status">وضعیت واحد پولی</Label>
//                   <Select
//                     value={form.status}
//                     onValueChange={(v) =>
//                       setForm((f) => ({ ...f, status: v as CurrencyStatus }))
//                     }
//                   >
//                     <SelectTrigger id="cur-status">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="active">فعال</SelectItem>
//                       <SelectItem value="inactive">غیرفعال</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </div>

//             <DialogFooter>
//               <Button type="submit">{editingId ? "ذخیره تغییرات" : "افزودن واحد پولی"}</Button>
//               <DialogClose
//                 render={<Button type="button" variant="outline" />}
//               >
//                 انصراف
//               </DialogClose>
//             </DialogFooter>
//           </form> */}

//           <form onSubmit={handleSubmit} className="space-y-6">
//   <DialogHeader>
//     <DialogTitle>
//       {editingId ? "ویرایش واحد پولی" : "افزودن واحد پولی جدید"}
//     </DialogTitle>

//     <DialogDescription>
//       اطلاعات واحد پولی و نرخ تبدیل آن را وارد کنید
//     </DialogDescription>
//   </DialogHeader>

//   <div className="space-y-5">
//     {/* نام واحد پولی */}
//     <div className="space-y-2 text-right">
//       <Label htmlFor="cur-name">نام واحد پولی</Label>
//       <Input
//         id="cur-name"
//         placeholder="مثلاً: افغانی افغانستان"
//         value={form.name}
//         onChange={(e) =>
//           setForm((f) => ({ ...f, name: e.target.value }))
//         }
//         required
//       />
//     </div>

//     {/* کد و سیمبول */}
//     <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//       <div className="space-y-2 text-right">
//         <Label htmlFor="cur-code">کد واحد پولی</Label>
//         <Input
//           id="cur-code"
//           placeholder="مثلاً: AFN"
//           dir="ltr"
//           value={form.code}
//           onChange={(e) =>
//             setForm((f) => ({ ...f, code: e.target.value }))
//           }
//           required
//         />
//       </div>

//       <div className="space-y-2 text-right">
//         <Label htmlFor="cur-symbol">سیمبول واحد پولی</Label>
//         <Input
//           id="cur-symbol"
//           placeholder="مثلاً: ؋"
//           value={form.symbol}
//           onChange={(e) =>
//             setForm((f) => ({ ...f, symbol: e.target.value }))
//           }
//           required
//         />
//       </div>
//     </div>

//     {/* نرخ و وضعیت */}
//     <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//       <div className="space-y-2 text-right">
//         <Label htmlFor="cur-rate">نرخ واحد پولی</Label>
//         <Input
//           id="cur-rate"
//           type="number"
//           step="any"
//           dir="ltr"
//           placeholder="0.00"
//           value={form.rate}
//           onChange={(e) =>
//             setForm((f) => ({ ...f, rate: e.target.value }))
//           }
//           required
//         />
//       </div>

//       <div className="space-y-2 text-right">
//         <Label htmlFor="cur-status">وضعیت واحد پولی</Label>
//         <Select
//           value={form.status}
//           onValueChange={(v) =>
//             setForm((f) => ({
//               ...f,
//               status: v as CurrencyStatus,
//             }))
//           }
//         >
//           <SelectTrigger id="cur-status">
//             <SelectValue />
//           </SelectTrigger>

//           <SelectContent>
//             <SelectItem value="active">فعال</SelectItem>
//             <SelectItem value="inactive">غیرفعال</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   </div>

//   <DialogFooter>
//     <Button type="submit">
//       {editingId ? "ذخیره تغییرات" : "افزودن واحد پولی"}
//     </Button>

//     <DialogClose
//       render={<Button type="button" variant="outline" />}
//     >
//       انصراف
//     </DialogClose>
//   </DialogFooter>
// </form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }



"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Coins } from "lucide-react";

import { PageHeader } from "@/components/server/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type CurrencyStatus = "active" | "inactive";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  rate: string;
  status: CurrencyStatus;
}

const initialCurrencies: Currency[] = [
  { id: "CUR-01", name: "افغانی افغانستان", code: "AFN", symbol: "؋", rate: "1", status: "active" },
  { id: "CUR-02", name: "دلار آمریکا", code: "USD", symbol: "$", rate: "70.50", status: "active" },
  { id: "CUR-03", name: "تومان ایران", code: "IRT", symbol: "تومان", rate: "0.0017", status: "active" },
  { id: "CUR-04", name: "روپیه پاکستان", code: "PKR", symbol: "₨", rate: "0.25", status: "inactive" },
  { id: "CUR-05", name: "یورو", code: "EUR", symbol: "€", rate: "76.20", status: "active" },
];

const emptyForm = { name: "", code: "", symbol: "", rate: "", status: "active" as CurrencyStatus };

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | CurrencyStatus>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return currencies.filter((c) => {
      const matchesFilter = filter === "all" || c.status === filter;
      const matchesQuery =
        query.trim() === "" ||
        c.name.includes(query) ||
        c.code.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [currencies, query, filter]);

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(currency: Currency) {
    setEditingId(currency.id);
    setForm({
      name: currency.name,
      code: currency.code,
      symbol: currency.symbol,
      rate: currency.rate,
      status: currency.status,
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setCurrencies((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      setCurrencies((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...form } : c))
      );
    } else {
      const newCurrency: Currency = {
        id: `CUR-${String(currencies.length + 1).padStart(2, "0")}`,
        ...form,
      };
      setCurrencies((prev) => [newCurrency, ...prev]);
    }

    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="واحدهای پولی"
        description="مدیریت واحدهای پولی و نرخ تبدیل آن‌ها"
        action={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            واحد پولی جدید
          </Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">همه واحدهای پولی</h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی واحد پولی..."
                className="w-full pr-8 sm:w-56"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
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
              <TableHead>کد</TableHead>
              <TableHead>نام واحد پولی</TableHead>
              <TableHead>سیمبول</TableHead>
              <TableHead>نرخ تبدیل</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((currency) => (
              <TableRow
                key={currency.id}
                className="cursor-pointer"
                onClick={() => openEditDialog(currency)}
              >
                <TableCell className="font-medium text-foreground">{currency.code}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{currency.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{currency.symbol}</TableCell>
                <TableCell className="font-medium text-foreground">{currency.rate}</TableCell>
                <TableCell>
                  <Badge variant={currency.status === "active" ? "success" : "secondary"}>
                    {currency.status === "active" ? "فعال" : "غیرفعال"}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(currency);
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
                        handleDelete(currency.id);
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
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  واحد پولی‌ای یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال افزودن / ویرایش واحد پولی */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "ویرایش واحد پولی" : "افزودن واحد پولی جدید"}
              </DialogTitle>
              <DialogDescription>
                اطلاعات واحد پولی و نرخ تبدیل آن را وارد کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2 text-right">
                <Label htmlFor="cur-name">نام واحد پولی</Label>
                <Input
                  id="cur-name"
                  placeholder="مثلاً: افغانی افغانستان"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="cur-code">کد واحد پولی</Label>
                  <Input
                    id="cur-code"
                    placeholder="مثلاً: AFN"
                    dir="ltr"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="cur-symbol">سیمبول واحد پولی</Label>
                  <Input
                    id="cur-symbol"
                    placeholder="مثلاً: ؋"
                    value={form.symbol}
                    onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="cur-rate">نرخ واحد پولی</Label>
                  <Input
                    id="cur-rate"
                    type="number"
                    step="any"
                    dir="ltr"
                    placeholder="0.00"
                    value={form.rate}
                    onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="cur-status">وضعیت واحد پولی</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as CurrencyStatus }))
                    }
                  >
                    <SelectTrigger id="cur-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">فعال</SelectItem>
                      <SelectItem value="inactive">غیرفعال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">{editingId ? "ذخیره تغییرات" : "افزودن واحد پولی"}</Button>
              <DialogClose
                render={<Button type="button" variant="outline" />}
              >
                انصراف
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
