import api from "./axios"

export interface DashboardFilters {
  page?: number
  status?: string
  category?: string
  municipality?: string
  ward?: number
  period?: string
}

export async function getSummary() {
  const response = await api.get("/dashboard/summary/")
  return response.data
}

export async function getAnalytics() {
  const response = await api.get("/dashboard/analytics/")
  return response.data
}

export async function getRecentReports(filters?: DashboardFilters) {
  const response = await api.get("/dashboard/recent-reports/", {
    params: filters,
  })
  return response.data
}
