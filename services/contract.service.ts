import { apiClient } from "@/services/client";

export type ContractStatus = "active" | "expired" | "terminated" | "pending";

export interface CreateContractPayload {
  shopId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rent: number;
  currencyId: string;
  securityDeposit: number;
  securityDepositAccountId: string;
  guarantorId?: string | null;
  notes?: string | null;
}

export interface UpdateContractPayload {
  shopId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  rent?: number;
  currencyId?: string;
  securityDeposit?: number;
  securityDepositAccountId?: string;
  guarantorId?: string | null;
  notes?: string | null;
}

export interface Contract {
  id: string;
  marketId: string;
  shopId: string;
  tenantId: string;
  guarantorId: string | null;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  rent: number;
  currencyId: string;
  notes: string | null;
  securityDeposit: number;
  securityDepositRemaining: number;
  securityDepositAccountId: string;
  createdAt?: string;
  terminatedById: string | null;
  renewedFromContractId: string | null;
}

interface RawContract {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  shopId?: string;
  shop_id?: string;
  tenantId?: string;
  tenant_id?: string;
  guarantorId?: string;
  guarantor_id?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  status?: string;
  rent?: unknown;
  currencyId?: string;
  currency_id?: string;
  notes?: string | null;
  securityDeposit?: unknown;
  security_deposit?: unknown;
  securityDepositRemaining?: unknown;
  security_deposit_remaining?: unknown;
  securityDepositAccountId?: string;
  security_deposit_account_id?: string;
  createdAt?: string;
  created_at?: string;
  terminatedById?: string;
  terminated_by_id?: string;
  renewedFromContractId?: string;
  renewed_from_contract_id?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeContract(raw: RawContract): Contract {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    shopId: raw.shopId ?? raw.shop_id ?? "",
    tenantId: raw.tenantId ?? raw.tenant_id ?? "",
    guarantorId: raw.guarantorId ?? raw.guarantor_id ?? null,
    startDate: raw.startDate ?? raw.start_date ?? "",
    endDate: raw.endDate ?? raw.end_date ?? "",
    status: (raw.status as ContractStatus) ?? "active",
    rent: toNumber(raw.rent),
    currencyId: raw.currencyId ?? raw.currency_id ?? "",
    notes: raw.notes ?? null,
    securityDeposit: toNumber(raw.securityDeposit ?? raw.security_deposit),
    securityDepositRemaining: toNumber(
      raw.securityDepositRemaining ?? raw.security_deposit_remaining,
    ),
    securityDepositAccountId:
      raw.securityDepositAccountId ?? raw.security_deposit_account_id ?? "",
    createdAt: raw.createdAt ?? raw.created_at,
    terminatedById: raw.terminatedById ?? raw.terminated_by_id ?? null,
    renewedFromContractId:
      raw.renewedFromContractId ?? raw.renewed_from_contract_id ?? null,
  };
}

export async function fetchContracts(): Promise<Contract[]> {
  const { data } = await apiClient.get("/contracts");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeContract);
}

export async function fetchContract(id: string): Promise<Contract> {
  const { data } = await apiClient.get(`/contracts/${id}`);
  return normalizeContract(data ?? {});
}

export async function createContract(
  payload: CreateContractPayload,
): Promise<Contract> {
  const { data } = await apiClient.post("/contracts", payload);
  return normalizeContract(data ?? {});
}

export async function updateContract(
  id: string,
  payload: UpdateContractPayload,
): Promise<Contract> {
  const { data } = await apiClient.patch(`/contracts/${id}`, payload);
  return normalizeContract(data ?? {});
}

export async function deleteContract(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/contracts/${id}`,
  );
  return data ?? {};
}
