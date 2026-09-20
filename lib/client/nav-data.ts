

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
  Warehouse,
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
          // {
          //   label: "املاک و طبقات",
          //   href: "/properties",
          // },
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
            label: "ضامن",
            href: "/persons/guarantor",
          },
        ],
      },


           // مدیریت سهامدران
      {
        label: " مدیریت سهامداران",
        href: "/shareholders-management",
        icon: FileText,
        submenu: [
          {
            label: "سهامداران",
            href: "/shareholders",
          },
          {
            label: "سهامداری",
            href: "/shareholders/equity",
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
            label: "اجاره دکان‌هاو واحدها",
            href: "/rent",
          },
    
        ],
      },

      // مدیریت قراردادها
      {
        label: "مدیریت قراردادها",
        href: "/contracts-management",
        icon: FileText,
        submenu: [
          {
            label: "ساخت قرارداد جدید",
            href: "/contracts",
          },
            {
            label: "تمدید قرارداد",
            href: "/renew-contracts",
          },
         
        ],
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
            label: " انتقال بانکی واحدات یکسان",
            href: "/finance/bank-transfers",
          },
        
          {
            label: "تراکنش‌ها",
            href: "/finance/transactions",
          },
        ],
      },


        // انبار
      {
        label: "گدام",
        href: "/warehouse",
        icon: Warehouse,
        submenu: [
          {
            label: "گدام",
            href: "/warehouse",
          },
          {
            label: "دسته بندی",
            href: "/warehouse/categories",
          },
          {
            label: "اضافه کردن به گدام",
            href: "/warehouse/inventory-items",
          },
          {
            label: "خلاصه اجناس",
            href: "/inventory/items/summary",
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
            label: "طراحی قرارداد",
            href: "/settings/contract-design",
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

