"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isRecoveryPage = pathname === "/account-scheduled-deletion"

  useEffect(() => {
    if (!initialized) return
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    } else if (user.is_scheduled_for_deletion && !isRecoveryPage) {
      console.log("[ProtectedRoute] Redirecting deleted user to recovery page")
      router.replace("/account-scheduled-deletion")
    } else if (user.is_scheduled_for_deletion) {
      console.log("[ProtectedRoute] User is deleted but on recovery page, no redirect")
    } else {
      console.log("[ProtectedRoute] User is not deleted, showing content")
    }
  }, [user, initialized, router, pathname, isRecoveryPage])

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

  return <>{children}</>
}
