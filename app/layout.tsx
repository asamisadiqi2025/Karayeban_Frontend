import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/client/theme-provider"
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "کرایبان",
  description: "سیستم مدیریت مارکت کرایبان",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" className="h-full antialiased" dir="rtl" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider></body>
    </html>
  );
}
