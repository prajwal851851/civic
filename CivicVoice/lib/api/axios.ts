import axios from "axios"
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "./token"

// MODULE LOAD TIME — this runs once when the module is first imported
console.log("[axios.ts] Module loading — attaching interceptor to api instance")
console.log("[axios.ts] typeof window:", typeof window)
console.log("[axios.ts] baseURL:", process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api")

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  timeout: 120000,
  withCredentials: false,
})

// Sanity check: verify getAccessToken is the function we expect
console.log("[axios.ts] getAccessToken is function:", typeof getAccessToken === "function")

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()

    console.log("Interceptor executed")
    console.log("URL:", config.url)
    console.log("Token:", token)
    console.log("Before:", config.headers)
    console.log("Authorization:", config.headers.Authorization)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log("After Auth set:", config.headers.Authorization)

    return config
  },
  (error) => Promise.reject(error),
)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        isRefreshing = false
        processQueue(new Error("No refresh token available"))
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/accounts/token/refresh/`,
          { refresh: refreshToken },
        )
        saveTokens(data.access, refreshToken)
        processQueue(null, data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        clearTokens()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
