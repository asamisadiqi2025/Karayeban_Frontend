"use client";

import { useState } from "react";
import type { ElementType, JSX } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import karayebanLogo from "@/public/logo.svg";

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  icon: ElementType;
  label: string;
  href: string;
  badge?: number;
  submenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "داشبورد", href: "/dashboard" },
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

export default function Sidebar(): JSX.Element {
  const [openMenus, setOpenMenus] = useState<Set<string>>(
    new Set(["مدیریت املاک"])
  );
  const pathname = usePathname();

  const toggleMenu = (label: string): void => {
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

  const isActive = (href: string): boolean =>
    pathname === href || Boolean(pathname?.startsWith(href + "/"));

  return (
    <aside className="w-64 bg-card border-l border-border flex flex-col h-[628px] sticky top-0 z-30 rounded-md shadow">
      {/* Logo */}
      <div className="h-12 px-6 flex items-center gap-3 border-b border-border">
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
                  type="button"
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
                    className={`text-gray-300 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Submenu — relative wrapper holds an absolutely-positioned
                    guide line (border on the Y axis) that runs behind the
                    dots, connecting the sub-items like in the Figma design. */}
                <div
                  className={`relative pr-4 space-y-1 overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-3 bottom-3 right-[19px] w-px bg-border"
                  />

                  {item.submenu.map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          subActive
                            ? "text-primary-500 font-medium bg-primary-50"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        {/* Dot: `shrink-0` + `self-center` keep it a perfect
                            6x6 circle instead of stretching into a bar,
                            since the parent flex row defaults to
                            `align-items: stretch`. */}
                        <span
                          className={`shrink-0 self-center rounded-full ${
                            subActive ? "bg-primary-500" : "bg-gray-300"
                          }`}
                          style={{ width: 6, height: 6 }}
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
              {item.badge !== undefined && (
                <span className="mr-auto bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
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
