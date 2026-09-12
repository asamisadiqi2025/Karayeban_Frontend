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
  fullName: string;
  contact: string;
  idNumber: string;
}

interface RawShareholder {
  id?: string;
  _id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  contact?: string;
  phone?: string;
  idNumber?: string;
  id_number?: string;
}

function normalizeShareholder(raw: RawShareholder): Shareholder {
  return {
    id: raw.id ?? raw._id ?? "",
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? "",
    contact: raw.contact ?? raw.phone ?? "",
    idNumber: raw.idNumber ?? raw.id_number ?? "",
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
