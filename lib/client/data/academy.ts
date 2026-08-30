export const scoreDistribution = [
  { range: "0-20", count: 12 },
  { range: "21-40", count: 34 },
  { range: "41-60", count: 98 },
  { range: "61-80", count: 186 },
  { range: "81-100", count: 152 },
];

export const pathCompletion = [
  { label: "Onboarding", value: 92 },
  { label: "Product basics", value: 74 },
  { label: "Advanced reporting", value: 51 },
  { label: "API integration", value: 38 },
  { label: "Administration", value: 27 },
];

export const courses = [
  { course: "Getting started", learners: 1240, avgScore: 88, completion: "92%", trend: "+3.1%" },
  { course: "Dashboards in depth", learners: 864, avgScore: 76, completion: "71%", trend: "+5.8%" },
  { course: "Query language", learners: 512, avgScore: 64, completion: "48%", trend: "-2.4%" },
  { course: "Permissions and roles", learners: 398, avgScore: 81, completion: "66%", trend: "+1.2%" },
  { course: "Webhooks", learners: 214, avgScore: 58, completion: "34%", trend: "-6.9%" },
];

const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
export const engagement = weeks.map((week, i) => ({
  week,
  active: Math.round(2000 + i * 90 + Math.sin(i) * 260),
}));
