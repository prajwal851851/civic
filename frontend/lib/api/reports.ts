import api from "./axios"

export interface ReportFilters {
  page?: number
  page_size?: number
  q?: string
  sort?: string
  category?: string
  status?: string
  municipality?: string
  ward?: number
  visibility?: boolean
  date_from?: string
  date_to?: string
}

export interface FeedImage {
  id: number
  image: string
  uploaded_at: string
}

export interface FeedVideo {
  id: number
  video: string
  uploaded_at: string
}

export interface FeedReport {
  id: number
  citizen: number
  citizen_name: string
  citizen_profile_picture: string | null
  title: string
  description: string
  category: string
  latitude: string
  longitude: string
  municipality: string
  ward_number: number
  address: string
  status: string
  visibility: boolean
  images: FeedImage[]
  videos: FeedVideo[]
  total_upvotes: number
  total_comments: number
  has_upvoted: boolean
  created_at: string
  updated_at: string
}

export interface FeedResponse {
  count: number
  next: string | null
  previous: string | null
  results: FeedReport[]
}

export interface NearbyParams {
  lat: number
  lng: number
  radius?: number
}

const SORT_MAP: Record<string, string> = {
  newest: "-created_at",
  oldest: "created_at",
  most_upvoted: "-total_upvotes",
  most_commented: "-total_comments",
  recently_updated: "-updated_at",
}

export async function getFeed(filters?: ReportFilters): Promise<FeedResponse> {
  const params: Record<string, unknown> = {}
  if (filters) {
    if (filters.page) params.page = filters.page
    if (filters.page_size) params.page_size = filters.page_size
    if (filters.q) params.q = filters.q
    if (filters.sort && SORT_MAP[filters.sort]) params.sort = filters.sort
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    if (filters.municipality) params.municipality = filters.municipality
    if (filters.ward !== undefined) params.ward = filters.ward
    if (filters.visibility !== undefined) params.visibility = filters.visibility
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
  }
  const response = await api.get("/feed/", { params })
  return response.data
}

export async function getReport(id: number) {
  const response = await api.get(`/reports/${id}/`)
  return response.data
}

export async function createReport(data: Record<string, unknown> | FormData) {
  const response = await api.post("/reports/", data, {
    timeout: 180000,
  })
  return response.data
}

export async function updateReport(id: number, data: Record<string, unknown>) {
  const response = await api.patch(`/reports/${id}/`, data)
  return response.data
}

export async function deleteReport(id: number) {
  await api.delete(`/reports/${id}/`)
}

export async function getMyReports() {
  const response = await api.get("/reports/my/")
  return response.data
}

export async function getUserReports(
  userId: number,
  params?: { page?: number; page_size?: number }
): Promise<FeedResponse> {
  const response = await api.get(`/reports/user/${userId}/`, { params })
  return response.data
}

export async function getNearbyReports(params: NearbyParams) {
  const response = await api.get("/reports/nearby/", { params })
  return response.data
}

export async function upvoteReport(id: number) {
  const response = await api.post(`/reports/${id}/upvote/`)
  return response.data
}

export async function removeUpvote(id: number) {
  await api.delete(`/reports/${id}/upvote/`)
}

export async function getUpvotes(id: number) {
  const response = await api.get(`/reports/${id}/upvotes/`)
  return response.data
}

export async function updateReportStatus(id: number, status: string) {
  const response = await api.patch(`/reports/${id}/status/`, { status })
  return response.data
}

export async function addProgressNote(id: number, note: string) {
  const response = await api.post(`/reports/${id}/progress/`, { note })
  return response.data
}

export async function getPendingModeration() {
  const response = await api.get("/reports/pending_moderation/")
  return response.data
}

export async function moderateReport(id: number, action: "approved" | "rejected", note: string) {
  const response = await api.patch(`/reports/${id}/moderate/`, { action, note })
  return response.data
}
