"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PublicRoute from "@/components/PublicRoute"
import { requestPasswordReset, confirmPasswordReset, handleApiError } from "@/lib/api"

function ForgotPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "reset">("email")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const form = e.currentTarget
      const emailVal = (form.elements.namedItem("email") as HTMLInputElement).value
      setEmail(emailVal)
      const res = await requestPasswordReset(emailVal)
      setSuccess(res.detail)
      setStep("reset")
    } catch (err: unknown) {
      setError(handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const form = e.currentTarget
      const code = (form.elements.namedItem("code") as HTMLInputElement).value
      const password = (form.elements.namedItem("password") as HTMLInputElement).value
      const confirm_password = (form.elements.namedItem("confirm_password") as HTMLInputElement).value
      await confirmPasswordReset({ email, code, password, confirm_password })
      setSuccess("Password reset successfully!")
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: unknown) {
      setError(handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <Link href="/" className="auth-logo-link">
        Civic<span className="logo-accent">Voice</span>
      </Link>

      {step === "email" && (
        <>
          <p className="auth-subtitle">Enter your email to receive a reset code</p>
          <form onSubmit={handleEmailSubmit}>
            {error && (
              <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 12 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ color: "var(--color-success, #059669)", fontSize: 14, marginBottom: 12 }}>
                {success}
              </div>
            )}
            <div className="auth-fg">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="user@example.com" required />
            </div>
            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
          <div className="auth-switch">
            Remember your password?{" "}
            <Link href="/login" className="auth-link">
              Login
            </Link>
          </div>
        </>
      )}

      {step === "reset" && (
        <>
          <p className="auth-subtitle">Enter the 6-digit code and your new password</p>
          <form onSubmit={handleResetSubmit}>
            {error && (
              <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 12 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ color: "var(--color-success, #059669)", fontSize: 14, marginBottom: 12 }}>
                {success}
              </div>
            )}
            <div className="auth-fg">
              <label htmlFor="code">Reset Code</label>
              <input type="text" id="code" name="code" placeholder="123456" maxLength={6} required className="su-pw-input" />
            </div>
            <div className="auth-fg">
              <label htmlFor="password">New Password</label>
              <div className="auth-pw-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="su-pw-input"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  <i className={`fa-regular ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </div>
            <div className="auth-fg">
              <label htmlFor="confirm_password">Confirm Password</label>
              <div className="auth-pw-wrap">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  placeholder="Repeat your password"
                  required
                  minLength={8}
                  className="su-pw-input"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                  <i className={`fa-regular ${showConfirmPw ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </div>
            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
          <div className="auth-switch">
            <button type="button" className="auth-link" onClick={() => { setStep("email"); setError(""); setSuccess("") }}>
              Resend code
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <PublicRoute>
      <ForgotPasswordForm />
    </PublicRoute>
  )
}
