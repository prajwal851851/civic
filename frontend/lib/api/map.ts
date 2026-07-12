import api from "./axios"

export interface MapMarkerFilters {
  municipality?: string
  ward?: number
  category?: string
  status?: string
  bbox?: string
}

export async function getMarkers(filters?: MapMarkerFilters) {
  const response = await api.get("/map/markers/", { params: filters })
  return response.data
}
