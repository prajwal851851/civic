'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { recoverAccount, confirmRecoverAccount } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/error-handler"

export default function AccountScheduledDeletionPage() {
  const { user, initialized, logout, refreshUser } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<"notice" | "code">("notice")
  const [code, setCode] = useState("")
  const [sending, setSending] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recovered, setRecovered] = useState(false)

  useEffect(() => {
    if (initialized && !user) {
      router.push("/login")
    }
  }, [user, initialized, router])

  if (!initialized || !user) return null

  const deleteDate = user.scheduled_delete_at
    ? new Date(user.scheduled_delete_at).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      })
    : "soon"

  if (recovered) {
    return (
      <div className="auth-card" style={{ textAlign: 'center', padding: 40, marginTop: 60 }}>
        <h1 style={{ color: '#059669', marginBottom: 12 }}>Account Recovered!</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: 20 }}>
          Your account has been successfully recovered. Welcome back!
        </p>
        <button
          className="auth-btn auth-btn-primary"
          onClick={() => router.push("/community-feed")}
        >
          Go to Community Feed
        </button>
      </div>
    )
  }

  return (
    <div className="auth-card" style={{ textAlign: 'center', padding: 40, marginTop: 60, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>&#x26A0;</div>
      <h1 style={{ color: '#DC2626', marginBottom: 12, fontSize: 22 }}>
        Account Scheduled for Deletion
      </h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: 8, lineHeight: 1.5 }}>
        Your account is scheduled to be permanently deleted on <strong style={{ color: 'var(--color-text)' }}>{deleteDate}</strong>.
      </p>
      <p style={{ color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.5 }}>
        If you did not request this, you can recover your account. A 6-digit verification code will be sent to your phone number.
      </p>

      {step === "notice" ? (
        <button
          className="auth-btn auth-btn-primary"
          onClick={async () => {
            setSending(true)
            setError(null)
            try {
              await recoverAccount()
              setStep("code")
            } catch (err) {
              setError(handleApiError(err).message)
            } finally {
              setSending(false)
            }
          }}
          disabled={sending}
          style={{ fontWeight: 600, width: '100%' }}
        >
          {sending ? "Sending Code..." : "Recover Account"}
        </button>
      ) : (
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 8 }}>
            A verification code has been sent to your phone. Enter it below to recover your account.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            disabled={recovering}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12, textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
          />
          {error && (
            <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{error}</div>
          )}
          <button
            className="auth-btn auth-btn-primary"
            onClick={async () => {
              if (!code) return
              setRecovering(true)
              setError(null)
              try {
                await confirmRecoverAccount(code)
                await refreshUser()
                setRecovered(true)
              } catch (err) {
                setError(handleApiError(err).message)
              } finally {
                setRecovering(false)
              }
            }}
            disabled={!code || recovering}
            style={{ fontWeight: 600, width: '100%' }}
          >
            {recovering ? "Recovering..." : "Confirm Recovery"}
          </button>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          className="auth-btn auth-btn-secondary"
          onClick={() => { logout(); router.push("/") }}
          style={{ width: '100%' }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
