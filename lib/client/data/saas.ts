const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

export const mrrGrowth = months.map((month, i) => ({
  month,
  mrr: Math.round(184000 + i * 12500 + Math.sin(i) * 4000),
  arr: Math.round((184000 + i * 12500 + Math.sin(i) * 4000) * 12),
}));

export const planMix = [
  { label: "Enterprise", value: 42, color: "#16a34a" },
  { label: "Team", value: 31, color: "#3b82f6" },
  { label: "Pro", value: 18, color: "#8b5cf6" },
  { label: "Free", value: 9, color: "#f59e0b" },
];

export const topAccounts = [
  { account: "Nexora Corp", plan: "Enterprise", seats: 240, mrr: "$14,400", health: "on track" },
  { account: "Stratus Health", plan: "Enterprise", seats: 180, mrr: "$10,800", health: "on track" },
  { account: "Orion Analytics", plan: "Team", seats: 64, mrr: "$3,840", health: "at risk" },
  { account: "Veridian Group", plan: "Team", seats: 52, mrr: "$3,120", health: "on track" },
  { account: "Bloom Studios", plan: "Pro", seats: 18, mrr: "$1,080", health: "at risk" },
];

export const churnReasons = [
  { label: "Price", value: 34, display: "34%" },
  { label: "Missing features", value: 26, display: "26%" },
  { label: "Switched competitor", value: 19, display: "19%" },
  { label: "Low usage", value: 14, display: "14%" },
  { label: "Other", value: 7, display: "7%" },
];
