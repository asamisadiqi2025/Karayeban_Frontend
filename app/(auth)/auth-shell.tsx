"use client";

import type { ReactNode } from "react";
import { Zap } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

// گرید نمادین واحدهای ملکی (آپارتمان/مغازه/انبار) — چند واحد به‌عنوان
// «در حال اجاره» با رنگ سبز فعال سایدبار روشن شده‌اند.

function UnitGrid() {
  const cols = 8;
  const rows = 11;
  const activeIndexes = new Set([9, 22, 35, 48, 61, 74]);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="grid h-full w-full gap-2 p-10"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const active = activeIndexes.has(i);
          return (
            <div
              key={i}
              className={
                active
                  ? "animate-pulse rounded-[3px] bg-sidebar-active-fg/60"
                  : "rounded-[3px] bg-white/[0.035]"
              }
              style={active ? { animationDuration: "3s" } : undefined}
            />
          );
        })}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/10 to-sidebar/60" />
    </div>
  );
}

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div dir="rtl" className="flex min-h-screen w-full bg-background">
      {/* فرم */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>

      {/* پنل برند */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <UnitGrid />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4.5 w-4.5 text-white" fill="white" />
          </div>
          <span className="text-[15px] font-semibold text-white">کرایه‌بان</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="mb-3 text-xs font-semibold tracking-wider text-sidebar-active-fg">
            {eyebrow}
          </p>
          <h2 className="mb-3 text-2xl font-bold leading-snug text-white">{title}</h2>
          <p className="text-sm leading-relaxed text-sidebar-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
