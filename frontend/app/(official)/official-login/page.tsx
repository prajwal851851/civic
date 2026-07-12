"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function OfficialLoginPage() {
  const { login, loading, user } = useAuth()
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")

  if (user) {
    router.push("/official-dashboard")
    return null
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    login(email, password)
      .then(() => router.push("/official-dashboard"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Login failed. Please try again.")
      })
  }

  return (
    <div className="auth-page">
      <header className="site-header">
        <div className="header-inner">
          <Link href="/official-dashboard" className="logo" id="logoLink">
            Civic<span className="logo-accent">Voice</span>
          </Link>
        </div>
      </header>

      <main>
        <div className="auth-container">
          <div className="auth-card">
            <Link href="/official-dashboard" className="auth-logo-link">
              Civic<span className="logo-accent">Voice</span>
            </Link>
            <p className="auth-subtitle">Sign in as municipal official</p>
            <form onSubmit={handleSubmit}>
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
                    type={showPw ? "text" : "password"}
                    id="offPassword"
                    name="password"
                    placeholder="Enter your password"
                    required
                    className="su-pw-input"
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                    <i className={`fa-regular ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
                {loading ? "Signing in..." : "Login as Official"}
              </button>
            </form>
            <div className="auth-switch">
              <Link href="/" className="auth-link">&larr; Back to Public Site</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
