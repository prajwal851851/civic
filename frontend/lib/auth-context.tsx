'use client'

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { ReactNode } from "react"
import * as authApi from "@/lib/api/auth"
import { saveTokens, getAccessToken, getRefreshToken, clearTokens } from "@/lib/api/token"
import { handleApiError } from "@/lib/api/error-handler"

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: "citizen" | "official"
  username?: string
  displayName?: string
  photoURL?: string
  coverURL?: string
  bio?: string
  municipality?: string
  ward_number?: number
  reputation_points?: number
  is_verified?: boolean
  is_scheduled_for_deletion?: boolean
  scheduled_delete_at?: string
  created_at?: string
  profile?: ProfileData
}

export interface ProfileData {
  bio: string
  city: string
  ward: number
  website: string
  interests: string[]
  languages: string[]
  visibility: "public" | "followers" | "private"
  account: {
    phone: string
    email: string
    changePassword: string
    twoFactor: "off" | "app" | "sms"
    loginActivity: string
    activeDevices: string
    accountCreated: string
    verificationStatus: string
  }
  privacy: {
    identity: {
      reportAnonymously: boolean
      hideRealName: boolean
      hidePhotoInAnonymous: boolean
    }
    location: {
      showMunicipality: boolean
      showWard: boolean
      hideExactCoordinates: boolean
      blurLocation: boolean
    }
    activity: {
      hideActivityHistory: boolean
      hideSavedReports: boolean
      hideUpvotedReports: boolean
      hideFollowerCount: boolean
    }
    interaction: {
      whoCanMessage: "everyone" | "followers" | "nobody"
      whoCanComment: "everyone" | "followers" | "nobody"
      whoCanFollow: "everyone" | "followers" | "approved"
    }
  }
  notifications: {
    civic: {
      municipalityResponses: boolean
      reportStatusChanges: boolean
      emergencyAlerts: boolean
      communityUpdates: boolean
      nearbyIssueAlerts: boolean
    }
    social: {
      comments: boolean
      replies: boolean
      mentions: boolean
      follows: boolean
      upvotes: boolean
    }
    delivery: {
      push: boolean
      sms: boolean
      email: boolean
    }
  }
  accessibility: {
    darkMode: boolean
    fontSize: "small" | "medium" | "large" | "xlarge"
    reduceAnimations: boolean
    highContrast: boolean
    dyslexiaFriendly: boolean
    screenReader: boolean
    language: "english" | "nepali" | "hindi"
    colorBlindMode: boolean
  }
  community: {
    nsfwFilter: boolean
    autoHideLowQuality: boolean
    hideDuplicates: boolean
    defaultSort: "trending" | "new" | "nearby" | "following"
    defaultMapZoom: number
    defaultMapType: "street" | "satellite" | "hybrid"
  }
  map: {
    defaultHomeLocation: string
    preferredRadius: number
    autoCenter: boolean
    saveFavorites: boolean
    saveFrequentLocations: boolean
    enableLiveLocation: boolean
  }
  reporting: {
    defaultVisibility: "public" | "anonymous"
    defaultPriority: "low" | "medium" | "high"
    autoSaveDrafts: boolean
    attachLocation: boolean
    rememberCategory: boolean
  }
  reputation: {
    contributionScore: number
    communityRank: string
    badges: string[]
    reportsSubmitted: number
    reportsResolved: number
    helpfulVotes: number
    streak: number
    volunteerStatus: string
  }
  data: {
    retentionDays: number
  }
}

function mapUserData(data: Record<string, unknown>): User {
  return {
    id: String(data.id ?? ""),
    name: (data.full_name as string) || (data.display_name as string) || (data.name as string) || "",
    email: (data.email as string) || "",
    phone: data.phone_number as string,
    role: (data.role as "citizen" | "official") || "citizen",
    username: data.username as string,
    displayName: (data.full_name as string) || (data.display_name as string),
    photoURL: data.profile_picture as string,
    coverURL: data.cover_photo as string,
    bio: data.bio as string,
    municipality: data.municipality as string,
    ward_number: data.ward_number as number,
    reputation_points: data.reputation_points as number,
    is_verified: data.is_verified as boolean,
    is_scheduled_for_deletion: (data.is_deleted as boolean) || undefined,
    scheduled_delete_at: data.deleted_at as string,
    created_at: data.created_at as string,
  }
}

interface AuthContextType {
  user: User | null
  initialized: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (data: authApi.SignupData) => Promise<void>
  signupOfficial: (data: authApi.SignupData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  initialized: false,
  loading: false,
  login: async () => { throw new Error("AuthProvider not mounted") },
  signup: async () => {},
  signupOfficial: async () => {},
  logout: async () => {},
  updateUser: () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Clean up any leftover Supabase or mock auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("cv-user")
      }
      const token = getAccessToken()
      if (token) {
        try {
          const userData = await authApi.getMe()
          const mapped = mapUserData(userData as unknown as Record<string, unknown>)
          setUser(mapped)
          if (mapped.role === "official") {
            localStorage.removeItem("cv_pending_official")
          }
        } catch {
          // Don't clearTokens() here — the tokens are valid from login.
          // If getMe() fails (endpoint not ready, network blip, etc.),
          // we keep the tokens so the Axios interceptor can still attach
          // Authorization: Bearer <token> on the next API request.
          // If the token is truly expired, the response interceptor will
          // try to refresh it and only clear tokens if that also fails.
          console.warn("Auth: getMe() failed — keeping existing tokens")
        }
      }
      setInitialized(true)
    }
    init()
  }, [])

  useEffect(() => {
    if (initialized && user?.role === "official" && typeof window !== "undefined") {
      const path = window.location.pathname
      if (!path.startsWith("/official-")) {
        window.location.replace("/official-dashboard")
      }
    }
  }, [initialized, user])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await authApi.login({ email, password })
      saveTokens(response.access, response.refresh)
      const userData = mapUserData(response.user as Record<string, unknown>)
      if (response.is_scheduled_for_deletion) {
        userData.is_scheduled_for_deletion = true
        userData.scheduled_delete_at = response.deleted_at
      }
      setUser(userData)
      return userData
    } catch (err) {
      const apiErr = handleApiError(err)
      throw new Error(apiErr.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (data: authApi.SignupData) => {
    setLoading(true)
    try {
      const response = await authApi.register(data)
      saveTokens(response.access, response.refresh)
      setUser(mapUserData(response.user as Record<string, unknown>))
      if (typeof window !== "undefined") {
        localStorage.removeItem("cv_pending_official")
      }
    } catch (err) {
      const apiErr = handleApiError(err)
      throw new Error(apiErr.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const signupOfficial = useCallback(async (data: authApi.SignupData) => {
    setLoading(true)
    try {
      const response = await authApi.registerOfficial(data)
      saveTokens(response.access, response.refresh)
      setUser(mapUserData(response.user as Record<string, unknown>))
      if (typeof window !== "undefined") {
        localStorage.removeItem("cv_pending_official")
      }
    } catch (err) {
      const apiErr = handleApiError(err)
      throw new Error(apiErr.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe()
      const mapped = mapUserData(userData as unknown as Record<string, unknown>)
      setUser(mapped)
    } catch {
      console.warn("refreshUser: getMe() failed")
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      const refresh = getRefreshToken()
      if (refresh) {
        try {
          await authApi.logout(refresh)
        } catch {
          // ignore logout API errors — clear locally regardless
        }
      }
    } finally {
      setUser(null)
      clearTokens()
      if (typeof window !== "undefined") {
        localStorage.removeItem("cv_pending_official")
      }
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, initialized, loading, login, signup, signupOfficial, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
