"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { getNotices, createNotice } from "@/lib/api/notices"
import { handleApiError } from "@/lib/api/error-handler"

interface NoticeItem {
  id: number
  title: string
  content: string
  municipality: string
  ward_number: number | null
  is_pinned: boolean
  created_at: string
  created_by_name: string
}

function formatPosted(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return "Posted today"
  if (days === 1) return "Posted yesterday"
  return `Posted ${days} days ago`
}

export default function OfficialNoticesPage() {
  const { user } = useAuth()
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [wardNumber, setWardNumber] = useState("")
  const [cityWide, setCityWide] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNotices() as { results?: NoticeItem[] } | NoticeItem[]
      const items = Array.isArray(data) ? data : (data.results ?? [])
      setNotices(items)
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  useEffect(() => {
    if (user?.ward_number && !wardNumber) {
      setWardNumber(String(user.ward_number))
    }
  }, [user, wardNumber])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = await createNotice({
        title: title.trim(),
        content: content.trim(),
        municipality: user?.municipality || "Kathmandu",
        ward_number: cityWide ? null : (wardNumber ? Number(wardNumber) : null),
        is_pinned: false,
      }) as NoticeItem
      setNotices((prev) => [created, ...prev])
      setTitle("")
      setContent("")
      setShowForm(false)
    } catch (err) {
      setSubmitError(handleApiError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="sv-section-title" style={{ margin: 0 }}>Manage Notices</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 24px",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-lg)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Notice
        </button>
      </div>

      {error && (
        <div style={{ color: "#EF4444", fontSize: 14, marginBottom: 16, padding: 12, background: "#FEE2E2", borderRadius: 8 }}>
          {error}
          <button onClick={fetchNotices} style={{ marginLeft: 12, background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Retry</button>
        </div>
      )}

      {showForm && (
        <div className="pv-modal-overlay" style={{ display: "flex" }} onClick={() => !submitting && setShowForm(false)}>
          <div className="pv-modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="pv-modal-header">
              <h2>Create New Notice</h2>
              <button className="pv-modal-close" onClick={() => setShowForm(false)} disabled={submitting}>&#x2715;</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>
                  Title <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Road maintenance near Baneshwor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }}
                />
              </div>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>
                  Content <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <textarea
                  placeholder="Describe the notice details citizens need to know..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, resize: "vertical", background: "var(--color-bg)", color: "var(--color-text)", outline: "none", fontFamily: "inherit" }}
                />
              </div>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: "block" }}>Audience</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 10, cursor: "pointer" }}>
                  <input type="radio" checked={cityWide} onChange={() => setCityWide(true)} />
                  All of Kathmandu (city-wide)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="radio" checked={!cityWide} onChange={() => setCityWide(false)} />
                  Specific ward only
                </label>
                {!cityWide && (
                  <input
                    type="number"
                    min={1}
                    max={32}
                    placeholder="Ward number"
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value)}
                    style={{ width: "100%", marginTop: 10, padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)" }}
                  />
                )}
              </div>
              {submitError && (
                <p style={{ color: "var(--color-danger)", fontSize: 13, margin: 0 }}>{submitError}</p>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="pv-btn pv-btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-primary" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <p style={{ textAlign: "center", color: "var(--color-muted)", padding: 40 }}>Loading notices...</p>}

      {!loading && (
        <div className="hm-notice-list">
          {notices.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--color-muted)", padding: 40 }}>No notices published yet.</p>
          )}
          {notices.map((n) => (
            <div key={n.id} className="hm-notice">
              <div>
                <div className="hm-notice-title">{n.title}</div>
                <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
                  {n.municipality}{n.ward_number ? `, Ward ${n.ward_number}` : " (city-wide)"}
                </div>
                <p style={{ fontSize: 14, color: "var(--color-text)", margin: "8px 0 4px", lineHeight: 1.5 }}>
                  {n.content.length > 160 ? `${n.content.slice(0, 160)}…` : n.content}
                </p>
                <div className="hm-notice-date">{formatPosted(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
