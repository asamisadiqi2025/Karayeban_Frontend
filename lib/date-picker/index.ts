import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import afghanLocale from "@/lib/date-picker/afghan-locale";

export interface DateRange {
  from: string;
  to: string;
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => afghanLocale.digits[Number(d)]);
}

export function isoToPersianDate(iso: string): DateObject | undefined {
  if (!iso) return undefined;
  const gregorianDate = new DateObject({ calendar: gregorian, date: iso });
  if (!gregorianDate.isValid) return undefined;
  return gregorianDate.convert(persian);
}

export function persianDateToIso(date: DateObject): string {
  const g = new DateObject(date).convert(gregorian);
  return `${g.year}-${pad2(g.month.number)}-${pad2(g.day)}`;
}

export function isoToDisplay(iso: string): string {
  const p = isoToPersianDate(iso);
  if (!p) return iso || "—";
  return toPersianDigits(`${p.year}/${pad2(p.month.number)}/${pad2(p.day)}`);
}

export function isoToDisplayLong(iso: string): string {
  const p = isoToPersianDate(iso);
  if (!p) return iso || "—";
  p.setLocale(afghanLocale);
  return toPersianDigits(`${p.day} ${p.month.name} ${p.year}`);
}

export function todayIso(): string {
  const now = new DateObject({ calendar: gregorian, date: new Date() });
  return `${now.year}-${pad2(now.month.number)}-${pad2(now.day)}`;
}

export function todayPersian(): DateObject {
  return new DateObject({ calendar: persian, date: new Date() });
}

function jalaliMonthRange(year: number, month: number): DateRange {
  const first = new DateObject({ calendar: persian, year, month, day: 1 });
  const daysInMonth = first.month.length;
  const last = new DateObject({ calendar: persian, year, month, day: daysInMonth });
  return { from: persianDateToIso(first), to: persianDateToIso(last) };
}

function jalaliYearRange(year: number): DateRange {
  const first = new DateObject({ calendar: persian, year, month: 1, day: 1 });
  const lastMonthDays = new DateObject({ calendar: persian, year, month: 12, day: 1 }).month.length;
  const last = new DateObject({ calendar: persian, year, month: 12, day: lastMonthDays });
  return { from: persianDateToIso(first), to: persianDateToIso(last) };
}

export function currentJalaliMonthRange(): DateRange {
  const now = todayPersian();
  return jalaliMonthRange(now.year, now.month.number);
}

export function previousJalaliMonthRange(): DateRange {
  const now = todayPersian();
  const year = now.month.number === 1 ? now.year - 1 : now.year;
  const month = now.month.number === 1 ? 12 : now.month.number - 1;
  return jalaliMonthRange(year, month);
}

export function currentJalaliYearRange(): DateRange {
  return jalaliYearRange(todayPersian().year);
}

export function previousJalaliYearRange(): DateRange {
  return jalaliYearRange(todayPersian().year - 1);
}
