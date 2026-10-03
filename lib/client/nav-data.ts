

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
            label: "اجاره تکی",
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
        href: "/meters/electricity",
        icon: BellElectric,
        submenu: [
          {
            label: "میترها",
            href: "/meters/electricity",
          },
          {
            label: "تعین دروه میتر خوانی",
            href: "/meters/electricity/billing-cycles",
          },
          {
            label: "یک بیل برق",
            href: "/meters/electricity/bills/one",
          },
          {
            label: "چندین بیل برق",
            href: "/meters/electricity/bills/bulk",
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
            label: "جزئیات حساب",
            href: "/finance/account-detail",
          },
          {
            label: "صورت حساب بانکی",
            href: "/finance/account-statement",
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
          {
            label: "انتقال بین گدام‌ها",
            href: "/inventory/transactions/transfer",
          },
          {
            label: "موجودی انبار",
            href: "/inventory/stock-balance",
          },
          {
            label: "صورت موجودی جنس",
            href: "/inventory/stock-balance/item",
          }
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
          {
            label: "افزودن زیردسته",
            href: "/expenses/categories/subcategory",
          },
        ],
      },

      // دارایی‌های ثابت
      {
        label: "دارایی‌های ثابت",
        href: "/assets",
        icon: Landmark,
        submenu: [
          {
            label: "دارایی‌ها",
            href: "/assets",
          },
          {
            label: "خلاصه دارایی‌ها",
            href: "/assets/summary",
          },
        ],
      },

      // گزارشات
      {
        label: "گزارشات",
        href: "/reports",
        icon: BarChart3,
        submenu: [
          {
            label: "خلاصه مالی",
            href: "/reports/financials",
          },
          {
            label: "موجودی حساب‌ها",
            href: "/reports/balances",
          },
          {
            label: "گزارش مصارف",
            href: "/reports/expenses",
          },
          {
            label: "گزارش اجاره ها",
            href: "/reports/rent",
          },
          {
            label: "گزارش وصول برق",
            href: "/reports/electricity",
          },
          {
            label: "گزارش  دکان‌ها",
            href: "/reports/occupancy",
          },
          {
            label: "گزارش بدهی",
            href: "/reports/debt-aging",
          },
          {
            label: "گزارش سهام",
            href: "/reports/equity",
          },
          {
            label: "گردش گدام",
            href: "/reports/inventory-movement",
          },
       
        ],
      },

       // مدیریت کاربر
      {
        label: "مدیریت کاربر",
        href: "/users",
        icon: Users,
        submenu: [
          {
            label: "کاربران",
            href: "/users",
          },
       
        ],
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
            label: "آپدیت کردن نرخ ارز ها",
            href: "/settings/currencies/updatecurrencyrates",
          },
          {
            label: "طراحی قرارداد",
            href: "/settings/contract-design",
          },
          {
            label: "بانک‌ها",
            href: "/settings/banks",
          },
          {
            label: "اضافه کردن واحدات",
            href: "/settings/units",
          },
          {
            label: "لاگ های سیستم",
            href: "/settings/logs",
          },
        ],
      },
    ],
  },
];

