"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";

function formatCount(value: number): string {
  return value.toLocaleString("fa-AF");
}

interface PaginationBarProps {
  /** شماره‌ی اولین ردیف این صفحه (نه صفر-پایه). */
  from: number;
  /** شماره‌ی آخرین ردیف این صفحه. */
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * نوار صفحه‌بندی.
 *
 * بازه‌ی ردیف‌ها و نسبت صفحه با `dir="ltr"` جدا می‌شوند، وگرنه در متن
 * راست‌به‌چپ ترتیب بخش‌ها معکوس می‌شود («۱–۳» به شکل «۳–۱» دیده می‌شود).
 */
export function PaginationBar({
  from,
  to,
  total,
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationBarProps) {
  const last = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), last);

  function go(next: number) {
    onPageChange(Math.min(Math.max(1, next), last));
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        نشان دادن{" "}
        <span dir="ltr" className="font-medium text-foreground">
          {formatCount(from)}–{formatCount(to)}
        </span>{" "}
        از{" "}
        <span className="font-medium text-foreground">{formatCount(total)}</span>{" "}
        مورد — صفحه {formatCount(current)} از {formatCount(last)}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={current === 1 || disabled}
          onClick={() => go(1)}
          aria-label="صفحه اول"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={current === 1 || disabled}
          onClick={() => go(current - 1)}
          aria-label="صفحه قبل"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <span
          dir="ltr"
          className="mx-1 min-w-[60px] text-center text-xs font-medium text-foreground"
        >
          {formatCount(current)} / {formatCount(last)}
        </span>

        <Button
          variant="outline"
          size="icon-sm"
          disabled={current === last || disabled}
          onClick={() => go(current + 1)}
          aria-label="صفحه بعد"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={current === last || disabled}
          onClick={() => go(last)}
          aria-label="صفحه آخر"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
