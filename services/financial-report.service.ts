import { apiClient } from "@/services/client";

/* ------------------------------------------------------------------ */
/* Shared shapes                                                        */
/* ------------------------------------------------------------------ */

export interface CurrencyFlow {
  currencyId: string;
  currencyCode: string;
  totalIn: number;
  totalOut: number;
  net: number;
}

export interface CurrencyTotal {
  currencyId: string;
  currencyCode: string;
  total: number;
}

export interface CollectionSums {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export type ChargeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export interface CollectionByStatus {
  status: ChargeStatus;
  count: number;
  sums: CollectionSums;
}

export interface CollectionCurrency {
  currencyId: string;
  currencyCode: string;
  byStatus: CollectionByStatus[];
  totals: CollectionSums;
  chargesCount: number;
  collectionRate: number;
}

/* ------------------------------------------------------------------ */
/* 1) GET /reports/financials/summary?from=&to=                         */
/* ------------------------------------------------------------------ */

export interface CurrencyFlowReport {
  marketId: string;
  from: string;
  to: string;
  byCurrency: CurrencyFlow[];
}

/* ------------------------------------------------------------------ */
/* 2) GET /expenses/breakdown?fromDate=&toDate=                         */
/*    NOTE: this is a category tree, NOT the financials/summary shape.  */
/* ------------------------------------------------------------------ */

export interface ExpenseAmountLine {
  currencyId: string;
  currencyCode: string;
  amount: number;
  count: number;
}

export interface ExpenseBreakdownNode {
  categoryId: string;
  name: string;
  direct: ExpenseAmountLine[];
  /** Absent on child nodes in the API response. */
  total?: ExpenseAmountLine[];
  children?: ExpenseBreakdownNode[];
}

export interface ExpensesBreakdownReport {
  marketId: string;
  fromDate: string;
  toDate: string;
  grandTotal: ExpenseAmountLine[];
  categories: ExpenseBreakdownNode[];
}

/* ------------------------------------------------------------------ */
/* 2) GET /reports/financials/balances?asOfDate=                        */
/* ------------------------------------------------------------------ */

export interface AccountBalance {
  accountId: string;
  name: string;
  type: string;
  isActive: boolean;
  currencyId: string;
  currencyCode: string;
  balance: number;
}

export interface FinancialBalancesReport {
  marketId: string;
  asOfDate: string;
  accounts: AccountBalance[];
  totalsByCurrency: CurrencyTotal[];
}

/* ------------------------------------------------------------------ */
/* 4) GET /reports/rentals/collection-performance?from=&to=            */
/* 5) GET /reports/electricity/collection-performance?from=&to=        */
/* ------------------------------------------------------------------ */

export interface CollectionPerformanceReport {
  marketId: string;
  from: string;
  to: string;
  shopId: string | null;
  byCurrency: CollectionCurrency[];
}

/* ------------------------------------------------------------------ */
/* 6b) GET /shops/occupancy-summary  (no params)                        */
/* ------------------------------------------------------------------ */

export type ShopOccupancyStatus =
  | "active"
  | "inactive"
  | "empty"
  | "pending"
  | "rented";

export type OccupancyCounts = Record<ShopOccupancyStatus, number>;

export interface FloorOccupancy {
  floorId: string;
  floorNumber: number;
  floorName: string;
  total: number;
  byStatus: OccupancyCounts;
}

export interface OccupancySummaryReport {
  marketId: string;
  byFloor: FloorOccupancy[];
  totals: {
    total: number;
    byStatus: OccupancyCounts;
    occupancyRate: number;
  };
}

/* ------------------------------------------------------------------ */
/* 7) GET /rent/debts/aging  (no params)                               */
/* ------------------------------------------------------------------ */

export interface AgingBucket {
  amount: number;
  count: number;
}

export type AgingBucketKey =
  | "current"
  | "d1_30"
  | "d31_60"
  | "d61_90"
  | "d90_plus";

export interface DebtAgingCurrency {
  currencyId: string;
  currencyCode: string;
  buckets: Record<AgingBucketKey, AgingBucket>;
  totalAmount: number;
  totalCount: number;
}

export interface DebtAgingReport {
  marketId: string;
  asOf: string;
  byCurrency: DebtAgingCurrency[];
}

/* ------------------------------------------------------------------ */
/* 8) GET /shareholders/equity-summary  (no params)                     */
/* ------------------------------------------------------------------ */

export interface ShareholderEquityRow {
  shareholderId: string;
  fullName: string;
  isActive: boolean;
  currentPercentage: number;
  byCurrency: CurrencyTotal[];
}

export interface EquitySummaryReport {
  marketId: string;
  fromDate: string | null;
  toDate: string | null;
  equityPercentageSum: number;
  isBalanced: boolean;
  grandTotalsByCurrency: CurrencyTotal[];
  shareholders: ShareholderEquityRow[];
}

/* ------------------------------------------------------------------ */
/* 9) GET /inventory/movement-summary?from=&to=&warehouseId=            */
/* ------------------------------------------------------------------ */

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "CONSUMPTION"
  | "ADJUSTMENT"
  | "TRANSFER_OUT"
  | "TRANSFER_IN";

export const MOVEMENT_TYPES: MovementType[] = [
  "PURCHASE",
  "SALE",
  "CONSUMPTION",
  "ADJUSTMENT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
];

export interface MovementTypeSums {
  quantity: number;
  amount: number;
  costOfGoodsSold: number;
  count: number;
}

export interface MovementCurrency {
  currencyId: string;
  currencyCode: string;
  byType: Record<MovementType, MovementTypeSums>;
  grossProfitFromSales: number;
}

export interface MovementSummaryReport {
  marketId: string;
  warehouseId: string | null;
  from: string;
  to: string;
  byCurrency: MovementCurrency[];
}

/* ------------------------------------------------------------------ */
/* Normalization helpers                                                */
/* ------------------------------------------------------------------ */

type Rec = Record<string, unknown>;

function asRec(value: unknown): Rec {
  return value && typeof value === "object" ? (value as Rec) : {};
}

/** Report endpoints return bare objects, but tolerate a { data } envelope. */
function unwrap(data: unknown): Rec {
  const rec = asRec(data);
  const inner = rec.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Rec;
  }
  return rec;
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return value == null ? null : str(value);
}

