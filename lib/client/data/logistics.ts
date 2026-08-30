export const shipmentVolume = [
  { lane: "Shanghai–LA", volume: 14200 },
  { lane: "Shenzhen–Rotterdam", volume: 11800 },
  { lane: "Mumbai–Jebel Ali", volume: 9600 },
  { lane: "Hamburg–Newark", volume: 8200 },
  { lane: "Singapore–Sydney", volume: 6400 },
];

export const hubCapacity = [
  { label: "Rotterdam", value: 104, display: "104%" },
  { label: "Los Angeles", value: 91, display: "91%" },
  { label: "Singapore", value: 78, display: "78%" },
  { label: "Hamburg", value: 62, display: "62%" },
  { label: "Dubai", value: 47, display: "47%" },
];

const weeks = ["W1", "W2", "W3", "W4", "W5", "W6"];
export const deliveryPerformance = weeks.map((week, i) => ({
  week,
  onTime: Math.round(82 + i * 1.2 + Math.sin(i) * 3),
  delayed: Math.round(18 - i * 1.2 + Math.cos(i) * 2),
}));

export const exceptions = [
  { ref: "SHP-88412", lane: "Shanghai → Los Angeles", issue: "Customs hold", age: "62h", severity: "high" },
  { ref: "SHP-88390", lane: "Hamburg → Newark", issue: "Missing documentation", age: "28h", severity: "medium" },
  { ref: "SHP-88437", lane: "Mumbai → Jebel Ali", issue: "Damaged pallet", age: "14h", severity: "medium" },
  { ref: "SHP-88455", lane: "Shenzhen → Rotterdam", issue: "Weather delay", age: "8h", severity: "low" },
];
