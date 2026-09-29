import { apiClient } from "@/services/client";

export interface StockStatementUnit {
  name: string;
  symbol: string;
}

/** مقادیر عددی سرور به صورت رشته می‌آیند تا دقت اعشاری از دست نرود */
export interface StockStatementFigures {
  quantity: string;
  amount: string;
}

export interface StockStatementSoldFigures extends StockStatementFigures {
  costOfGoodsSold: string;
}

export interface StockStatementItem {
  itemId: string;
  itemName: string;
  unitId: string;
  unit: StockStatementUnit | null;
  currencyId: string;
  openingBalance: string;
  purchased: StockStatementFigures;
  sold: StockStatementSoldFigures;
  consumed: StockStatementFigures;
  adjusted: StockStatementFigures;
  transferredOut: StockStatementFigures;
  transferredIn: StockStatementFigures;
  closingBalance: string;
}

export interface StockStatement {
  from: string;
  to: string;
  warehouseId: string;
  warehouseName: string;
  items: StockStatementItem[];
}

export interface StockStatementParams {
  warehouseId: string;
  from: string;
  to: string;
}

interface RawFigures {
  quantity?: string | number;
  amount?: string | number;
  costOfGoodsSold?: string | number;
  cost_of_goods_sold?: string | number;
}

function toStr(value: unknown): string {
  if (value == null) return "0";
  return typeof value === "string" ? value : String(value);
}

function normalizeFigures(raw: RawFigures | undefined): StockStatementFigures {
  return {
    quantity: toStr(raw?.quantity),
    amount: toStr(raw?.amount),
  };
}

function normalizeSold(raw: RawFigures | undefined): StockStatementSoldFigures {
  return {
    ...normalizeFigures(raw),
    costOfGoodsSold: toStr(raw?.costOfGoodsSold ?? raw?.cost_of_goods_sold),
  };
}

interface RawItem {
  itemId?: string;
  item_id?: string;
  itemName?: string;
  item_name?: string;
  name?: string;
  unitId?: string;
  unit_id?: string;
  unit?: { name?: string; symbol?: string } | null;
  currencyId?: string;
  currency_id?: string;
  openingBalance?: string | number;
  opening_balance?: string | number;
  purchased?: RawFigures;
  sold?: RawFigures;
  consumed?: RawFigures;
  adjusted?: RawFigures;
  transferredOut?: RawFigures;
  transferred_out?: RawFigures;
  transferredIn?: RawFigures;
  transferred_in?: RawFigures;
  closingBalance?: string | number;
  closing_balance?: string | number;
}

function normalizeItem(raw: RawItem): StockStatementItem {
  const unit = raw.unit ?? null;
  return {
    itemId: toStr(raw.itemId ?? raw.item_id),
    itemName: toStr(raw.itemName ?? raw.item_name ?? raw.name),
    unitId: toStr(raw.unitId ?? raw.unit_id),
    unit: unit ? { name: toStr(unit.name), symbol: toStr(unit.symbol) } : null,
    currencyId: toStr(raw.currencyId ?? raw.currency_id),
    openingBalance: toStr(raw.openingBalance ?? raw.opening_balance),
    purchased: normalizeFigures(raw.purchased),
    sold: normalizeSold(raw.sold),
    consumed: normalizeFigures(raw.consumed),
    adjusted: normalizeFigures(raw.adjusted),
    transferredOut: normalizeFigures(raw.transferredOut ?? raw.transferred_out),
    transferredIn: normalizeFigures(raw.transferredIn ?? raw.transferred_in),
    closingBalance: toStr(raw.closingBalance ?? raw.closing_balance),
  };
}

interface RawStockStatement {
  from?: string;
  to?: string;
  warehouseId?: string;
  warehouse_id?: string;
  warehouseName?: string;
  warehouse_name?: string;
  items?: RawItem[];
}

export interface ItemStockStatementParams {
  itemId: string;
  from: string;
  to: string;
}

/**
 * صورت موجودی یک جنس در بازه تاریخی
 * GET /inventory/stock-statement?itemId=&from=&to=
 *
 * همین اندپوینت وقتی itemId داشته باشد به‌جای items آرایه‌ای، یک item برمی‌گرداند.
 */
export async function fetchItemStockStatement(
  params: ItemStockStatementParams,
): Promise<StockStatementItem | null> {
  const { data } = await apiClient.get<{
    data?: { from?: string; to?: string; item?: RawItem | null };
    from?: string;
    to?: string;
    item?: RawItem | null;
  }>("/inventory/stock-statement", {
    params: { itemId: params.itemId, from: params.from, to: params.to },
  });
  const body = data?.data ?? (data as unknown as { item?: RawItem | null }) ?? {};
  return body.item ? normalizeItem(body.item) : null;
}

/**
 * صورت موجودی اجناس یک گدام در بازه تاریخی
 * GET /inventory/stock-statement?warehouseId=&from=&to=
 *
 * تاریخ‌ها میلادی و به فرمت YYYY-MM-DD هستند، حتی وقتی رابط کاربری شمسی است.
 */
export async function fetchStockStatement(
  params: StockStatementParams,
): Promise<StockStatement> {
  const { data } = await apiClient.get<{
    data?: RawStockStatement;
  }>("/inventory/stock-statement", {
    params: {
      warehouseId: params.warehouseId,
      from: params.from,
      to: params.to,
    },
  });
  const body = (data?.data ?? (data as unknown as RawStockStatement) ?? {}) as RawStockStatement;
  const items = Array.isArray(body.items) ? body.items : [];
  return {
    from: toStr(body.from),
    to: toStr(body.to),
    warehouseId: toStr(body.warehouseId ?? body.warehouse_id),
    warehouseName: toStr(body.warehouseName ?? body.warehouse_name),
    items: items.map(normalizeItem),
  };
}
