import api from "./axios"

export async function getComments(reportId: number) {
  const response = await api.get(`/reports/${reportId}/comments/`)
  return response.data
}

export async function createComment(
  reportId: number,
  data: { content: string; parent?: number },
) {
  const response = await api.post(
    `/reports/${reportId}/comments/`,
    data,
  )
  return response.data
}

export async function getComment(id: number) {
  const response = await api.get(`/comments/${id}/`)
  return response.data
}

export async function updateComment(id: number, data: { content: string }) {
  const response = await api.patch(`/comments/${id}/`, data)
  return response.data
}

export async function deleteComment(id: number) {
  await api.delete(`/comments/${id}/`)
}
