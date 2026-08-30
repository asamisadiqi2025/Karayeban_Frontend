export const sparkRevenue = [12, 14, 11, 15, 13, 17, 16, 19, 18, 22, 20, 24].map((v) => ({ v }));
export const sparkUsers = [8, 9, 7, 10, 9, 11, 10, 12, 11, 13, 12, 14].map((v) => ({ v }));
export const sparkOrders = [18, 16, 17, 15, 16, 14, 15, 13, 14, 12, 13, 12].map((v) => ({ v }));
export const sparkViews = [5, 6, 6, 7, 8, 9, 10, 12, 13, 15, 17, 19].map((v) => ({ v }));

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const overviewData = months.map((month, i) => ({
  month,
  revenue: Math.round(18000 + i * 2600 + Math.sin(i * 1.3) * 4200),
  orders: Math.round(600 + i * 60 + Math.cos(i) * 90),
  profit: Math.round(6000 + i * 900 + Math.sin(i * 0.8) * 1400),
}));

export const trafficSources = [
  { name: "Direct", value: 35, color: "#16a34a" },
  { name: "Organic", value: 28, color: "#0d9488" },
  { name: "Referral", value: 22, color: "#3b82f6" },
  { name: "Social", value: 15, color: "#a855f7" },
];

export const monthlyGoals = [
  { label: "Monthly Revenue", current: 48295, target: 55000 },
  { label: "New Customers", current: 342, target: 500 },
  { label: "Orders Completed", current: 1432, target: 1600 },
];
