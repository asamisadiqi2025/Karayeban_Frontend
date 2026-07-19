"use client";

import { useState } from "react";
import {
  Building2,
  Home,
  Users,
  FileText,
  Coins,
  BarChart3,
  Megaphone,
  Settings,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import karayebanLogo from "@/public/logo.svg";
interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  submenu?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "داشبورد", href: "/" },
  {
    icon: Building2,
    label: "مدیریت املاک",
    href: "/properties",
    submenu: [
      { label: "املاک و طبقات", href: "/properties" },
      { label: "دکان‌ها و واحدها", href: "/properties/units" },
    ],
  },
  {
    icon: Users,
    label: "اشخاص",
    href: "/persons",
    submenu: [
      { label: "مستاجرین", href: "/persons/tenants" },
      { label: "مالکین", href: "/persons/owners" },
    ],
  },
  { icon: FileText, label: "قراردادها", href: "/contracts", badge: 3 },
  {
    icon: Coins,
    label: "مدیریت مالی",
    href: "/finance",
    submenu: [
      { label: "پرداخت‌ها", href: "/finance/payments" },
      { label: "صورت‌حساب‌ها", href: "/finance/invoices" },
    ],
  },
  { icon: BarChart3, label: "گزارشات", href: "/reports" },
  { icon: Megaphone, label: "اعلان‌ها", href: "/announcements", badge: 2 },
  { icon: Settings, label: "تظیمات", href: "/settings" },
];

export default function Sidebar() {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set(["مدیریت املاک"]));
  const pathname = usePathname();

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <aside className="w-[280px] bg-white border-l border-gray-200 flex flex-col h-[628px] sticky top-0 z-30 rounded-md shadow-md">
      {/* Logo */}
    <div className="h-[72px] px-6 flex items-center gap-3 border-b border-gray-100">
  <Image
    src={karayebanLogo}
    alt="karyeban logo"
    width={460}
    height={80}
    className="w-[240px] h-auto object-contain"
    priority
  />
</div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isOpen = openMenus.has(item.label);

          if (item.submenu) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`sidebar-item w-full justify-between ${
                    active ? "active" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={2} className="text-current" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`pr-4 space-y-1 overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {item.submenu.map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          subActive
                            ? "text-indigo-600 font-medium bg-indigo-50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            subActive ? "bg-indigo-600" : "bg-gray-300"
                          }`}
                        />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${active ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={2} className="text-current" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="mr-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
 
    </aside>
  );
}