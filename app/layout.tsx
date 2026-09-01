import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/client/theme-provider"
import { AuthProvider } from "@/contexts/auth-context";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "کرایبان",
  description: "سیستم مدیریت مارکت کرایبان",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      className={`${vazirmatn.variable} h-full antialiased`}
      dir="rtl"
      suppressHydrationWarning
    >
      <body className={`${vazirmatn.className} min-h-full flex flex-col`}>
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
