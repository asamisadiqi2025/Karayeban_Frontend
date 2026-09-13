import { Construction } from "lucide-react";

// جایگزین موقت برای مسیرهایی که هنوز صفحه‌ی واقعی ندارند. با وجود این صفحه،
// پیش‌واکشی لینک‌های Next به‌جای ۴۰۴، پاسخ ۲۰۰ می‌گیرد و کلیک کاربر هم به یک
// صفحه‌ی مرتب می‌رسد نه صفحه‌ی خطای پیش‌فرض.
export function ComingSoon({
  title,
  description = "این بخش هنوز در حال توسعه است و به‌زودی در دسترس قرار می‌گیرد.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Construction className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
