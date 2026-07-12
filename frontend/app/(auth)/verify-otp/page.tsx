"use client"

import { useRef, type KeyboardEvent } from "react"
import Link from "next/link"

export default function VerifyOtpPage() {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleInput = (idx: number) => {
    if (inputRefs.current[idx]?.value.length === 1 && idx < inputRefs.current.length - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !inputRefs.current[idx]?.value && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Verify Phone Number</h1>
      <p className="otp-info">Enter the 6-digit code sent to</p>
      <p className="otp-info" style={{ fontWeight: 600, color: "var(--color-text)" }}>
        +977-98XXXXXXXX
      </p>

      <div className="otp-inputs">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            maxLength={1}
            pattern="[0-9]"
            inputMode="numeric"
            autoFocus={i === 0}
            onInput={() => handleInput(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          />
        ))}
      </div>

      <Link href="/complete-profile">
        <button className="auth-btn auth-btn-primary">Verify</button>
      </Link>

      <div className="otp-resend">
        <button type="button" className="auth-link">
          Resend code
        </button>
        <span style={{ color: "var(--color-muted)", fontSize: 14, margin: "0 6px" }}>&middot;</span>
        <Link href="/signup" className="auth-link">
          Change phone number
        </Link>
      </div>
    </div>
  )
}
