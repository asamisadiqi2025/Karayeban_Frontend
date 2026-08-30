import * as React from "react";

import { cn } from "@/lib/shared/utils";
import { LogoMark } from "@/components/server/icons/logo-mark";

interface LogoProps extends React.ComponentProps<"div"> {
  /** فقط نشان (بدون نوشته) — برای حالت جمع‌شده سایدبار */
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const badgeSize = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-9 w-9 rounded-lg",
  lg: "h-11 w-11 rounded-xl",
};

const iconSize = {
  sm: "h-[18px] w-[18px]",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const textSize = {
  sm: "text-base",
  md: "text-[17px]",
  lg: "text-xl",
};

function Logo({ iconOnly = false, size = "md", className, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} {...props}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary",
          badgeSize[size]
        )}
      >
        <LogoMark className={cn("text-white", iconSize[size])} />
      </div>

      {!iconOnly && (
        <span className={cn("font-brand font-bold leading-none text-white", textSize[size])}>
          کرایه‌بان
        </span>
      )}
    </div>
  );
}

export { Logo };
