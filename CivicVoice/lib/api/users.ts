import api from "./axios"

export interface PublicProfile {
  id: number
  username: string | null
  full_name: string
  profile_picture: string
  cover_photo: string
  bio: string
  municipality: string
  ward_number: number
  reputation_points: number
  is_verified: boolean
  created_at: string
  report_count: number
}

export async function getPublicProfile(id: number): Promise<PublicProfile> {
  const response = await api.get(`/accounts/profile/${id}/`)
  return response.data
}

export async function updateProfile(data: Record<string, unknown>) {
  const response = await api.patch("/accounts/me/", data)
  return response.data
}
