import type { AxiosError } from "axios"

export interface ApiError {
  message: string
  status: number | null
  errors: Record<string, string[]> | null
}

export function handleApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<Record<string, unknown>>

  if (axiosError.response) {
    const { status, data } = axiosError.response

    if (data?.detail && typeof data.detail === "string") {
      return { message: data.detail, status, errors: null }
    }

    if (typeof data === "object" && data !== null) {
      const errorMessages: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          errorMessages[key] = value.map(String)
        }
      }
      if (Object.keys(errorMessages).length > 0) {
        const firstMsg =
          errorMessages[Object.keys(errorMessages)[0]]?.[0] || "Validation error"
        return { message: firstMsg, status, errors: errorMessages }
      }
    }

    const statusMessages: Record<number, string> = {
      400: "Invalid request. Please check your input.",
      401: "Unauthorized. Please log in again.",
      403: "You do not have permission to perform this action.",
      404: "The requested resource was not found.",
      409: "Conflict. The resource already exists.",
      429: "Too many requests. Please try again later.",
      500: "Server error. Please try again later.",
    }

    return {
      message: statusMessages[status] || `Request failed with status ${status}`,
      status,
      errors: null,
    }
  }

  if (axiosError.request) {
    return {
      message: "Network error. Please check your connection.",
      status: null,
      errors: null,
    }
  }

  return {
    message: axiosError.message || "An unexpected error occurred.",
    status: null,
    errors: null,
  }
}
