export interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: string;
  status: "completed" | "processing" | "pending" | "cancelled";
  date: string;
}

const customers = [
  ["Sarah Chen", "sarah.chen@nexora.io"],
  ["Marcus Johnson", "marcus.j@stratus.dev"],
  ["Priya Sharma", "priya.sharma@bloom.co"],
  ["Alex Rivera", "alex.rivera@orion.ai"],
  ["Emma Taylor", "emma.taylor@veridian.com"],
  ["David Park", "david.park@cascade.io"],
  ["Nadia Hassan", "nadia.h@halcyonlabs.com"],
  ["Liam O'Connor", "liam.oc@orbitfreight.com"],
  ["Yuki Tanaka", "yuki.tanaka@apex.dev"],
  ["Sofia Rossi", "sofia.rossi@grayson.media"],
  ["Tom Becker", "tom.becker@northwind.ltd"],
  ["Chloe Martin", "chloe.martin@vertex.io"],
] as const;

const products = [
  ["Pro Dashboard Template", "$49.99"],
  ["Enterprise License", "$199.99"],
  ["UI Component Kit", "$29.99"],
  ["Admin Starter Pack", "$39.99"],
  ["Analytics Module", "$39.99"],
  ["Email Template Pack", "$14.99"],
] as const;

const statuses: Order["status"][] = ["completed", "completed", "processing", "completed", "pending", "cancelled"];

export const orders: Order[] = Array.from({ length: 24 }).map((_, i) => {
  const [customer, email] = customers[i % customers.length];
  const [product, amount] = products[i % products.length];
  const status = statuses[i % statuses.length];
  const day = 24 - Math.floor(i / 2);
  return {
    id: `#ORD-${3200 + i}`,
    customer,
    email,
    product,
    amount,
    status,
    date: `Feb ${day.toString().padStart(2, "0")}, 2026`,
  };
});
