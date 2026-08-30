"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// `redirect()` هنگام `output: "export"` پشتیبانی نمی‌شود و صفحه‌ی ریشه را به
// صفحه‌ی خطای Next تبدیل می‌کند؛ برای همین ریدایرکت سمت کلاینت انجام می‌شود.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
