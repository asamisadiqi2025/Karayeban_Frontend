const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

export const pipelineOverview = months.map((month, i) => ({
  month,
  value: Math.round(520000 + i * 42000 + Math.sin(i) * 38000),
  count: Math.round(220 + i * 12 + Math.cos(i) * 14),
}));

export const dealStages = [
  { label: "Qualified", value: 124, color: "#3b82f6" },
  { label: "Proposal", value: 89, color: "#8b5cf6" },
  { label: "Negotiation", value: 52, color: "#f59e0b" },
  { label: "Closed Won", value: 67, color: "#16a34a" },
  { label: "Closed Lost", value: 43, color: "#e11d48" },
];

export const topSalesReps = [
  { rank: 1, rep: "Jordan Mills", segment: "Enterprise", won: 18, revenue: "$82,400", winRate: "58%" },
  { rank: 2, rep: "Priya Nakamura", segment: "Mid-Market", won: 24, revenue: "$74,800", winRate: "52%" },
  { rank: 3, rep: "Carlos Reyes", segment: "SMB", won: 31, revenue: "$48,200", winRate: "45%" },
  { rank: 4, rep: "Aisha Thompson", segment: "Enterprise", won: 11, revenue: "$41,600", winRate: "39%" },
  { rank: 5, rep: "Leo Bergstrom", segment: "Mid-Market", won: 19, revenue: "$37,400", winRate: "34%" },
];

export const leadSources = [
  { label: "Outbound", value: 34, display: "34%" },
  { label: "Referral", value: 26, display: "26%" },
  { label: "Website", value: 20, display: "20%" },
  { label: "Partner", value: 12, display: "12%" },
  { label: "Event", value: 8, display: "8%" },
];

export const recentDeals = [
  { deal: "Apex Platform License", company: "Nexora Corp", value: "$48,000", stage: "won", close: "Feb 22" },
  { deal: "Enterprise Bundle", company: "Stratus Health", value: "$32,500", stage: "negotiation", close: "Feb 28" },
  { deal: "Starter Plan Upgrade", company: "Bloom Studios", value: "$9,800", stage: "proposal", close: "Mar 4" },
  { deal: "Data Module", company: "Orion Analytics", value: "$14,200", stage: "qualified", close: "Mar 10" },
  { deal: "Pro Seats x40", company: "Veridian Group", value: "$21,600", stage: "negotiation", close: "Mar 15" },
  { deal: "Annual Renewal", company: "Cascade Systems", value: "$8,400", stage: "lost", close: "Feb 19" },
];

export const quarterlyTargets = [
  { label: "Pipeline Value", current: 842, target: 1200, format: (v: number) => `$${v}k` },
  { label: "Deals Closed", current: 67, target: 100 },
  { label: "New Contacts", current: 284, target: 400 },
];