function normalizeFlow(raw: Rec): CurrencyFlow {
  return {
    currencyId: str(raw.currencyId ?? raw.currency_id),
    currencyCode: str(raw.currencyCode ?? raw.currency_code),
    totalIn: num(raw.totalIn ?? raw.total_in),
    totalOut: num(raw.totalOut ?? raw.total_out),
    net: num(raw.net),
  };
}

function normalizeCurrencyTotal(raw: Rec): CurrencyTotal {
  return {
    currencyId: str(raw.currencyId ?? raw.currency_id),
    currencyCode: str(raw.currencyCode ?? raw.currency_code),
    total: num(raw.total),
  };
}

const EMPTY_SUMS: CollectionSums = {
  grossAmount: 0,
  discountAmount: 0,
  netAmount: 0,
  paidAmount: 0,
  remainingAmount: 0,
};

function normalizeSums(raw: unknown): CollectionSums {
  const rec = asRec(raw);
  return {
    grossAmount: num(rec.grossAmount ?? rec.gross_amount),
    discountAmount: num(rec.discountAmount ?? rec.discount_amount),
    netAmount: num(rec.netAmount ?? rec.net_amount),
    paidAmount: num(rec.paidAmount ?? rec.paid_amount),
    remainingAmount: num(rec.remainingAmount ?? rec.remaining_amount),
  };
}

const CHARGE_STATUSES: ChargeStatus[] = ["PENDING", "PARTIAL", "PAID", "OVERDUE"];

function normalizeCollectionCurrency(raw: Rec): CollectionCurrency {
  const byStatusRaw = Array.isArray(raw.byStatus)
    ? (raw.byStatus as unknown[])
    : Array.isArray(raw.by_status)
      ? (raw.by_status as unknown[])
      : [];

  const byStatus = byStatusRaw.map((entry) => {
    const rec = asRec(entry);
    const status = str(rec.status).toUpperCase() as ChargeStatus;
    return {
      status: CHARGE_STATUSES.includes(status) ? status : "PENDING",
      count: num(rec.count),
      sums: normalizeSums(rec.sums),
    };
  });

  return {
    currencyId: str(raw.currencyId ?? raw.currency_id),
    currencyCode: str(raw.currencyCode ?? raw.currency_code),
    byStatus,
    totals: raw.totals ? normalizeSums(raw.totals) : { ...EMPTY_SUMS },
    chargesCount: num(raw.chargesCount ?? raw.charges_count),
    collectionRate: num(raw.collectionRate ?? raw.collection_rate),
  };
}

