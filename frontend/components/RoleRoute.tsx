"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: ("citizen" | "official")[]
  fallback?: string
}

export default function RoleRoute({ children, allowedRoles, fallback }: RoleRouteProps) {
  const { user, initialized } = useAuth()
  const router = useRouter()

  const isRecoveryPage = typeof window !== "undefined" && window.location.pathname === "/account-scheduled-deletion"

  useEffect(() => {
    if (!initialized) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.is_scheduled_for_deletion && !isRecoveryPage) {
      router.replace("/account-scheduled-deletion")
      return
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(fallback || (user.role === "official" ? "/official-dashboard" : "/community-feed"))
    }
  }, [user, initialized, router, allowedRoles, fallback, isRecoveryPage])

  if (!initialized) {
    return (
      <div className="layout">
        <main className="feed-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 14, color: "var(--color-muted)" }}>Loading...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="layout">
        <main className="feed-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 14, color: "var(--color-muted)" }}>Redirecting...</div>
          </div>
        </main>
      </div>
    )
  }

  if (user.is_scheduled_for_deletion && !isRecoveryPage) {
    return (
      <div className="layout">
        <main className="feed-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 14, color: "var(--color-muted)" }}>Redirecting...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="layout">
        <main className="feed-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 14, color: "var(--color-muted)" }}>Redirecting...</div>
          </div>
        </main>
      </div>
    )
  }

  return <>{children}</>
}
