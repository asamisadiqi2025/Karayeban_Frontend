import { apiClient } from "@/services/client";

export interface CreateGuarantorPayload {
  name: string;
  contact: string;
  idNumber: string;
  details?: string;
}

export interface UpdateGuarantorPayload {
  name?: string;
  contact?: string;
  idNumber?: string;
  details?: string;
}

export interface Guarantor {
  id: string;
  name: string;
  contact: string;
  idNumber: string;
  details: string;
}

interface RawGuarantor {
  id?: string;
  _id?: string;
  name?: string;
  contact?: string;
  phone?: string;
  idNumber?: string;
  id_number?: string;
  tazkiraNumber?: string;
  tazkira_number?: string;
  details?: string;
  description?: string;
}

function normalizeGuarantor(raw: RawGuarantor): Guarantor {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? "",
    contact: raw.contact ?? raw.phone ?? "",
    idNumber:
      raw.idNumber ?? raw.id_number ?? raw.tazkiraNumber ?? raw.tazkira_number ?? "",
    details: raw.details ?? raw.description ?? "",
  };
}

export async function fetchGuarantors(): Promise<Guarantor[]> {
  const { data } = await apiClient.get("/guarantors");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeGuarantor);
}

export async function fetchGuarantor(id: string): Promise<Guarantor> {
  const { data } = await apiClient.get(`/guarantors/${id}`);
  return normalizeGuarantor(data ?? {});
}

export async function createGuarantor(
  payload: CreateGuarantorPayload,
): Promise<Guarantor> {
  const { data } = await apiClient.post("/guarantors", payload);
  return normalizeGuarantor(data ?? {});
}

export async function updateGuarantor(
  id: string,
  payload: UpdateGuarantorPayload,
): Promise<Guarantor> {
  const { data } = await apiClient.patch(`/guarantors/${id}`, payload);
  return normalizeGuarantor(data ?? {});
}

export async function deleteGuarantor(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/guarantors/${id}`,
  );
  return data ?? {};
}
