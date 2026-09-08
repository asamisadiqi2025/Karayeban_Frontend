import { apiClient } from "@/services/client";

export interface CreateFloorPayload {
  marketId: string;
  floorNumber: number;
  name: string;
  details?: string;
}

export interface UpdateFloorPayload {
  floorNumber?: number;
  name?: string;
  details?: string;
}

export interface Floor {
  id: string;
  floorNumber: number;
  name: string;
  details: string;
}

interface RawFloor {
  id?: string;
  _id?: string;
  floorNumber?: string | number;
  floor_number?: string | number;
  name?: string;
  floor_name?: string;
  floorName?: string;
  details?: string;
  description?: string;
}

function toNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isInteger(num) ? num : Math.round(num);
}

function normalizeFloor(raw: RawFloor): Floor {
  return {
    id: raw.id ?? raw._id ?? "",
    floorNumber: toNumber(raw.floorNumber ?? raw.floor_number),
    name: raw.name ?? raw.floor_name ?? raw.floorName ?? "",
    details: raw.details ?? raw.description ?? "",
  };
}

/**
 * فهرست طبقات
 * GET /floors — پاسخ: { data: Floor[], meta }
 */
export async function fetchFloors(): Promise<Floor[]> {
  const { data } = await apiClient.get("/floors");
  const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  return items.map(normalizeFloor);
}

/**
 * دریافت یک طبقه
 * GET /floors/:id
 */
export async function fetchFloor(id: string): Promise<Floor> {
  const { data } = await apiClient.get(`/floors/${id}`);
  return normalizeFloor(data ?? {});
}

/**
 * ایجاد طبقه جدید
 * POST /floors
 */
export async function createFloor(payload: CreateFloorPayload): Promise<Floor> {
  const { data } = await apiClient.post("/floors", payload);
  return normalizeFloor(data ?? {});
}

/**
 * بروزرسانی طبقه
 * PATCH /floors/:id
 */
export async function updateFloor(
  id: string,
  payload: UpdateFloorPayload,
): Promise<Floor> {
  const { data } = await apiClient.patch(`/floors/${id}`, payload);
  return normalizeFloor(data ?? {});
}

/**
 * حذف طبقه
 * DELETE /floors/:id
 */
export async function deleteFloor(
  id: string,
): Promise<{ message?: string }> {
  const { data } = await apiClient.delete<{ message?: string }>(
    `/floors/${id}`,
  );
  return data ?? {};
}
