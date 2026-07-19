import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karayeban System",
  description: "Market Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden bg-gray-50">
          
          <Sidebar />

          <div className="flex-1 flex flex-col overflow-hidden">
            
            <Header />

            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>

          </div>

        </div>
      </body>
    </html>
  );
}