"use client"

import { useState, useEffect } from "react"

export default function OfficialPendingBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(localStorage.getItem("cv_pending_official") === "true")
    }
  }, [])

  if (!show) return null

  return (
    <div className="official-pending-banner" role="alert">
      <div className="official-pending-banner-text">
        <strong>Pending Verification:</strong> Your account is registered as a municipal official but is awaiting
        approval. You will be able to access the official dashboard once an administrator verifies your role.
      </div>
      <button
        onClick={() => setShow(false)}
        className="official-pending-banner-close"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  )
}
