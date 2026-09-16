import { apiClient } from "@/services/client";

export interface CreateShareholderPayload {
  fullName: string;
  contact: string;
  idNumber: string;
}

export interface UpdateShareholderPayload {
  fullName?: string;
  contact?: string;
  idNumber?: string;
}

export interface Shareholder {
  id: string;
  marketId: string;
  fullName: string;
  contact: string;
  idNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentPercentage: string;
  totalDeposits: string;
  totalWithdrawals: string;
  netAmount: string;
}

interface RawShareholder {
  id?: string;
  _id?: string;
  marketId?: string;
  market_id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  contact?: string;
  phone?: string;
  idNumber?: string;
  id_number?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  currentPercentage?: string;
  current_percentage?: string;
  totalDeposits?: string;
  total_deposits?: string;
  totalWithdrawals?: string;
  total_withdrawals?: string;
  netAmount?: string;
  net_amount?: string;
}

function normalizeShareholder(raw: RawShareholder): Shareholder {
  return {
    id: raw.id ?? raw._id ?? "",
    marketId: raw.marketId ?? raw.market_id ?? "",
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? "",
    contact: raw.contact ?? raw.phone ?? "",
    idNumber: raw.idNumber ?? raw.id_number ?? "",
    isActive: raw.isActive ?? raw.is_active ?? true,
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
    currentPercentage: raw.currentPercentage ?? raw.current_percentage ?? "0",
    totalDeposits: raw.totalDeposits ?? raw.total_deposits ?? "0",
    totalWithdrawals: raw.totalWithdrawals ?? raw.total_withdrawals ?? "0",
    netAmount: raw.netAmount ?? raw.net_amount ?? "0",
  };
}

export async function fetchShareholders(): Promise<Shareholder[]> {
  const { data } = await apiClient.get("/shareholders");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeShareholder);
}

export async function fetchShareholder(id: string): Promise<Shareholder> {
  const { data } = await apiClient.get(`/shareholders/${id}`);
  return normalizeShareholder(data ?? {});
}

export async function createShareholder(
  payload: CreateShareholderPayload,
): Promise<Shareholder> {
  const { data } = await apiClient.post("/shareholders", payload);
  return normalizeShareholder(data ?? {});
}

export async function updateShareholder(
  id: string,
  payload: UpdateShareholderPayload,
): Promise<Shareholder> {
  const { data } = await apiClient.patch(`/shareholders/${id}`, payload);
  return normalizeShareholder(data ?? {});
}

export async function deleteShareholder(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/shareholders/${id}`,
  );
  return data ?? {};
}
