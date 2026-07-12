'use client'

import React, { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getMyReports, deleteReport } from "@/lib/api/reports"
import {
  updateMe, uploadProfilePhoto, deleteProfilePhoto,
  listEmails, requestAddEmail, verifyAddEmail,
  requestRemoveEmail, confirmRemoveEmail,
  checkUsername, updateUsername, deleteAccount, confirmDeleteAccount, cancelDeleteAccount,
} from "@/lib/api/auth"
import type { EmailListResponse } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/error-handler"
import type { FeedReport } from "@/lib/api/reports"

const CATEGORY_LABEL: Record<string, string> = {
  roads: "Roads", street_lights: "Street Lights", garbage: "Garbage",
  water: "Water", sewage: "Sewage", electricity: "Electricity",
  parks: "Parks", noise: "Noise", other: "Other",
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="16" r="8" />
      <path d="M8 44c0-8.8 7.2-16 16-16s16 7.2 16 16" />
    </svg>
  )
}

function MyReports({ onStatsChange }: { onStatsChange?: (stats: { total: number; open: number; in_review: number; resolved: number; rejected: number }) => void }) {
  const [reports, setReports] = useState<FeedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyReports() as { results?: FeedReport[] } | FeedReport[]
      const r = Array.isArray(data) ? data : (data.results || [])
      setReports(r)
      if (onStatsChange) {
        const statusCounts: Record<string, number> = {}
        r.forEach((rep: FeedReport) => {
          statusCounts[rep.status] = (statusCounts[rep.status] || 0) + 1
        })
        onStatsChange({
          total: r.length,
          open: statusCounts['open'] || 0,
          in_review: statusCounts['in_review'] || 0,
          resolved: statusCounts['resolved'] || 0,
          rejected: statusCounts['rejected'] || 0,
        })
      }
    } catch {
      if (!deletingId) setError("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }, [onStatsChange, deletingId])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return
    setDeletingId(id)
    try {
      await deleteReport(id)
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      const apiErr = handleApiError(err)
      setError(apiErr.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <div className="pv-empty">Loading reports...</div>
  if (error) return <div className="pv-empty" style={{ color: '#EF4444' }}>{error}</div>
  if (reports.length === 0) return <div className="pv-empty">No reports yet. Submit your first report!</div>

  return (
    <div>
      {reports.map(r => {
        const statusColors: Record<string, string> = { open: '#EF4444', in_review: '#D97706', resolved: '#059669', rejected: '#6B7280' }
        const statusBgs: Record<string, string> = { open: '#FEE2E2', in_review: '#FEF3C7', resolved: '#D1FAE5', rejected: '#F3F4F6' }
        const statusLabels: Record<string, string> = { open: 'Open', in_review: 'In Review', resolved: 'Resolved', rejected: 'Rejected' }
        return (
          <div key={r.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', marginBottom: 8,
              borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-card-bg)',
            }}
          >
            <Link href={`/report-details/${r.id}`}
              style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                {CATEGORY_LABEL[r.category] || r.category} &middot; Ward {r.ward_number} &middot; {new Date(r.created_at).toLocaleDateString()}
              </div>
              <span style={{
                display: 'inline-block', marginTop: 6, padding: '2px 10px',
                borderRadius: 10, fontWeight: 600, fontSize: 12,
                background: statusBgs[r.status] || '#F3F4F6',
                color: statusColors[r.status] || '#6B7280',
              }}>
                {statusLabels[r.status] || r.status}
              </span>
            </Link>
            <button
              onClick={() => handleDelete(r.id)}
              disabled={deletingId === r.id}
              style={{
                background: '#FEE2E2', color: '#DC2626', border: 'none',
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {deletingId === r.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

const settingTabs = [
  { key: "profile", label: "Edit Profile" },
  { key: "account", label: "Account" },
  { key: "notifications", label: "Notifications" },
  { key: "accessibility", label: "Accessibility" },
  { key: "community", label: "Community" },
  { key: "data", label: "Data & Security" },
]

export default function ProfilePage() {
  const { user, initialized, refreshUser, logout } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"reports">("reports")
  const [showEdit, setShowEdit] = useState(false)
  const [activeSetting, setActiveSetting] = useState("profile")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editWard, setEditWard] = useState("")

  const [stats, setStats] = useState({ total: 0, open: 0, in_review: 0, resolved: 0, rejected: 0 })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState<"profile" | "cover" | null>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [usernameInput, setUsernameInput] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameSaving, setUsernameSaving] = useState(false)

  const [emails, setEmails] = useState<EmailListResponse | null>(null)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [addEmailCode, setAddEmailCode] = useState("")
  const [addEmailStep, setAddEmailStep] = useState<"input" | "verify">("input")
  const [addEmailLoading, setAddEmailLoading] = useState(false)
  const [addEmailError, setAddEmailError] = useState<string | null>(null)
  const [removeEmailTarget, setRemoveEmailTarget] = useState<string | null>(null)
  const [removeEmailCode, setRemoveEmailCode] = useState("")
  const [removeEmailLoading, setRemoveEmailLoading] = useState(false)
  const [removeEmailError, setRemoveEmailError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteStep, setDeleteStep] = useState<"confirm" | "code">("confirm")
  const [deleteCode, setDeleteCode] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const resetDelete = () => { setShowDeleteConfirm(false); setDeleteStep("confirm"); setDeleteCode(""); setDeleteError(null) }

  useEffect(() => {
    if (user) {
      setEditName(user.name || "")
      setEditBio(user.bio || "")
      setEditWard(user.ward_number ? String(user.ward_number) : "")
    }
  }, [user])

  useEffect(() => {
    if (initialized && !user) router.push("/login?redirect=" + encodeURIComponent("/profile"))
  }, [user, initialized, router])

  useEffect(() => {
    if (user) {
      setUsernameInput(user.username || "")
    }
  }, [user])

  const loadEmails = useCallback(async () => {
    setEmailsLoading(true)
    setEmailError(null)
    try {
      const data = await listEmails()
      setEmails(data)
    } catch {
      setEmailError("Failed to load emails")
    } finally {
      setEmailsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showEdit && activeSetting === "account") {
      loadEmails()
    }
  }, [showEdit, activeSetting, loadEmails])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(type)
    try {
      await uploadProfilePhoto(file, type)
      await refreshUser()
    } catch (err) {
      const apiErr = handleApiError(err)
      setSaveError(apiErr.message)
    } finally {
      setUploadingPhoto(null)
      if (type === "profile" && profileInputRef.current) profileInputRef.current.value = ""
      if (type === "cover" && coverInputRef.current) coverInputRef.current.value = ""
    }
  }

  const handlePhotoDelete = async (type: "profile" | "cover") => {
    if (!confirm(`Remove ${type === "profile" ? "profile" : "cover"} picture?`)) return
    try {
      await deleteProfilePhoto(type)
      await refreshUser()
    } catch (err) {
      const apiErr = handleApiError(err)
      setSaveError(apiErr.message)
    }
  }

  if (!initialized) return null
  if (!user) return null

  const displayName = user.displayName || user.name
  const username = user.username ? `@${user.username}` : `@${user.email?.split('@')[0] || 'user'}`

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await updateMe({
        full_name: editName,
        bio: editBio || undefined,
        municipality: "Kathmandu",
        ward_number: editWard ? Number(editWard) : undefined,
      })
      await refreshUser()
      setShowEdit(false)
    } catch (err) {
      const apiErr = handleApiError(err)
      setSaveError(apiErr.message)
    } finally {
      setSaving(false)
    }
  }

  const P = (label: string, children: React.ReactNode) => (
    <div className="pv-fg"><label>{label}</label>{children}</div>
  )
  const T = (value: boolean, onChange: (v: boolean) => void) => (
    <label className="pv-check-label">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="pv-check-slider"></span>
    </label>
  )
  const RO = (label: string, value: string | number) => (
    <div className="pv-fg"><label>{label}</label><div className="pv-ro-value">{value}</div></div>
  )

  return (
    <div id="profileView" style={{ display: 'block' }}>
      <div className="pv-inner">
        <div className="pv-cover" style={{
          ...(user.coverURL ? { backgroundImage: `url(${user.coverURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
          cursor: user.coverURL ? 'pointer' : undefined,
        }} onClick={() => { if (user.coverURL) setPreviewImage(user.coverURL) }}>
          {user.coverURL && <button className="pv-cover-btn" onClick={(e) => { e.stopPropagation(); setPreviewImage(user.coverURL ?? null) }}>View Cover</button>}
        </div>
        <div className="pv-card">
          <div className="pv-card-top">
            <div className="pv-avatar" onClick={() => { if (user.photoURL) setPreviewImage(user.photoURL) }}
              style={{ cursor: user.photoURL ? 'pointer' : 'default', overflow: 'hidden' }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PersonIcon />}
            </div>
            <div className="pv-user-info">
              <h1>{displayName}</h1>
              <div className="pv-username">{username}</div>
              <div className="pv-badges">
                {user.is_verified && <span className="pv-badge">Verified</span>}
                {user.municipality && <span className="pv-badge">{user.municipality}{user.ward_number ? ` Ward ${user.ward_number}` : ''}</span>}
              </div>
              {user.bio && <p className="pv-bio">{user.bio}</p>}
              <div className="pv-actions">
                <button className="pv-btn pv-btn-primary" onClick={() => setShowEdit(true)}>Edit Profile</button>
              </div>
            </div>
          </div>
          <div className="pv-stats">
            <div className="pv-stat"><h2>{stats.total}</h2><p>Total Reports</p></div>
            <div className="pv-stat"><h2>{stats.resolved}</h2><p>Resolved</p></div>
            <div className="pv-stat"><h2>{user.reputation_points ?? 0}</h2><p>Points</p></div>
            <div className="pv-stat"><h2>{stats.open + stats.in_review}</h2><p>Active</p></div>
          </div>
        </div>
        <div className="pv-main">
          <aside className="pv-sidebar">
            <div className="pv-side-card">
              <h3>Status Summary</h3>
              <div style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.8 }}>
                <div>Open: {stats.open}</div>
                <div>In Review: {stats.in_review}</div>
                <div>Resolved: {stats.resolved}</div>
                <div>Rejected: {stats.rejected}</div>
              </div>
            </div>
            <div className="pv-side-card">
              <h3>Account Info</h3>
              <div style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.8 }}>
                <div>Email: {user.email}</div>
                <div>Role: {user.role}</div>
                {user.created_at && <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>}
              </div>
            </div>
          </aside>
          <section className="pv-content">
            <div className="pv-tabs">
              <button className={"pv-tab active"} onClick={() => setActiveTab("reports")}>
                Reports ({stats.total})
              </button>
            </div>
            <MyReports onStatsChange={setStats} />
          </section>
        </div>
      </div>

      {previewImage && (
        <div className="pv-modal-overlay" style={{ display: 'flex', zIndex: 2000 }} onClick={() => setPreviewImage(null)}>
          <div className="pv-modal-box" style={{ maxWidth: '90vw', maxHeight: '90vh', padding: 0, overflow: 'hidden', background: 'transparent', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button className="pv-modal-close" onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2001, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#x2715;</button>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        </div>
      )}

      {showEdit && (
        <div className="pv-modal-overlay" style={{ display: 'flex' }}>
          <div className="pv-modal-box pv-modal-wide">
            <div className="pv-modal-header">
              <h2>Settings</h2>
              <button className="pv-modal-close" onClick={() => setShowEdit(false)}>&#x2715;</button>
            </div>
            <div className="pv-settings-layout">
              <nav className="pv-settings-nav">
                {settingTabs.map((s) => (
                  <button key={s.key} className={"pv-settings-nav-btn" + (activeSetting === s.key ? " active" : "")} onClick={() => setActiveSetting(s.key)}>
                    {s.label}
                  </button>
                ))}
              </nav>
              <div className="pv-settings-content">

                {activeSetting === "profile" && (
                  <div className="pv-setting-pane active">
                    <p className="pv-pane-desc">Update your public profile information.</p>

                    <div className="pv-photo-section">
                      <label className="pv-photo-label">Profile Picture</label>
                      <div className="pv-photo-row">
                        <div className="pv-photo-thumb">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" />
                          ) : (
                            <PersonIcon />
                          )}
                        </div>
                        <div className="pv-photo-actions">
                          <input ref={profileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, "profile")} />
                          <button className="pv-btn pv-btn-secondary" onClick={() => profileInputRef.current?.click()} disabled={uploadingPhoto === "profile"}>
                            {uploadingPhoto === "profile" ? "Uploading..." : "Upload"}
                          </button>
                          {user.photoURL && (
                            <button className="pv-btn pv-btn-danger" onClick={() => handlePhotoDelete("profile")}>Remove</button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pv-photo-section">
                      <label className="pv-photo-label">Cover Photo</label>
                      <div className="pv-photo-row">
                        <div className="pv-photo-thumb pv-photo-thumb-cover" style={user.coverURL ? { backgroundImage: `url(${user.coverURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                          {!user.coverURL && <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>No cover</span>}
                        </div>
                        <div className="pv-photo-actions">
                          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, "cover")} />
                          <button className="pv-btn pv-btn-secondary" onClick={() => coverInputRef.current?.click()} disabled={uploadingPhoto === "cover"}>
                            {uploadingPhoto === "cover" ? "Uploading..." : "Upload"}
                          </button>
                          {user.coverURL && (
                            <button className="pv-btn pv-btn-danger" onClick={() => handlePhotoDelete("cover")}>Remove</button>
                          )}
                        </div>
                      </div>
                    </div>

                    {P("Display Name", <input value={editName} onChange={(e) => setEditName(e.target.value)} />)}
                    {P("Bio", <textarea rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about yourself..." />)}
                    {RO("Municipality", "Kathmandu")}
                    {P("Ward Number", <input type="number" value={editWard} onChange={(e) => setEditWard(e.target.value)} placeholder="e.g. 5" />)}
                    {saveError && <div style={{ color: '#EF4444', fontSize: 14, marginTop: 8 }}>{saveError}</div>}
                  </div>
                )}

                {activeSetting === "account" && (
                  <div className="pv-setting-pane active">
                    <p className="pv-pane-desc">Manage your account settings.</p>

                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 15, color: 'var(--color-text)' }}>Username</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          value={usernameInput}
                          onChange={(e) => { setUsernameInput(e.target.value); setUsernameAvailable(null) }}
                          placeholder="Choose a username"
                          style={{ flex: 1, minWidth: 160 }}
                        />
                        <button
                          className="pv-btn pv-btn-secondary"
                          onClick={async () => {
                            if (!usernameInput.trim()) return
                            setUsernameChecking(true)
                            setUsernameAvailable(null)
                            try {
                              const res = await checkUsername(usernameInput.trim())
                              setUsernameAvailable(res.available)
                            } catch {
                              setUsernameAvailable(false)
                            } finally {
                              setUsernameChecking(false)
                            }
                          }}
                          disabled={usernameChecking || !usernameInput.trim()}
                          style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                        >
                          {usernameChecking ? "Checking..." : "Check Availability"}
                        </button>
                        <button
                          className="pv-btn pv-btn-primary"
                          onClick={async () => {
                            if (!usernameInput.trim() || !usernameAvailable) return
                            setUsernameSaving(true)
                            try {
                              await updateUsername(usernameInput.trim())
                              await refreshUser()
                              setUsernameAvailable(null)
                            } catch (err) {
                              const { handleApiError } = await import("@/lib/api/error-handler")
                              const apiErr = handleApiError(err)
                              setSaveError(apiErr.message)
                            } finally {
                              setUsernameSaving(false)
                            }
                          }}
                          disabled={usernameSaving || !usernameAvailable}
                          style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                        >
                          {usernameSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                      {usernameAvailable === true && (
                        <div style={{ color: '#059669', fontSize: 13, marginTop: 6 }}>Username is available!</div>
                      )}
                      {usernameAvailable === false && (
                        <div style={{ color: '#DC2626', fontSize: 13, marginTop: 6 }}>Username is already taken.</div>
                      )}
                      <div style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>
                        Current: {user.username ? `@${user.username}` : "Not set"}
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 15, color: 'var(--color-text)' }}>Email Addresses</h4>
                      {emailError && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{emailError}</div>}
                      {emailsLoading ? (
                        <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>Loading emails...</div>
                      ) : emails ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ flex: 1, fontSize: 14 }}>{emails.primary}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#DBEAFE', color: '#1D4ED8', fontWeight: 600 }}>Primary</span>
                          </div>
                          {emails.extra.map((e) => (
                            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                              <span style={{ flex: 1, fontSize: 14 }}>{e.email}</span>
                              {removeEmailTarget === e.email ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    value={removeEmailCode}
                                    onChange={(e) => setRemoveEmailCode(e.target.value)}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                    style={{ width: 90, fontSize: 12 }}
                                  />
                                  <button
                                    className="pv-btn pv-btn-danger"
                                    onClick={async () => {
                                      if (!removeEmailCode) return
                                      setRemoveEmailLoading(true)
                                      setRemoveEmailError(null)
                                      try {
                                        await confirmRemoveEmail(e.email, removeEmailCode)
                                        setRemoveEmailTarget(null)
                                        setRemoveEmailCode("")
                                        loadEmails()
                                      } catch (err) {
                                        const { handleApiError } = await import("@/lib/api/error-handler")
                                        const apiErr = handleApiError(err)
                                        setRemoveEmailError(apiErr.message)
                                      } finally {
                                        setRemoveEmailLoading(false)
                                      }
                                    }}
                                    disabled={removeEmailLoading}
                                    style={{ fontSize: 11, padding: '4px 8px' }}
                                  >
                                    {removeEmailLoading ? "Removing..." : "Confirm"}
                                  </button>
                                  <button
                                    className="pv-btn pv-btn-secondary"
                                    onClick={() => { setRemoveEmailTarget(null); setRemoveEmailCode(""); setRemoveEmailError(null) }}
                                    style={{ fontSize: 11, padding: '4px 8px' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="pv-btn pv-btn-danger"
                                  onClick={async () => {
                                    setRemoveEmailTarget(e.email)
                                    setRemoveEmailCode("")
                                    setRemoveEmailError(null)
                                    try {
                                      await requestRemoveEmail(e.email)
                                    } catch (err) {
                                      const { handleApiError } = await import("@/lib/api/error-handler")
                                      const apiErr = handleApiError(err)
                                      setRemoveEmailError(apiErr.message)
                                      setRemoveEmailTarget(null)
                                    }
                                  }}
                                  style={{ fontSize: 11, padding: '4px 8px' }}
                                >
                                  Remove
                                </button>
                              )}
                              {removeEmailError && removeEmailTarget === e.email && (
                                <div style={{ color: '#DC2626', fontSize: 12 }}>{removeEmailError}</div>
                              )}
                            </div>
                          ))}
                          {addEmailStep === "input" ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <input
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Add another email"
                                style={{ flex: 1 }}
                              />
                              <button
                                className="pv-btn pv-btn-primary"
                                onClick={async () => {
                                  if (!newEmail.trim()) return
                                  setAddEmailLoading(true)
                                  setAddEmailError(null)
                                  try {
                                    await requestAddEmail(newEmail.trim())
                                    setAddEmailStep("verify")
                                  } catch (err) {
                                    const { handleApiError } = await import("@/lib/api/error-handler")
                                    const apiErr = handleApiError(err)
                                    setAddEmailError(apiErr.message)
                                  } finally {
                                    setAddEmailLoading(false)
                                  }
                                }}
                                disabled={addEmailLoading || !newEmail.trim()}
                                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                              >
                                {addEmailLoading ? "Sending..." : "Send Code"}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Code sent to your email.</span>
                              <input
                                value={addEmailCode}
                                onChange={(e) => setAddEmailCode(e.target.value)}
                                placeholder="6-digit code"
                                maxLength={6}
                                style={{ width: 90, fontSize: 12 }}
                              />
                              <button
                                className="pv-btn pv-btn-primary"
                                onClick={async () => {
                                  if (!addEmailCode) return
                                  setAddEmailLoading(true)
                                  setAddEmailError(null)
                                  try {
                                    await verifyAddEmail(newEmail.trim(), addEmailCode)
                                    setNewEmail("")
                                    setAddEmailCode("")
                                    setAddEmailStep("input")
                                    loadEmails()
                                  } catch (err) {
                                    const { handleApiError } = await import("@/lib/api/error-handler")
                                    const apiErr = handleApiError(err)
                                    setAddEmailError(apiErr.message)
                                  } finally {
                                    setAddEmailLoading(false)
                                  }
                                }}
                                disabled={addEmailLoading || !addEmailCode}
                                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                              >
                                {addEmailLoading ? "Verifying..." : "Verify"}
                              </button>
                              <button
                                className="pv-btn pv-btn-secondary"
                                onClick={() => { setAddEmailStep("input"); setAddEmailCode(""); setAddEmailError(null) }}
                                style={{ fontSize: 11, padding: '4px 8px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          {addEmailError && <div style={{ color: '#DC2626', fontSize: 12 }}>{addEmailError}</div>}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 15, color: '#DC2626' }}>Danger Zone</h4>
                      <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 12px' }}>
                        Once you delete your account, you will have 7 days to cancel. After that, your account and data will be permanently removed.
                      </p>
                      <button
                        className="pv-btn pv-btn-danger"
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{ fontWeight: 600 }}
                      >
                        Delete My Account
                      </button>
                    </div>
                    {saveError && <div style={{ color: '#EF4444', fontSize: 14, marginTop: 8 }}>{saveError}</div>}
                  </div>
                )}

                {activeSetting === "notifications" && (
                  <div className="pv-setting-pane active">
                    <p className="pv-pane-desc">Notification preferences coming soon. These settings will be available in a future update.</p>
                  </div>
                )}

                {activeSetting === "accessibility" && (
                  <div className="pv-setting-pane active">
                    <p className="pv-pane-desc">Accessibility settings coming soon.</p>
                  </div>
                )}

                {activeSetting === "community" && (
                  <div className="pv-setting-pane active">
                    <p className="pv-pane-desc">Community preferences coming soon.</p>
                  </div>
                )}

                {activeSetting === "data" && (
                  <div className="pv-setting-pane active">
                    <p className="pv-pane-desc">Data management coming soon.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                      <button className="pv-btn pv-btn-secondary" style={{ fontSize: 13 }} onClick={() => alert("Data export will be available soon.")}>Download My Data</button>
                    </div>
                  </div>
                )}

              </div>
            </div>
            {activeSetting !== "account" && (
              <div className="pv-modal-actions">
                <button className="pv-btn pv-btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
                <button className="pv-btn pv-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="pv-modal-overlay" style={{ display: 'flex' }} onClick={() => { if (!deletingAccount) resetDelete() }}>
          <div className="pv-modal-box" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="pv-modal-header">
              <h2 style={{ color: '#DC2626' }}>Delete Account</h2>
              <button className="pv-modal-close" onClick={resetDelete} disabled={deletingAccount}>&#x2715;</button>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {deleteStep === "confirm" ? (
                <>
                    <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Your account will be scheduled for deletion. You have 7 days to cancel by logging in and visiting your profile settings. After 7 days, your account and all associated data will be permanently deleted.
                    </p>
                  <p style={{ fontSize: 14, color: 'var(--color-text)', margin: '0 0 8px', fontWeight: 600 }}>
                    A 6-digit verification code will be sent to your phone to confirm.
                  </p>
                  <button
                    className="pv-btn pv-btn-danger"
                    onClick={async () => {
                      setDeletingAccount(true)
                      setDeleteError(null)
                      try {
                        await deleteAccount()
                        setDeleteStep("code")
                      } catch (err) {
                        const { handleApiError } = await import("@/lib/api/error-handler")
                        const apiErr = handleApiError(err)
                        setDeleteError(apiErr.message)
                      } finally {
                        setDeletingAccount(false)
                      }
                    }}
                    disabled={deletingAccount}
                    style={{ fontWeight: 600, marginTop: 8 }}
                  >
                    {deletingAccount ? 'Sending...' : 'Send Code'}
                  </button>
                  {deleteError && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{deleteError}</div>}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    A verification code has been sent to your phone. Enter it below to confirm account deletion.
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--color-text)', margin: '0 0 8px', fontWeight: 600 }}>
                    Enter 6-digit code
                  </p>
                  <input
                    value={deleteCode}
                    onChange={(e) => setDeleteCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    disabled={deletingAccount}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                  {deleteError && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{deleteError}</div>}
                </>
              )}
            </div>
            <div className="pv-modal-actions">
              <button className="pv-btn pv-btn-secondary" onClick={resetDelete} disabled={deletingAccount}>Cancel</button>
              {deleteStep === "code" && (
                <button
                  className="pv-btn pv-btn-danger"
                  onClick={async () => {
                    if (!deleteCode) return
                    setDeletingAccount(true)
                    setDeleteError(null)
                    try {
                      await confirmDeleteAccount(deleteCode)
                      resetDelete()
                      setShowEdit(false)
                      await logout()
                    } catch (err) {
                      const { handleApiError } = await import("@/lib/api/error-handler")
                      const apiErr = handleApiError(err)
                      setDeleteError(apiErr.message)
                    } finally {
                      setDeletingAccount(false)
                    }
                  }}
                  disabled={!deleteCode || deletingAccount}
                  style={{ fontWeight: 600 }}
                >
                  {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
