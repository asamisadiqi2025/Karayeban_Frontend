"use client";

import { DollarSign, Users, Store, Zap } from "lucide-react";

import { StatCard } from "@/components/client/dashboard/stat-card";
import { OverviewChart } from "@/components/client/dashboard/overview-chart";
import { ShopStatus } from "@/components/client/dashboard/traffic-sources";
import { RecentActivity } from "@/components/client/dashboard/recent-activity";
import { InventorySummaryCard } from "@/components/client/dashboard/inventory-summary-card";
import { RecentTransactions } from "@/components/client/dashboard/recent-transactions";
import { ExpensesOverview } from "@/components/client/dashboard/expenses-overview";
import {
  sparkRevenue,
  sparkTenants,
  sparkShops,
  sparkElectricity,
} from "@/lib/client/dashboard-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">داشبورد</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            خوش آمدید! نمای کلی مدیریت مارکت گالریا سنتر
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {new Date().toLocaleDateString("fa-AF", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="مجموع عایدات"
          value="۱،۲۸۳،۴۹۵ افغانی"
          change="+12.5%"
          positive
          icon={DollarSign}
          iconBg="#ecfdf5"
          iconColor="#16a34a"
          strokeColor="#16a34a"
          data={sparkRevenue}
        />
        <StatCard
          label="مستاجران فعال"
          value="۸۲"
          change="+8.2%"
          positive
          icon={Users}
          iconBg="#eff6ff"
          iconColor="#3b82f6"
          strokeColor="#3b82f6"
          data={sparkTenants}
        />
        <StatCard
          label="دوکان‌های اجاره"
          value="۶۸"
          change="+4.1%"
          positive
          icon={Store}
          iconBg="#fff7ed"
          iconColor="#f59e0b"
          strokeColor="#f59e0b"
          data={sparkShops}
        />
        <StatCard
          label="مصارف برق"
          value="۳۴۲٬۰۰۰ افغانی"
          change="-3.1%"
          positive={false}
          icon={Zap}
          iconBg="#fef2f2"
          iconColor="#e11d48"
          strokeColor="#e11d48"
          data={sparkElectricity}
        />
      </div>

      {/* Overview Chart + Shop Status */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OverviewChart />
        </div>
        <ShopStatus />
      </div>

      {/* Warehouse Summary + Recent Transactions + Expenses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <InventorySummaryCard />
        <RecentTransactions />
        <ExpensesOverview />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
