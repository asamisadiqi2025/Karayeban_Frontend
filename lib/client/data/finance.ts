const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export const cashFlow = months.map((month, i) => ({
  month,
  balance: Math.round(340000 + i * 6000 + Math.sin(i * 1.4) * 22000),
}));

export const profitAndLoss = months.map((month, i) => ({
  month,
  revenue: Math.round(180000 + i * 9000 + Math.sin(i) * 8000),
  costs: Math.round(140000 + i * 6500 + Math.cos(i) * 6000),
}));

export const receivables = [
  { invoice: "INV-3041", client: "Northwind Ltd", amount: "$24,800", due: "12d overdue", status: "overdue" },
  { invoice: "INV-3038", client: "Grayson Media", amount: "$18,200", due: "3d overdue", status: "overdue" },
  { invoice: "INV-3052", client: "Halcyon Labs", amount: "$31,400", due: "in 4d", status: "due" },
  { invoice: "INV-3055", client: "Orbit Freight", amount: "$12,900", due: "in 11d", status: "due" },
  { invoice: "INV-3029", client: "Vertex Analytics", amount: "$44,600", due: "Today", status: "paid" },
];

export const ageing = [
  { label: "Current", value: 88.9, display: "$88.9k" },
  { label: "1–30 days", value: 43, display: "$43k" },
  { label: "31–60 days", value: 18.2, display: "$18.2k" },
  { label: "61–90 days", value: 9.4, display: "$9.4k" },
  { label: "90+ days", value: 4.1, display: "$4.1k" },
];
