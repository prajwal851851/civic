import api from "./axios"

export async function getNotifications() {
  const response = await api.get("/notifications/")
  return response.data
}

export async function markRead(id: number) {
  const response = await api.patch(`/notifications/${id}/read/`)
  return response.data
}

export async function markAllRead() {
  const response = await api.patch("/notifications/read-all/")
  return response.data
}

export async function deleteNotification(id: number) {
  await api.delete(`/notifications/${id}/`)
}
