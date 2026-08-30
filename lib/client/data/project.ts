const sprintDays = ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 11", "Day 13", "Day 14"];

export const sprintBurndown = sprintDays.map((day, i) => ({
  day,
  ideal: Math.max(0, 96 - i * 13.7),
  actual: Math.max(0, 96 - i * 11.2 + (i > 4 ? 8 : 0)),
}));

export const cumulativeFlow = sprintDays.map((day, i) => ({
  day,
  todo: Math.max(4, 22 - i * 2.4),
  inProgress: 8 + Math.round(Math.sin(i) * 3),
  review: 4 + Math.round(Math.cos(i) * 2),
  done: Math.round(i * 6.4),
}));

export const milestones = [
  { milestone: "Design system audit", owner: "Ada L.", progress: "100%", due: "Jul 12", status: "done" },
  { milestone: "Checkout rewrite", owner: "Grace H.", progress: "72%", due: "Aug 2", status: "on track" },
  { milestone: "Payment provider migration", owner: "Alan T.", progress: "45%", due: "Aug 9", status: "at risk" },
  { milestone: "Mobile onboarding", owner: "Katherine J.", progress: "30%", due: "Jul 26", status: "late" },
  { milestone: "Search relevance v2", owner: "Barbara L.", progress: "18%", due: "Aug 23", status: "on track" },
];

export const teamLoad = [
  { label: "Ada Lovelace", value: 21, display: "21 / 24" },
  { label: "Grace Hopper", value: 28, display: "28 / 24" },
  { label: "Alan Turing", value: 18, display: "18 / 24" },
  { label: "Katherine Johnson", value: 12, display: "12 / 20" },
  { label: "Barbara Liskov", value: 23, display: "23 / 24" },
];
