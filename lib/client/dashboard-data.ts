export const sparkRevenue = [12, 14, 11, 15, 13, 17, 16, 19, 18, 22, 20, 24].map((v) => ({ v }));
export const sparkTenants = [8, 9, 7, 10, 9, 11, 10, 12, 11, 13, 12, 14].map((v) => ({ v }));
export const sparkShops = [18, 16, 17, 15, 16, 14, 15, 13, 14, 12, 13, 12].map((v) => ({ v }));
export const sparkElectricity = [5, 6, 6, 7, 8, 9, 10, 12, 13, 15, 17, 19].map((v) => ({ v }));

const months = ["حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله", "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت"];

export const overviewData = months.map((month, i) => ({
  month,
  revenue: Math.round(18000 + i * 2600 + Math.sin(i * 1.3) * 4200),
  shops: Math.round(80 + i * 4 + Math.cos(i) * 8),
  expenses: Math.round(6000 + i * 900 + Math.sin(i * 0.8) * 1400),
}));

export const shopStatus = [
  { name: "اجاره", value: 68, color: "#16a34a" },
  { name: "خالی", value: 12, color: "#f59e0b" },
  { name: "تعمیر", value: 8, color: "#3b82f6" },
  { name: "رزرو", value: 4, color: "#a855f7" },
];

export const monthlyGoals = [
  { label: "عایدات ماهانه", current: 48295, target: 55000, color: "#16a34a" },
  { label: "مستاجران فعال", current: 82, target: 92, color: "#3b82f6" },
  { label: "پرداخت‌های دریافتی", current: 1432, target: 1600, color: "#f59e0b" },
];

export const recentActivity = [
  { id: 1, type: "rent", message: "کرایه دوکان شماره ۱۳۴ دریافت شد", time: "۲ ساعت پیش", amount: "۵۵,۰۰۰ افغانی" },
  { id: 2, type: "contract", message: "قرارداد دوکان شماره ۸۷ تمدید شد", time: "۵ ساعت پیش", amount: "" },
  { id: 3, type: "electricity", message: "فاکتور برق ماه سنبله ثبت شد", time: "۱ روز پیش", amount: "۱۲,۳۰۰ افغانی" },
  { id: 4, type: "rent", message: "کرایه دوکان شماره ۴۵ دریافت شد", time: "۱ روز پیش", amount: "۴۸,۰۰۰ افغانی" },
  { id: 5, type: "tenant", message: "مستاجر جدید دوکان شماره ۲۳ ثبت نام شد", time: "۲ روز پیش", amount: "" },
];