const OCCUPANCY_STATUSES: ShopOccupancyStatus[] = [
  "active",
  "inactive",
  "empty",
  "pending",
  "rented",
];

function normalizeOccupancyCounts(raw: unknown): OccupancyCounts {
  const rec = asRec(raw);
  const counts = {} as OccupancyCounts;
  for (const key of OCCUPANCY_STATUSES) {
    counts[key] = num(rec[key]);
  }
  return counts;
}

function normalizeAgingBucket(raw: unknown): AgingBucket {
  const rec = asRec(raw);
  return { amount: num(rec.amount), count: num(rec.count) };
}

function normalizeExpenseLine(raw: Rec): ExpenseAmountLine {
  return {
    currencyId: str(raw.currencyId ?? raw.currency_id),
    currencyCode: str(raw.currencyCode ?? raw.currency_code),
    amount: num(raw.amount),
    count: num(raw.count),
  };
}

function normalizeExpenseLines(raw: unknown): ExpenseAmountLine[] {
  return (Array.isArray(raw) ? (raw as unknown[]) : []).map(asRec).map(normalizeExpenseLine);
}

function normalizeExpenseNode(raw: Rec): ExpenseBreakdownNode {
  const node: ExpenseBreakdownNode = {
    categoryId: str(raw.categoryId ?? raw.category_id),
    name: str(raw.name),
    direct: normalizeExpenseLines(raw.direct),
  };
  // The API omits `total` on child nodes.
  if (raw.total != null) node.total = normalizeExpenseLines(raw.total);
  if (Array.isArray(raw.children)) {
    node.children = (raw.children as unknown[]).map(asRec).map(normalizeExpenseNode);
  }
  return node;
}

function normalizeMovementSums(raw: unknown): MovementTypeSums {
  const rec = asRec(raw);
  return {
    quantity: num(rec.quantity),
    amount: num(rec.amount),
    costOfGoodsSold: num(rec.costOfGoodsSold ?? rec.cost_of_goods_sold),
    count: num(rec.count),
  };
}

function normalizeMovementCurrency(raw: Rec): MovementCurrency {
  const byTypeRaw = asRec(raw.byType ?? raw.by_type);
  const byType = {} as Record<MovementType, MovementTypeSums>;
  for (const type of MOVEMENT_TYPES) {
    byType[type] = normalizeMovementSums(byTypeRaw[type]);
  }
  return {
    currencyId: str(raw.currencyId ?? raw.currency_id),
    currencyCode: str(raw.currencyCode ?? raw.currency_code),
    byType,
    grossProfitFromSales: num(raw.grossProfitFromSales ?? raw.gross_profit_from_sales),
  };
}

function normalizeAgingCurrency(raw: Rec): DebtAgingCurrency {
  const bucketsRaw = asRec(raw.buckets);
  return {
    currencyId: str(raw.currencyId ?? raw.currency_id),
    currencyCode: str(raw.currencyCode ?? raw.currency_code),
    buckets: {
      current: normalizeAgingBucket(bucketsRaw.current),
      d1_30: normalizeAgingBucket(bucketsRaw.d1_30 ?? bucketsRaw["1-30"]),
      d31_60: normalizeAgingBucket(bucketsRaw.d31_60 ?? bucketsRaw["31-60"]),
      d61_90: normalizeAgingBucket(bucketsRaw.d61_90 ?? bucketsRaw["61-90"]),
      d90_plus: normalizeAgingBucket(bucketsRaw.d90_plus ?? bucketsRaw["90+"]),
    },
    totalAmount: num(raw.totalAmount ?? raw.total_amount),
    totalCount: num(raw.totalCount ?? raw.total_count),
  };
}

/* ------------------------------------------------------------------ */
/* Fetchers                                                             */
/* ------------------------------------------------------------------ */

export interface DateRangeParams {
  from: string;
  to: string;
}

/**
 * خلاصه مالی — GET /reports/financials/summary
 */
