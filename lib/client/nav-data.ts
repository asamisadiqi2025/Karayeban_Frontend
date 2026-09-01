

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Coins,
  BarChart3,
  Megaphone,
  Settings,
  BellElectric,
  ReceiptText,
  WalletCards,
  Landmark,
} from "lucide-react";

export interface NavSubItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  submenu?: NavSubItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "منوی اصلی",
    items: [
      // داشبورد
      {
        label: "داشبورد",
        href: "/dashboard",
        icon: LayoutDashboard,
      },

      // مدیریت املاک
      {
        label: "مدیریت املاک",
        href: "/properties",
        icon: Building2,
        submenu: [
          {
            label: "املاک و طبقات",
            href: "/properties",
          },
          {
            label: "دکان‌ها، واحدها و بساط‌ها",
            href: "/properties/units",
          },
          {
            label: "طبقات",
            href: "/floors",
          },
        ],
      },

      // اشخاص
      {
        label: "اشخاص",
        href: "/persons",
        icon: Users,
        submenu: [
          {
            label: "مستأجرین",
            href: "/tenants",
          },
          {
            label: "مالکین",
            href: "/owners",
          },
          {
            label: "ضامن",
            href: "/persons/guarantor",
          },
        ],
      },

      // اجاره
      {
        label: "اجاره",
        href: "/rent",
        icon: ReceiptText,
        submenu: [
          {
            label: "اجاره دکان‌ها",
            href: "/rent/shops",
          },
          {
            label: "اجاره واحدها",
            href: "/rent/units",
          },
        ],
      },

      // قراردادها
      {
        label: "قراردادها",
        href: "/contracts",
        icon: FileText,
        badge: "3",
      },

      // برق
      {
        label: "برق",
        href: "/meter",
        icon: BellElectric,
        submenu: [
          {
            label: "میترها",
            href: "/meters/electricity",
          },
          {
            label: "دریافت پول برق",
            href: "/meters/electricity/payments",
          },
        ],
      },

      // مدیریت مالی
      {
        label: "مدیریت مالی",
        href: "/finance",
        icon: WalletCards,
        submenu: [
          {
            label: "پرداخت‌ها",
            href: "/finance/payments",
          },
          {
            label: "صورت‌حساب‌ها",
            href: "/finance/invoices",
          },
          {
            label: "ایجاد بانک",
            href: "/finance/bankaccounts",
          },
          {
            label: "انتقال بانکی",
            href: "/finance/bank-transfers",
          },
          {
            label: "تراکنش‌ها",
            href: "/finance/transactions",
          },
        ],
      },

      // مدیریت مصارف
      {
        label: "مدیریت مصارف",
        href: "/expenses",
        icon: Coins,
        submenu: [
          {
            label: "مصارف",
            href: "/expenses",
          },
          {
            label: "دسته‌بندی مصارف",
            href: "/expenses/categories",
          },
        ],
      },

      // دارایی‌های ثابت
      {
        label: "دارایی‌های ثابت",
        href: "/assets",
        icon: Landmark,
      },

      // گزارشات
      {
        label: "گزارشات",
        href: "/reports",
        icon: BarChart3,
      },

      // اعلان‌ها
      {
        label: "اعلان‌ها",
        href: "/announcements",
        icon: Megaphone,
        badge: "2",
      },

      // تنظیمات
      {
        label: "تنظیمات",
        href: "/settings",
        icon: Settings,
        submenu: [
          {
            label: "واحدهای پولی",
            href: "/settings/currencies",
          },
          {
            label: "دالر به واحد پولی",
            href: "/settings/currencies/adtocurrency",
          },
          {
            label: "تنطیمات قرار داد",
            href: "/settings/contract-setup",
          },
          {
            label: "بانک‌ها",
            href: "/settings/banks",
          },
        ],
      },
    ],
  },
];

