"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import PublicRoute from "@/components/PublicRoute"

function LoginForm() {
  const { login, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")

  const [activeTab, setActiveTab] = useState<"citizen" | "official">("citizen")
  const [showCitizenPw, setShowCitizenPw] = useState(false)
  const [showOfficialPw, setShowOfficialPw] = useState(false)
  const [error, setError] = useState("")

  const togglePw = (field: "citizen" | "official") => {
    if (field === "citizen") setShowCitizenPw(!showCitizenPw)
    else setShowOfficialPw(!showOfficialPw)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>, role: string) => {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    login(email, password)
      .then((userData) => {
        if (userData?.is_scheduled_for_deletion) {
          router.push("/account-scheduled-deletion")
          return
        }
        const actualRole = userData?.role || role
        if (role === "official" && actualRole === "citizen") {
          localStorage.setItem("cv_pending_official", "true")
        }
        router.push(actualRole === "official" ? redirectTo || "/official-dashboard" : redirectTo || "/community-feed")
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Login failed. Please try again.")
        console.error("[login] Login error:", err)
      })
  }

  return (
    <div className="auth-card">
      <Link href="/" className="auth-logo-link">
        Civic<span className="logo-accent">Voice</span>
      </Link>
      <div className="auth-role-tabs">
        <button
          className={`auth-role-tab${activeTab === "citizen" ? " active" : ""}`}
          onClick={() => setActiveTab("citizen")}
        >
          Citizen
        </button>
        <button
          className={`auth-role-tab${activeTab === "official" ? " active" : ""}`}
          onClick={() => setActiveTab("official")}
        >
          Official
        </button>
      </div>

      <div style={{ display: activeTab === "citizen" ? "block" : "none" }}>
        <p className="auth-subtitle">Sign in to your citizen account</p>
        <form onSubmit={(e) => handleSubmit(e, "citizen")}>
          {error && (
            <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="auth-fg">
            <label htmlFor="citizenEmail">Email Address</label>
            <input type="email" id="citizenEmail" name="email" placeholder="user@example.com" required />
          </div>
          <div className="auth-fg">
            <label htmlFor="citizenPassword">Password</label>
            <div className="auth-pw-wrap">
              <input
                type={showCitizenPw ? "text" : "password"}
                id="citizenPassword"
                name="password"
                placeholder="Enter your password"
                required
                className="su-pw-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => togglePw("citizen")}>
                <i className={`fa-regular ${showCitizenPw ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>
          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" /> Remember me
            </label>
            <Link href="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="auth-link">
            Sign Up
          </Link>
        </div>
      </div>

      <div style={{ display: activeTab === "official" ? "block" : "none" }}>
        <p className="auth-subtitle">Sign in as municipal official</p>
        <form onSubmit={(e) => handleSubmit(e, "official")}>
          {error && (
            <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="auth-fg">
            <label htmlFor="offEmail">Email Address</label>
            <input type="email" id="offEmail" name="email" placeholder="official@municipality.gov.np" required />
          </div>
          <div className="auth-fg">
            <label htmlFor="offPassword">Password</label>
            <div className="auth-pw-wrap">
              <input
                type={showOfficialPw ? "text" : "password"}
                id="offPassword"
                name="password"
                placeholder="Enter your password"
                required
                className="su-pw-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => togglePw("official")}>
                <i className={`fa-regular ${showOfficialPw ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="auth-switch">
          Not registered?{" "}
          <Link href="/signup" className="auth-link">
            Register as Official
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>Loading...</div>}>
      <PublicRoute>
        <LoginForm />
      </PublicRoute>
    </Suspense>
  )
}
