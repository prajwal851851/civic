"use client"

import { useEffect, useState } from "react"
import { getPendingModeration, moderateReport } from "@/lib/api/reports"
import { handleApiError } from "@/lib/api/error-handler"

interface PendingImage {
  id: number
  image: string
  uploaded_at: string
}

interface PendingVideo {
  id: number
  video: string
  uploaded_at: string
}

interface PendingReport {
  id: number
  title: string
  description: string
  category: string
  status: string
  municipality: string
  ward_number: number
  address: string
  created_at: string
  citizen_name: string
  citizen: number
  images?: PendingImage[]
  videos?: PendingVideo[]
}

export default function OfficialModerationPage() {
  const [reports, setReports] = useState<PendingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [noteError, setNoteError] = useState<string | null>(null)
  const [activeReportId, setActiveReportId] = useState<number | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPendingModeration() as { results?: PendingReport[] } | PendingReport[]
      const r = Array.isArray(data) ? data : (data.results || [])
      setReports(r)
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const resetNote = () => {
    setNote("")
    setNoteError(null)
    setActiveReportId(null)
  }

  const handleModerate = async (id: number, action: "approved" | "rejected") => {
    if (!note.trim()) {
      setNoteError("A moderation note is required.")
      return
    }
    setActionLoading(id)
    setNoteError(null)
    try {
      await moderateReport(id, action, note.trim())
      setReports(prev => prev.filter(r => r.id !== id))
      resetNote()
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <div className="mod-header">
        <div>
          <h1 className="sv-section-title" style={{ marginBottom: 4 }}>Moderation Queue</h1>
          <p className="mod-subtitle">New citizen reports awaiting your review</p>
        </div>
        <div className="mod-count-badge">
          <span className="mod-count-num">{reports.length}</span>
          <span className="mod-count-label">pending</span>
        </div>
      </div>

      {error && (
        <div style={{ color: '#EF4444', fontSize: 14, marginBottom: 16, padding: 12, background: '#FEE2E2', borderRadius: 8 }}>
          {error}
          <button onClick={fetchPending} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="mod-empty">
          <p>Loading reports...</p>
        </div>
      )}

      {!loading && reports.length === 0 && !error && (
        <div className="mod-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>All caught up! No reports pending review.</p>
        </div>
      )}

      <div className="mod-list">
        {reports.map((r) => (
          <div key={r.id} className="mod-item mod-item--flagged">
            <div className="mod-item-bar mod-item-bar--flagged" />
            <div className="mod-item-body">
              <div className="mod-item-top">
                <div className="mod-item-heading">
                  <h3 className="mod-item-title">{r.title}</h3>
                  <span className="mod-item-badge mod-item-badge--flagged">Pending</span>
                </div>
                <div className="mod-item-byline">
                  By: {r.citizen_name} &middot; {new Date(r.created_at).toLocaleDateString()} &middot; Ward {r.ward_number}
                </div>
                <div className="mod-item-reason">Category: {r.category} &middot; {r.address || r.municipality}</div>
              </div>
              <p className="mod-item-desc">{r.description}</p>

              {(r.images && r.images.length > 0) || (r.videos && r.videos.length > 0) ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {r.images?.map((img) => (
                    <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img.image}
                        alt=""
                        style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      />
                    </a>
                  ))}
                  {r.videos?.map((vid) => (
                    <video
                      key={vid.id}
                      src={vid.video}
                      controls
                      style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)' }}
                    />
                  ))}
                </div>
              ) : null}

              <div className="mod-note-section">
                {activeReportId === r.id ? (
                  <>
                    <textarea
                      className="mod-note-input"
                      placeholder="Enter a moderation note (required)..."
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value)
                        if (noteError) setNoteError(null)
                      }}
                      rows={3}
                    />
                    {noteError && <p className="mod-note-error">{noteError}</p>}
                    <div className="mod-item-actions">
                      <button
                        className="mod-btn mod-btn--approve"
                        onClick={() => handleModerate(r.id, "approved")}
                        disabled={actionLoading === r.id}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {actionLoading === r.id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        className="mod-btn mod-btn--reject"
                        onClick={() => handleModerate(r.id, "rejected")}
                        disabled={actionLoading === r.id}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        {actionLoading === r.id ? "Processing..." : "Reject"}
                      </button>
                      <button
                        className="mod-btn mod-btn--cancel"
                        onClick={resetNote}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    className="mod-btn mod-btn--review"
                    onClick={() => setActiveReportId(r.id)}
                  >
                    Review & Moderate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
