"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

/**
 * Shown only for official accounts that are not yet verified.
 * (Previously this was wrongly shown to citizens after "official" signup
 * via a localStorage flag.)
 */
export default function OfficialPendingBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Clear obsolete localStorage flag from older signup flow
    if (typeof window !== "undefined") {
      localStorage.removeItem("cv_pending_official")
    }
  }, [])

  const show = !!user && user.role === "official" && !user.is_verified && !dismissed

  if (!show) return null

  return (
    <div className="official-pending-banner" role="alert">
      <div className="official-pending-banner-text">
        <strong>Pending Verification:</strong> Your official account is awaiting administrator approval.
        You will get full dashboard access once your role is verified.
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="official-pending-banner-close"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  )
}
