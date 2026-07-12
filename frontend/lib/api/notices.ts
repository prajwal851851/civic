import api from "./axios"

export interface NoticeFilters {
  municipality?: string
  ward?: number
  pinned?: boolean
  search?: string
  page?: number
}

export async function getNotices(filters?: NoticeFilters) {
  const response = await api.get("/notices/", { params: filters })
  return response.data
}

export async function createNotice(data: Record<string, unknown>) {
  const response = await api.post("/notices/", data)
  return response.data
}

export async function getNotice(id: number) {
  const response = await api.get(`/notices/${id}/`)
  return response.data
}

export async function updateNotice(id: number, data: Record<string, unknown>) {
  const response = await api.patch(`/notices/${id}/`, data)
  return response.data
}

export async function deleteNotice(id: number) {
  await api.delete(`/notices/${id}/`)
}