export async function fetchFinancialSummary(
  params: DateRangeParams,
): Promise<CurrencyFlowReport> {
  const { data } = await apiClient.get("/reports/financials/summary", {
    params: { from: params.from, to: params.to },
  });
  const rec = unwrap(data);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    from: str(rec.from, params.from),
    to: str(rec.to, params.to),
    byCurrency: ((Array.isArray(rec.byCurrency) ? rec.byCurrency : []) as unknown[])
      .map(asRec)
      .map(normalizeFlow),
  };
}

/**
 * موجودی حساب‌ها — GET /reports/financials/balances
 * Note: this endpoint uses `asOfDate`, not from/to.
 */
export async function fetchFinancialBalances(
  asOfDate: string,
): Promise<FinancialBalancesReport> {
  const { data } = await apiClient.get("/reports/financials/balances", {
    params: { asOfDate },
  });
  const rec = unwrap(data);
  const accountsRaw = Array.isArray(rec.accounts) ? (rec.accounts as unknown[]) : [];
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    asOfDate: str(rec.asOfDate ?? rec.as_of_date, asOfDate),
    accounts: accountsRaw.map(asRec).map((raw) => ({
      accountId: str(raw.accountId ?? raw.account_id),
      name: str(raw.name),
      type: str(raw.type),
      isActive: bool(raw.isActive ?? raw.is_active, true),
      currencyId: str(raw.currencyId ?? raw.currency_id),
      currencyCode: str(raw.currencyCode ?? raw.currency_code),
      balance: num(raw.balance),
    })),
    totalsByCurrency: (Array.isArray(rec.totalsByCurrency)
      ? (rec.totalsByCurrency as unknown[])
      : Array.isArray(rec.totals_by_currency)
        ? (rec.totals_by_currency as unknown[])
        : []
    )
      .map(asRec)
      .map(normalizeCurrencyTotal),
  };
}

/**
 * عملکرد وصول اجاره — GET /reports/rentals/collection-performance
 */
export async function fetchRentCollectionPerformance(
  params: DateRangeParams & { shopId?: string | null },
): Promise<CollectionPerformanceReport> {
  const { data } = await apiClient.get("/reports/rentals/collection-performance", {
    params: {
      from: params.from,
      to: params.to,
      ...(params.shopId ? { shopId: params.shopId } : {}),
    },
  });
  const rec = unwrap(data);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    from: str(rec.from, params.from),
    to: str(rec.to, params.to),
    shopId: nullableStr(rec.shopId ?? rec.shop_id),
    byCurrency: ((Array.isArray(rec.byCurrency) ? rec.byCurrency : []) as unknown[])
      .map(asRec)
      .map(normalizeCollectionCurrency),
  };
}

/**
 * عملکرد وصول برق — GET /reports/electricity/collection-performance
 */
export async function fetchElectricityCollectionPerformance(
  params: DateRangeParams & { shopId?: string | null },
): Promise<CollectionPerformanceReport> {
  const { data } = await apiClient.get(
    "/reports/electricity/collection-performance",
    {
      params: {
        from: params.from,
        to: params.to,
        ...(params.shopId ? { shopId: params.shopId } : {}),
      },
    },
  );
  const rec = unwrap(data);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    from: str(rec.from, params.from),
    to: str(rec.to, params.to),
    shopId: nullableStr(rec.shopId ?? rec.shop_id),
    byCurrency: ((Array.isArray(rec.byCurrency) ? rec.byCurrency : []) as unknown[])
      .map(asRec)
      .map(normalizeCollectionCurrency),
  };
}

/**
 * تفکیک مصارف — GET /expenses/breakdown
 * Note: this endpoint uses `fromDate`/`toDate` and returns a category tree
 * (`grandTotal` + `categories`), which is a different shape from
 * /reports/financials/summary.
 */
export async function fetchExpensesBreakdown(
  params: DateRangeParams,
): Promise<ExpensesBreakdownReport> {
  const { data } = await apiClient.get("/expenses/breakdown", {
    params: { fromDate: params.from, toDate: params.to },
  });
  const rec = unwrap(data);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    fromDate: str(rec.fromDate ?? rec.from_date, params.from),
    toDate: str(rec.toDate ?? rec.to_date, params.to),
    grandTotal: normalizeExpenseLines(rec.grandTotal ?? rec.grand_total),
    categories: (Array.isArray(rec.categories) ? (rec.categories as unknown[]) : [])
      .map(asRec)
      .map(normalizeExpenseNode),
  };
}

