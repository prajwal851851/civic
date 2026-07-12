"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized) return
    if (user && !user.is_scheduled_for_deletion) {
      router.replace(user.role === "official" ? "/official-dashboard" : "/community-feed")
    }
  }, [user, initialized, router])

  if (!initialized) {
    return (
      <div className="auth-card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 14, color: "var(--color-muted)" }}>Loading...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="auth-card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 14, color: "var(--color-muted)" }}>Redirecting...</div>
      </div>
    )
  }

  return <>{children}</>
}
