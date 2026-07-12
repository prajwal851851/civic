"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateMe } from "@/lib/api/auth"

export default function CompleteProfilePage() {
  const router = useRouter()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = e.currentTarget
    try {
      await updateMe({
        full_name: (form.querySelector("#cpName") as HTMLInputElement).value,
        email: (form.querySelector("#cpEmail") as HTMLInputElement).value,
        municipality: "Kathmandu",
        ward_number: parseInt((form.querySelector("#cpWard") as HTMLInputElement).value, 10),
        bio: (form.querySelector("#cpBio") as HTMLTextAreaElement).value || null,
      })
      router.push("/")
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to update profile",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Complete Your Profile</h1>
      <p className="auth-subtitle">Just a few more details to get started</p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 12 }}>
            {error}
          </div>
        )}
        <div className="profile-photo-upload">
          <div className="photo-preview" id="photoPreview">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" />
            ) : (
              <i className="fa-regular fa-user" />
            )}
          </div>
          <div>
            <button type="button" className="upload-btn" onClick={() => document.getElementById("photoInput")?.click()}>
              Upload Photo
            </button>
            <input
              type="file"
              id="photoInput"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
            <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "4px 0 0" }}>
              Max 5MB, JPG or PNG
            </p>
          </div>
        </div>

        <div className="auth-fg">
          <label htmlFor="cpName">Display Name</label>
          <input type="text" id="cpName" placeholder="Your full name" required />
        </div>
        <div className="auth-fg">
          <label htmlFor="cpEmail">Email Address</label>
          <input type="email" id="cpEmail" placeholder="user@example.com" required />
        </div>
        <input type="hidden" id="cpMunicipality" value="Kathmandu" />
        <div className="auth-fg">
          <label htmlFor="cpWard">Ward Number</label>
          <input type="number" id="cpWard" placeholder="e.g. 3" min={1} required />
        </div>
        <div className="auth-fg">
          <label htmlFor="cpBio">
            Bio <span className="su-opt-label">(optional)</span>
          </label>
          <textarea id="cpBio" placeholder="Tell us a little about yourself..." />
        </div>

        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Create Account"}
        </button>
      </form>
    </div>
  )
}