/**
 * خلاصه اشغال دوکان‌ها — GET /shops/occupancy-summary (no params)
 */
export async function fetchOccupancySummary(): Promise<OccupancySummaryReport> {
  const { data } = await apiClient.get("/shops/occupancy-summary");
  const rec = unwrap(data);
  const totalsRaw = asRec(rec.totals);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    byFloor: ((Array.isArray(rec.byFloor) ? rec.byFloor : []) as unknown[])
      .map(asRec)
      .map((raw) => ({
        floorId: str(raw.floorId ?? raw.floor_id),
        floorNumber: num(raw.floorNumber ?? raw.floor_number),
        floorName: str(raw.floorName ?? raw.floor_name),
        total: num(raw.total),
        byStatus: normalizeOccupancyCounts(raw.byStatus ?? raw.by_status),
      })),
    totals: {
      total: num(totalsRaw.total),
      byStatus: normalizeOccupancyCounts(totalsRaw.byStatus ?? totalsRaw.by_status),
      occupancyRate: num(totalsRaw.occupancyRate ?? totalsRaw.occupancy_rate),
    },
  };
}

/**
 * اقساط بدهی اجاره — GET /rent/debts/aging (no params)
 */
export async function fetchDebtAging(): Promise<DebtAgingReport> {
  const { data } = await apiClient.get("/rent/debts/aging");
  const rec = unwrap(data);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    asOf: str(rec.asOf ?? rec.as_of),
    byCurrency: ((Array.isArray(rec.byCurrency) ? rec.byCurrency : []) as unknown[])
      .map(asRec)
      .map(normalizeAgingCurrency),
  };
}

/**
 * خلاصه سهام — GET /shareholders/equity-summary (no params)
 */
export async function fetchEquitySummary(): Promise<EquitySummaryReport> {
  const { data } = await apiClient.get("/shareholders/equity-summary");
  const rec = unwrap(data);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    fromDate: nullableStr(rec.fromDate ?? rec.from_date),
    toDate: nullableStr(rec.toDate ?? rec.to_date),
    equityPercentageSum: num(rec.equityPercentageSum ?? rec.equity_percentage_sum),
    isBalanced: bool(rec.isBalanced ?? rec.is_balanced),
    grandTotalsByCurrency: ((
      Array.isArray(rec.grandTotalsByCurrency)
        ? rec.grandTotalsByCurrency
        : Array.isArray(rec.grand_totals_by_currency)
          ? rec.grand_totals_by_currency
          : []
    ) as unknown[])
      .map(asRec)
      .map(normalizeCurrencyTotal),
    shareholders: ((Array.isArray(rec.shareholders) ? rec.shareholders : []) as unknown[])
      .map(asRec)
      .map((raw) => ({
        shareholderId: str(raw.shareholderId ?? raw.shareholder_id),
        fullName: str(raw.fullName ?? raw.full_name),
        isActive: bool(raw.isActive ?? raw.is_active, true),
        currentPercentage: num(raw.currentPercentage ?? raw.current_percentage),
        byCurrency: ((Array.isArray(raw.byCurrency) ? raw.byCurrency : []) as unknown[])
          .map(asRec)
          .map(normalizeCurrencyTotal),
      })),
  };
}

/**
 * خلاصه گردش گدام — GET /inventory/movement-summary
 */
export async function fetchInventoryMovementSummary(
  params: DateRangeParams & { warehouseId?: string | null },
): Promise<MovementSummaryReport> {
  const { data } = await apiClient.get("/inventory/movement-summary", {
    params: {
      from: params.from,
      to: params.to,
      ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
    },
  });
  const rec = unwrap(data);
  return {
    marketId: str(rec.marketId ?? rec.market_id),
    warehouseId: nullableStr(rec.warehouseId ?? rec.warehouse_id),
    from: str(rec.from, params.from),
    to: str(rec.to, params.to),
    byCurrency: ((Array.isArray(rec.byCurrency) ? rec.byCurrency : []) as unknown[])
      .map(asRec)
      .map(normalizeMovementCurrency),
  };
}
