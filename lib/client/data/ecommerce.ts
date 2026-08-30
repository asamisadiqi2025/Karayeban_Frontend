const days = ["Feb 1", "Feb 5", "Feb 10", "Feb 15", "Feb 20", "Feb 25", "Mar 1"];

export const salesOverview = days.map((day, i) => ({
  day,
  revenue: Math.round(3200 + i * 900 + Math.sin(i) * 700),
  orders: Math.round(28 + i * 6 + Math.cos(i) * 5),
  profit: Math.round(1100 + i * 380 + Math.sin(i * 0.7) * 260),
}));

export const orderStatus = [
  { label: "Completed", value: 584, color: "#16a34a" },
  { label: "Processing", value: 234, color: "#3b82f6" },
  { label: "Pending", value: 127, color: "#f59e0b" },
  { label: "Cancelled", value: 47, color: "#e11d48" },
];

export const topSellingProducts = [
  { rank: 1, product: "Pro Dashboard Template", category: "Templates", sold: 342, revenue: "$17,100" },
  { rank: 2, product: "Enterprise License", category: "Licenses", sold: 156, revenue: "$12,480" },
  { rank: 3, product: "UI Component Kit", category: "Components", sold: 289, revenue: "$8,670" },
  { rank: 4, product: "Admin Starter Pack", category: "Templates", sold: 198, revenue: "$7,920" },
  { rank: 5, product: "Analytics Module", category: "Modules", sold: 134, revenue: "$5,360" },
  { rank: 6, product: "Email Template Pack", category: "Templates", sold: 267, revenue: "$4,005" },
];

export const salesByCategory = [
  { category: "Templates", revenue: 29025 },
  { category: "Licenses", revenue: 12480 },
  { category: "Components", revenue: 8670 },
  { category: "Modules", revenue: 5360 },
];

export const recentTransactions = [
  { customer: "Sarah Chen", product: "Pro Dashboard Template", amount: "$49.99", status: "completed", date: "Feb 22" },
  { customer: "Marcus Johnson", product: "Enterprise License", amount: "$199.99", status: "completed", date: "Feb 22" },
  { customer: "Priya Sharma", product: "UI Component Kit", amount: "$29.99", status: "processing", date: "Feb 21" },
  { customer: "Alex Rivera", product: "Admin Starter Pack", amount: "$39.99", status: "completed", date: "Feb 21" },
  { customer: "Emma Taylor", product: "Analytics Module", amount: "$39.99", status: "pending", date: "Feb 20" },
  { customer: "David Park", product: "Email Template Pack", amount: "$14.99", status: "cancelled", date: "Feb 20" },
];

export const revenueTargets = [
  { label: "Monthly Revenue", current: 128430, target: 150000, format: (v: number) => `$${v.toLocaleString()}` },
  { label: "Orders", current: 992, target: 1200 },
  { label: "New Customers", current: 347, target: 500 },
];
