import api from "./axios"

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  email: string
  full_name: string
  password: string
  confirm_password: string
  phone_number: string
  municipality: string
  ward_number: number
}

export interface AuthResponse {
  user: Record<string, unknown>
  access: string
  refresh: string
  is_scheduled_for_deletion?: boolean
  deleted_at?: string
}

export interface UserData {
  id: number
  email: string
  username: string | null
  full_name: string
  phone_number: string
  municipality: string
  ward_number: number
  profile_picture: string | null
  cover_photo: string | null
  bio: string | null
  role: "citizen" | "official"
  reputation_points: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface EmailEntry {
  id: number
  email: string
}

export interface EmailListResponse {
  primary: string
  extra: EmailEntry[]
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/accounts/login/", data)
  return response.data
}

export async function register(data: SignupData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/accounts/signup/", data)
  return response.data
}

export async function registerOfficial(data: SignupData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/accounts/signup/official/", data)
  return response.data
}

export async function refreshToken(
  refresh: string,
): Promise<{ access: string }> {
  const response = await api.post<{ access: string }>(
    "/accounts/token/refresh/",
    { refresh },
  )
  return response.data
}

export async function logout(refresh: string): Promise<void> {
  await api.post("/accounts/logout/", { refresh })
}

export async function getMe(): Promise<UserData> {
  const response = await api.get<UserData>("/accounts/me/")
  return response.data
}

export async function updateMe(
  data: Partial<UserData>,
): Promise<UserData> {
  const response = await api.patch<UserData>("/accounts/me/", data)
  return response.data
}

export async function uploadProfilePhoto(
  file: File,
  type: "profile" | "cover",
): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("type", type)
  const response = await api.post<{ url: string }>("/accounts/me/upload-photo/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

export async function deleteProfilePhoto(
  type: "profile" | "cover",
): Promise<void> {
  await api.delete("/accounts/me/delete-photo/", { data: { type } })
}

export async function requestPasswordReset(
  email: string,
): Promise<{ detail: string; code: string }> {
  const response = await api.post("/accounts/password-reset/", { email })
  return response.data
}

export async function confirmPasswordReset(data: {
  email: string
  code: string
  password: string
  confirm_password: string
}): Promise<{ detail: string }> {
  const response = await api.post("/accounts/password-reset/confirm/", data)
  return response.data
}

export async function listEmails(): Promise<EmailListResponse> {
  const response = await api.get<EmailListResponse>("/accounts/me/emails/")
  return response.data
}

export async function requestAddEmail(email: string): Promise<{ detail: string; code: string }> {
  const response = await api.post("/accounts/me/emails/add/", { email })
  return response.data
}

export async function verifyAddEmail(email: string, code: string): Promise<{ detail: string }> {
  const response = await api.post("/accounts/me/emails/verify/", { email, code })
  return response.data
}

export async function requestRemoveEmail(email: string): Promise<{ detail: string; code: string }> {
  const response = await api.post("/accounts/me/emails/remove/", { email })
  return response.data
}

export async function confirmRemoveEmail(email: string, code: string): Promise<{ detail: string }> {
  const response = await api.post("/accounts/me/emails/remove/confirm/", { email, code })
  return response.data
}

export async function checkUsername(username: string): Promise<{ available: boolean; username: string }> {
  const response = await api.post("/accounts/me/username/check/", { username })
  return response.data
}

export async function updateUsername(username: string): Promise<UserData> {
  const response = await api.patch<UserData>("/accounts/me/username/", { username })
  return response.data
}

export async function deleteAccount(): Promise<{ detail: string; code: string }> {
  const response = await api.post("/accounts/me/delete/")
  return response.data
}

export async function confirmDeleteAccount(code: string): Promise<{ detail: string }> {
  const response = await api.post("/accounts/me/delete/confirm/", { code })
  return response.data
}

export async function cancelDeleteAccount(): Promise<{ detail: string }> {
  const response = await api.post("/accounts/me/delete/cancel/")
  return response.data
}

export async function recoverAccount(): Promise<{ detail: string; code: string }> {
  const response = await api.post("/accounts/me/delete/recover/")
  return response.data
}

export async function confirmRecoverAccount(code: string): Promise<{ detail: string }> {
  const response = await api.post("/accounts/me/delete/recover/confirm/", { code })
  return response.data
}
