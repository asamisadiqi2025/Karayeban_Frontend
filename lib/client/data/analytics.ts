const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export const pageViewsOverTime = months.map((month, i) => ({
  month,
  views: Math.round(38000 + i * 6200 + Math.sin(i * 1.1) * 5200),
}));

export const revenueByCategory = [
  { label: "Templates", value: 42, color: "#16a34a" },
  { label: "Licenses", value: 28, color: "#0d9488" },
  { label: "Components", value: 18, color: "#3b82f6" },
  { label: "Modules", value: 12, color: "#a855f7" },
];

export const topPages = [
  { page: "/products/pro-dashboard", views: "12,847", unique: "8,392", bounce: "28%" },
  { page: "/products/enterprise", views: "9,234", unique: "6,128", bounce: "31%" },
  { page: "/pricing", views: "8,456", unique: "5,843", bounce: "24%" },
  { page: "/docs/getting-started", views: "7,123", unique: "4,891", bounce: "18%" },
  { page: "/blog/nextjs-guide", views: "5,892", unique: "3,746", bounce: "35%" },
];

export const topCountries = [
  { label: "United States", value: 30, display: "12,847 · 30%" },
  { label: "United Kingdom", value: 15, display: "6,423 · 15%" },
  { label: "Germany", value: 12, display: "5,134 · 12%" },
  { label: "Canada", value: 9, display: "3,847 · 9%" },
  { label: "France", value: 7, display: "2,983 · 7%" },
  { label: "Australia", value: 6, display: "2,561 · 6%" },
];
