"use client";

import { DollarSign, Users, ShoppingCart, Eye } from "lucide-react";

import { StatCard } from "@/components/client/dashboard/stat-card";
import { OverviewChart } from "@/components/client/dashboard/overview-chart";
import { TrafficSources } from "@/components/client/dashboard/traffic-sources";
import { MonthlyGoals } from "@/components/client/dashboard/monthly-goals";
import {
  sparkRevenue,
  sparkUsers,
  sparkOrders,
  sparkViews,
} from "@/lib/client/dashboard-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, Aigars. Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value="$48,295"
          change="+12.5%"
          positive
          icon={DollarSign}
          iconBg="#ecfdf5"
          iconColor="#16a34a"
          strokeColor="#16a34a"
          data={sparkRevenue}
        />
        <StatCard
          label="Active Users"
          value="2,847"
          change="+8.2%"
          positive
          icon={Users}
          iconBg="#eff6ff"
          iconColor="#3b82f6"
          strokeColor="#3b82f6"
          data={sparkUsers}
        />
        <StatCard
          label="Total Orders"
          value="1,432"
          change="-3.1%"
          positive={false}
          icon={ShoppingCart}
          iconBg="#eff6ff"
          iconColor="#3b82f6"
          strokeColor="#3b82f6"
          data={sparkOrders}
        />
        <StatCard
          label="Page Views"
          value="284K"
          change="+24.7%"
          positive
          icon={Eye}
          iconBg="#fff7ed"
          iconColor="#f59e0b"
          strokeColor="#f59e0b"
          data={sparkViews}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OverviewChart />
        </div>
        <div className="flex flex-col gap-4">
          <TrafficSources />
          <MonthlyGoals />
        </div>
      </div>
    </div>
  );
}
