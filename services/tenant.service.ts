import { apiClient } from "@/services/client";

export type TenantGender = "male" | "female";

export interface CreateTenantPayload {
  fullName: string;
  fatherName: string;
  idNumber: string;
  contact: string;
  gender: TenantGender;
  details?: string;
}

export interface UpdateTenantPayload {
  fullName?: string;
  fatherName?: string;
  idNumber?: string;
  contact?: string;
  gender?: TenantGender;
  details?: string;
}

export interface Tenant {
  id: string;
  fullName: string;
  fatherName: string;
  idNumber: string;
  contact: string;
  gender: TenantGender;
  details: string;
}

interface RawTenant {
  id?: string;
  _id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  fatherName?: string;
  father_name?: string;
  idNumber?: string;
  id_number?: string;
  idCardNumber?: string;
  tazkiraNumber?: string;
  tazkira_number?: string;
  contact?: string;
  phone?: string;
  gender?: string;
  details?: string;
  description?: string;
}

function normalizeGender(value: unknown): TenantGender {
  return value === "female" || value === "مونث" || value === "زن"
    ? "female"
    : "male";
}

function normalizeTenant(raw: RawTenant): Tenant {
  return {
    id: raw.id ?? raw._id ?? "",
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? "",
    fatherName: raw.fatherName ?? raw.father_name ?? "",
    idNumber:
      raw.idNumber ??
      raw.id_number ??
      raw.idCardNumber ??
      raw.tazkiraNumber ??
      raw.tazkira_number ??
      "",
    contact: raw.contact ?? raw.phone ?? "",
    gender: normalizeGender(raw.gender),
    details: raw.details ?? raw.description ?? "",
  };
}

export async function fetchTenants(): Promise<Tenant[]> {
  const { data } = await apiClient.get("/tenants");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeTenant);
}

export async function fetchTenant(id: string): Promise<Tenant> {
  const { data } = await apiClient.get(`/tenants/${id}`);
  return normalizeTenant(data ?? {});
}

export async function createTenant(
  payload: CreateTenantPayload,
): Promise<Tenant> {
  const { data } = await apiClient.post("/tenants", payload);
  return normalizeTenant(data ?? {});
}

export async function updateTenant(
  id: string,
  payload: UpdateTenantPayload,
): Promise<Tenant> {
  const { data } = await apiClient.patch(`/tenants/${id}`, payload);
  return normalizeTenant(data ?? {});
}

export async function deleteTenant(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/tenants/${id}`,
  );
  return data ?? {};
}