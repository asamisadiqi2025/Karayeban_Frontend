export const teamSkills = [
  { skill: "Frontend", current: 82, target: 90 },
  { skill: "Backend", current: 74, target: 85 },
  { skill: "DevOps", current: 61, target: 80 },
  { skill: "Design", current: 88, target: 85 },
  { skill: "Testing", current: 55, target: 75 },
  { skill: "Communication", current: 79, target: 80 },
];

export const deviceUsage = [
  { label: "Desktop", value: 54, color: "#16a34a" },
  { label: "Mobile", value: 38, color: "#3b82f6" },
  { label: "Tablet", value: 8, color: "#f59e0b" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
export const conversionTrend = months.map((month, i) => ({
  month,
  rate: +(2.1 + i * 0.18 + Math.sin(i) * 0.15).toFixed(2),
}));

export const weeklySignups = [
  { day: "Mon", signups: 142 },
  { day: "Tue", signups: 168 },
  { day: "Wed", signups: 191 },
  { day: "Thu", signups: 174 },
  { day: "Fri", signups: 205 },
  { day: "Sat", signups: 98 },
  { day: "Sun", signups: 87 },
];

export const revenueVsCost = months.map((month, i) => ({
  month,
  revenue: Math.round(80000 + i * 8500 + Math.sin(i) * 5000),
  cost: Math.round(52000 + i * 5200 + Math.cos(i) * 3000),
}));
