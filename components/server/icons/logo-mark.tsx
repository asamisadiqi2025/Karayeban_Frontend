import * as React from "react";

/**
 * نشان کرایه‌بان — دو ساختمان همپوشان با خط‌های طبقه
 * با الهام از لوگوی مرجع، ساده‌شده برای نمایش در اندازه کوچک (نوار کناری)
 * به‌صورت یک آیکن سبک Lucide (stroke-based) پیاده‌سازی شده تا با بقیه آیکن‌ها هم‌خوان باشد
 */
function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      {/* ساختمان کوتاه (راست) — زیرلایه */}
      <rect x="12.3" y="10.3" width="8" height="10.7" rx="2.2" fill="currentColor" />
      {/* ساختمان بلند (چپ) — روی ساختمان راست */}
      <rect x="3.5" y="6" width="9" height="15" rx="2.2" fill="currentColor" />

      {/* برش‌ها (پنجره و درگاه) به رنگ زمینه بج، تا به‌صورت حفره دیده شوند */}
      <rect x="5.6" y="9" width="1.8" height="1.1" rx="0.55" fill="var(--primary)" />
      <rect x="5.6" y="11.5" width="1.8" height="1.1" rx="0.55" fill="var(--primary)" />
      <rect x="5.6" y="14" width="1.8" height="1.1" rx="0.55" fill="var(--primary)" />
      <rect x="8" y="16.6" width="3.2" height="4.4" rx="1.6" fill="var(--primary)" />
    </svg>
  );
}

export { LogoMark };
