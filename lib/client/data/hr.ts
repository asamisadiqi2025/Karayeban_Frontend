export const headcountByAge = [
  { band: "18–24", women: 18, men: 14 },
  { band: "25–34", women: 62, men: 58 },
  { band: "35–44", women: 41, men: 48 },
  { band: "45–54", women: 22, men: 26 },
  { band: "55+", women: 9, men: 8 },
];

export const orgBreakdown = [
  { label: "Engineering", value: 118, color: "#16a34a" },
  { label: "Sales", value: 64, color: "#3b82f6" },
  { label: "Product & Design", value: 42, color: "#8b5cf6" },
  { label: "Support", value: 38, color: "#f59e0b" },
  { label: "Operations", value: 44, color: "#0d9488" },
];

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
export const hiresAndLeavers = months.map((month, i) => ({
  month,
  hires: 8 + Math.round(Math.sin(i) * 4) + i,
  leavers: 4 + Math.round(Math.cos(i) * 2),
}));

export const openRoles = [
  { role: "Staff Engineer, Platform", dept: "Platform", applicants: 87, age: "34d open", status: "interviewing" },
  { role: "Product Designer", dept: "Product eng", applicants: 142, age: "51d open", status: "offer" },
  { role: "Enterprise AE", dept: "Sales", applicants: 29, age: "12d open", status: "sourcing" },
  { role: "Data Engineer", dept: "Data", applicants: 64, age: "28d open", status: "interviewing" },
  { role: "Support Lead", dept: "Support", applicants: 18, age: "6d open", status: "sourcing" },
];
