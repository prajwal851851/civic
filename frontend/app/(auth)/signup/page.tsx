"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import PublicRoute from "@/components/PublicRoute"

export default function SignupPage() {
  return (
    <PublicRoute>
      <SignupForm />
    </PublicRoute>
  )
}

function SignupForm() {
  const { signup, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"citizen" | "official">("citizen")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showOffPw, setShowOffPw] = useState(false)
  const [showOffConfirm, setShowOffConfirm] = useState(false)
  const [error, setError] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [sendDisabled, setSendDisabled] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState(false)

  const togglePw = (field: string) => {
    if (field === "pw") setShowPw(!showPw)
    else if (field === "confirm") setShowConfirm(!showConfirm)
    else if (field === "offPw") setShowOffPw(!showOffPw)
    else if (field === "offConfirm") setShowOffConfirm(!showOffConfirm)
  }

  const sendCode = () => {
    setVerifyStatus(true)
    setSendDisabled(true)
    setTimeout(() => setSendDisabled(false), 30000)
  }

  const HARDCODED_OTP = "123456"

  const handleCitizenSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    const code = (form.querySelector("#suCode") as HTMLInputElement).value.trim()
    if (code !== HARDCODED_OTP) {
      setError("Invalid verification code. Use 123456.")
      return
    }
    const phone_number = (form.querySelector("#suPhone") as HTMLInputElement).value
    const email = (form.querySelector("#suEmail") as HTMLInputElement).value
    const full_name = (form.querySelector("#suName") as HTMLInputElement).value
    const password = (form.querySelector("#suPassword") as HTMLInputElement).value
    const confirm_password = (form.querySelector("#suConfirm") as HTMLInputElement).value
    const ward_number = parseInt((form.querySelector("#suWard") as HTMLInputElement).value, 10)
    signup({ email, full_name, password, confirm_password, phone_number, municipality: "Kathmandu", ward_number })
      .then(() => router.push("/community-feed"))
      .catch((err: unknown) => {
        if (err && typeof err === "object" && "message" in err) {
          setError((err as { message: string }).message)
        } else {
          setError("Registration failed. Please try again.")
        }
      })
  }

  const handleOfficialSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    const full_name = (form.querySelector("#offSignupName") as HTMLInputElement).value
    const email = (form.querySelector("#offSignupEmail") as HTMLInputElement).value
    const password = (form.querySelector("#offSignupPw") as HTMLInputElement).value
    const confirm_password = (form.querySelector("#offSignupConfirm") as HTMLInputElement).value
    const phone_number = (form.querySelector("#offSignupPhone") as HTMLInputElement).value
    const ward_number = parseInt((form.querySelector("#offSignupWard") as HTMLInputElement).value, 10)
    signup({ email, full_name, password, confirm_password, phone_number, municipality: "Kathmandu", ward_number })
      .then(() => {
        localStorage.setItem("cv_pending_official", "true")
        router.push("/community-feed")
      })
      .catch((err: unknown) => {
        if (err && typeof err === "object" && "message" in err) {
          setError((err as { message: string }).message)
        } else {
          setError("Registration failed. Please try again.")
        }
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
        <p className="auth-subtitle">Create your citizen account</p>
        <form onSubmit={handleCitizenSignup}>
          {error && (
            <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="auth-fg">
            <label htmlFor="suPhone">Phone Number</label>
            <div className="su-otp-row">
              <input type="tel" id="suPhone" placeholder="98XXXXXXXX" required className="su-otp-input" />
              <button type="button" className="su-send-btn" onClick={sendCode} disabled={sendDisabled}>
                Send Code
              </button>
            </div>
            {verifyStatus && (
              <div className="su-verify-status" id="verifyStatus">
                Code sent! Use <strong>123456</strong>
              </div>
            )}
          </div>
          <div className="auth-fg">
            <label htmlFor="suCode">Verification Code</label>
            <input
              type="text"
              id="suCode"
              placeholder="123456"
              required
              maxLength={6}
              inputMode="numeric"
              className="su-otp-input"
              defaultValue="123456"
            />
          </div>
          <div className="auth-fg">
            <label htmlFor="suEmail">Email Address</label>
            <input type="email" id="suEmail" placeholder="user@example.com" required />
          </div>
          <div className="auth-fg">
            <label htmlFor="suName">Full Name</label>
            <input type="text" id="suName" placeholder="Your full name" required />
          </div>
          <input type="hidden" id="suMunicipality" value="Kathmandu" />
          <div className="auth-fg">
            <label htmlFor="suWard">Ward Number</label>
            <input type="number" id="suWard" placeholder="e.g. 3" min={1} required />
          </div>
          <div className="auth-fg">
            <label htmlFor="suPassword">Password</label>
            <div className="auth-pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                id="suPassword"
                placeholder="Create a password (min 6 chars)"
                required
                className="su-pw-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => togglePw("pw")}>
                <i className={`fa-regular ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>
          <div className="auth-fg">
            <label htmlFor="suConfirm">Confirm Password</label>
            <div className="auth-pw-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                id="suConfirm"
                placeholder="Repeat your password"
                required
                className="su-pw-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => togglePw("confirm")}>
                <i className={`fa-regular ${showConfirm ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>
          <label className="su-checkbox">
            <input type="checkbox" required />{" "}
            <span>
              I agree to the <Link href="/terms">Terms &amp; Conditions</Link> and{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>
            </span>
          </label>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">
            Login
          </Link>
        </div>
      </div>

      <div style={{ display: activeTab === "official" ? "block" : "none" }}>
        <p className="auth-subtitle">Register as municipal official</p>
        <form onSubmit={handleOfficialSignup}>
          {error && (
            <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="auth-fg">
            <label htmlFor="offSignupName">Full Name</label>
            <input type="text" id="offSignupName" placeholder="Your full name" required />
          </div>
          <div className="auth-fg">
            <label htmlFor="offSignupEmail">Email Address</label>
            <input type="email" id="offSignupEmail" placeholder="official@municipality.gov.np" required />
          </div>
          <div className="auth-fg">
            <label htmlFor="offSignupPhone">Phone Number</label>
            <input type="tel" id="offSignupPhone" placeholder="98XXXXXXXX" required />
          </div>
          <input type="hidden" id="offSignupMunicipality" value="Kathmandu" />
          <div className="auth-fg">
            <label htmlFor="offSignupWard">Ward Number</label>
            <input type="number" id="offSignupWard" placeholder="e.g. 3" min={1} required />
          </div>
          <div className="auth-fg">
            <label htmlFor="offSignupPw">Password</label>
            <div className="auth-pw-wrap">
              <input
                type={showOffPw ? "text" : "password"}
                id="offSignupPw"
                placeholder="Create a password (min 6 chars)"
                required
                className="su-pw-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => togglePw("offPw")}>
                <i className={`fa-regular ${showOffPw ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>
          <div className="auth-fg">
            <label htmlFor="offSignupConfirm">Confirm Password</label>
            <div className="auth-pw-wrap">
              <input
                type={showOffConfirm ? "text" : "password"}
                id="offSignupConfirm"
                placeholder="Repeat your password"
                required
                className="su-pw-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => togglePw("offConfirm")}>
                <i className={`fa-regular ${showOffConfirm ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="auth-switch">
          Already registered?{" "}
          <Link href="/login" className="auth-link">
            Login as Official
          </Link>
        </div>
      </div>
    </div>
  )
}
