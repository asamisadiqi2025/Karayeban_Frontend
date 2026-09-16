import { apiClient } from "@/services/client";

export interface EquityEntry {
  shareholderId: string;
  percentage: number;
  shareholderName?: string;
}

export interface ShareholderEquity {
  id: string;
  entries: EquityEntry[];
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEquityPayload {
  entries: { shareholderId: string; percentage: number }[];
  notes: string;
}

export interface UpdateEquityPayload {
  entries?: { shareholderId: string; percentage: number }[];
  notes?: string;
}

interface RawEquityEntry {
  shareholderId?: string;
  shareholder_id?: string;
  percentage?: number;
  shareholderName?: string;
  shareholder_name?: string;
  name?: string;
}

interface RawEquity {
  id?: string;
  _id?: string;
  entries?: RawEquityEntry[];
  notes?: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function normalizeEntry(raw: RawEquityEntry): EquityEntry {
  return {
    shareholderId: raw.shareholderId ?? raw.shareholder_id ?? "",
    percentage: typeof raw.percentage === "number" ? raw.percentage : 0,
    shareholderName: raw.shareholderName ?? raw.shareholder_name ?? raw.name,
  };
}

function normalizeEquity(raw: RawEquity): ShareholderEquity {
  return {
    id: raw.id ?? raw._id ?? "",
    entries: Array.isArray(raw.entries) ? raw.entries.map(normalizeEntry) : [],
    notes: raw.notes ?? raw.description ?? "",
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export async function fetchEquities(shareholderId: string): Promise<ShareholderEquity[]> {
  const { data } = await apiClient.get(`/shareholders/${shareholderId}/equity`);
  const items = Array.isArray(data)
    ? data
    : data?.data ?? data?.results ?? [];
  return items.map(normalizeEquity);
}

export async function fetchEquity(
  shareholderId: string,
  equityId: string,
): Promise<ShareholderEquity> {
  const { data } = await apiClient.get(
    `/shareholders/${shareholderId}/equity/${equityId}`,
  );
  return normalizeEquity(data ?? {});
}

export async function createEquity(
  shareholderId: string,
  payload: CreateEquityPayload,
): Promise<ShareholderEquity> {
  const { data } = await apiClient.post(
    `/shareholders/${shareholderId}/equity`,
    payload,
  );
  return normalizeEquity(data ?? {});
}

export async function updateEquity(
  shareholderId: string,
  equityId: string,
  payload: UpdateEquityPayload,
): Promise<ShareholderEquity> {
  const { data } = await apiClient.patch(
    `/shareholders/${shareholderId}/equity/${equityId}`,
    payload,
  );
  return normalizeEquity(data ?? {});
}

export async function deleteEquity(
  shareholderId: string,
  equityId: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/shareholders/${shareholderId}/equity/${equityId}`,
  );
  return data ?? {};
}
