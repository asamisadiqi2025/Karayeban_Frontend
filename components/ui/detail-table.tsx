import * as React from "react";

import { cn } from "@/lib/shared/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

type DetailRow = {
  label: string;
  value: React.ReactNode;
  dir?: "rtl" | "ltr";
};

/**
 * جهت نمایش مقدار.
 *
 * مقدارهای متنی فارسی (مثل «۸ میزان ۱۴۰۵ — ساعت ۱۱:۱۰» یا «۵ سال») باید در
 * پایه‌ی راست‌به‌چپ چیده شوند، وگرنه بخش‌های راست‌به‌چپ جابه‌جا می‌شوند.
 * فقط مقدارهای کاملاً عددی/لاتین (مثل «۹٬۰۰۰ USD») به پایه‌ی چپ‌به‌راست نیاز دارند.
 */
function valueDir(value: React.ReactNode): "rtl" | "ltr" {
  if (typeof value !== "string") return "rtl";
  return /[\u0600-\u06FF]/.test(value) ? "rtl" : "ltr";
}

/**
 * جدول دو ستونیِ برچسب/مقدار برای صفحه‌های جزییات.
 *
 * برخلاف جدول‌های فهرست، این جدول ستون‌های کمی دارد و عرض ستون برچسب ثابت
 * است، پس در نمایشگر کوچک شکسته نمی‌شود: مقدارها به‌جای اسکرول افقی، در
 * سلول خودشان می‌شکنند.
 */
function DetailTable({
  rows,
  caption,
  className,
}: {
  rows: DetailRow[];
  caption?: React.ReactNode;
  className?: string;
}) {
  return (
    <Table className={cn("table-fixed", className)}>
      {caption ? (
        <TableCaption className="my-0 px-4 pt-4 text-right font-semibold text-foreground">
          {caption}
        </TableCaption>
      ) : null}

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableHead
              scope="row"
              className="h-auto w-2/5 px-4 py-3 text-right align-middle font-medium whitespace-normal text-muted-foreground sm:w-1/3 lg:w-1/4"
            >
              {row.label}
            </TableHead>
            <TableCell
              dir={row.dir ?? valueDir(row.value)}
              className="px-4 py-3 text-right align-middle font-medium break-words whitespace-normal text-foreground"
            >
              {row.value}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { DetailTable, type DetailRow };