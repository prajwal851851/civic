"use client"

import { use, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getReport, updateReportStatus, addProgressNote } from "@/lib/api/reports"
import { handleApiError } from "@/lib/api/error-handler"

interface ReportData {
  id: number
  title: string
  description: string
  category: string
  latitude: string
  longitude: string
  municipality: string
  ward_number: number | null
  address: string
  status: string
  created_at: string
  updated_at: string
  progress_notes: string
  citizen_name?: string
  citizen_profile_picture?: string | null
  images?: { id: number; image: string; uploaded_at: string }[]
  videos?: { id: number; video: string; uploaded_at: string }[]
  total_upvotes?: number
  total_comments?: number
}

const STATUS_OPTIONS = ["open", "in_review", "resolved", "rejected"]

const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_review: "In Review", resolved: "Resolved", rejected: "Rejected",
}

const STATUS_CLASSES: Record<string, string> = {
  open: "sv-status-open", in_review: "sv-status-progress", resolved: "sv-status-resolved", rejected: "sv-status-rejected",
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
  } catch { return ts }
}

function parseProgressNotes(text: string): { timestamp: string; note: string }[] {
  if (!text) return []
  const lines = text.split("\n").filter(Boolean)
  const entries: { timestamp: string; note: string }[] = []
  for (const line of lines) {
    const match = line.match(/^\[(.*?)\]\s*(.*)/)
    if (match) {
      entries.push({ timestamp: match[1], note: match[2] })
    } else {
      if (entries.length) entries[entries.length - 1].note += "\n" + line
      else entries.push({ timestamp: "", note: line })
    }
  }
  return entries
}

export default function OfficialIssueDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const reportId = Number(id)

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newStatus, setNewStatus] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusToast, setStatusToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [noteText, setNoteText] = useState("")
  const [addingNote, setAddingNote] = useState(false)
  const [noteToast, setNoteToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getReport(reportId) as ReportData
      setReport(data)
      setNewStatus(data.status)
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => { fetchReport() }, [fetchReport])

  const handleStatusUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!report || newStatus === report.status) return
    setUpdatingStatus(true)
    setStatusToast(null)
    try {
      const updated = await updateReportStatus(reportId, newStatus) as ReportData
      setReport(updated)
      setStatusToast({ type: "success", message: `Status changed to "${STATUS_LABELS[newStatus]}"` })
    } catch (err) {
      const apiErr = handleApiError(err)
      const msg = apiErr.errors ? Object.values(apiErr.errors).flat().join(" ") : apiErr.message
      setStatusToast({ type: "error", message: msg })
      setNewStatus(report.status)
    } finally {
      setUpdatingStatus(false)
    }
  }, [report, newStatus, reportId])

  const handleAddNote = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setAddingNote(true)
    setNoteToast(null)
    try {
      const updated = await addProgressNote(reportId, noteText.trim()) as ReportData
      setReport(updated)
      setNoteText("")
      setNoteToast({ type: "success", message: "Progress note added" })
    } catch (err) {
      const apiErr = handleApiError(err)
      const msg = apiErr.errors ? Object.values(apiErr.errors).flat().join(" ") : apiErr.message
      setNoteToast({ type: "error", message: msg })
    } finally {
      setAddingNote(false)
    }
  }, [noteText, reportId])

  if (loading) {
    return (
      <div className="sv-inner" style={{ maxWidth: 880 }}>
        <p style={{ marginBottom: 20 }}>
          <Link href="/official-dashboard" style={{ color: "var(--color-primary)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>&larr; Back to Dashboard</Link>
        </p>
        <div className="skeleton-line skeleton-line--medium" style={{ height: 28, width: "40%", marginBottom: 20 }} />
        <div className="sv-form-section">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-line" style={{ marginBottom: 12 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sv-inner" style={{ maxWidth: 880 }}>
        <p style={{ marginBottom: 20 }}>
          <Link href="/official-dashboard" style={{ color: "var(--color-primary)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>&larr; Back to Dashboard</Link>
        </p>
        <div className="sv-toast sv-toast-error">
          {error}
          <button className="pv-btn pv-btn-secondary" style={{ marginLeft: 12, fontSize: 12, padding: "4px 12px" }} onClick={fetchReport}>Retry</button>
        </div>
      </div>
    )
  }

  if (!report) return null

  const progressEntries = parseProgressNotes(report.progress_notes)
  const images = report.images ?? []
  const videos = report.videos ?? []
  const hasMedia = images.length > 0 || videos.length > 0

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <p style={{ marginBottom: 20 }}>
        <Link href="/official-dashboard" style={{ color: "var(--color-primary)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>&larr; Back to Dashboard</Link>
      </p>
      <h1 className="sv-section-title">Issue Details</h1>

      <section className="sv-form-section">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>
          {report.title}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14, marginBottom: 20 }}>
          <div><strong>Citizen:</strong> {report.citizen_name || "—"}</div>
          <div><strong>Date:</strong> {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
          <div>
            <strong>Status:</strong>{" "}
            <span className={"sv-status-badge " + (STATUS_CLASSES[report.status] || "sv-status-open")}>
              {STATUS_LABELS[report.status] || report.status}
            </span>
          </div>
          <div><strong>Category:</strong> {report.category.replace(/_/g, " ")}</div>
          <div><strong>Ward:</strong> {report.ward_number ? `Ward ${report.ward_number}` : "—"}</div>
          <div><strong>Municipality:</strong> {report.municipality || "—"}</div>
        </div>

        {report.description && (
          <div style={{ marginTop: 16 }}>
            <strong>Description:</strong>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text)", margin: "8px 0 0" }}>{report.description}</p>
          </div>
        )}

        {hasMedia && (
          <div style={{ marginTop: 24 }}>
            <strong style={{ display: "block", marginBottom: 10 }}>Media ({images.length + videos.length})</strong>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setPreviewImage(img.image)}
                  style={{ width: 180, height: 130, borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer", border: "1px solid var(--color-border)", flexShrink: 0, position: "relative" }}
                >
                  <img src={img.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  style={{ width: 180, height: 130, borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer", border: "1px solid var(--color-border)", flexShrink: 0, position: "relative" }}
                >
                  <video src={vid.video} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {previewImage && (
        <div className="pv-modal-overlay" style={{ display: "flex", zIndex: 2000 }} onClick={() => setPreviewImage(null)}>
          <div className="pv-modal-box" style={{ maxWidth: "90vw", maxHeight: "90vh", padding: 0, overflow: "hidden", background: "transparent", boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
            <button className="pv-modal-close" onClick={() => setPreviewImage(null)} style={{ position: "absolute", top: 12, right: 12, zIndex: 2001, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&#x2715;</button>
            <img src={previewImage} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
          </div>
        </div>
      )}

      <section className="sv-form-section">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Update Status</h2>
        {statusToast && (
          <div className={"sv-toast " + (statusToast.type === "success" ? "sv-toast-success" : "sv-toast-error")}>
            {statusToast.message}
          </div>
        )}
        <form onSubmit={handleStatusUpdate}>
          <div className="sv-fg">
            <label htmlFor="offStatus">Status</label>
            <select
              id="offStatus"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", fontSize: 15, fontFamily: "var(--font-body)", background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={updatingStatus || newStatus === report.status}
            style={{ marginTop: 16, padding: "12px 28px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-lg)", fontSize: 16, fontWeight: 600, cursor: updatingStatus || newStatus === report.status ? "default" : "pointer", opacity: updatingStatus || newStatus === report.status ? 0.6 : 1 }}
          >
            {updatingStatus ? "Updating..." : "Update Status"}
          </button>
        </form>
      </section>

      <section className="sv-form-section">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Progress Notes</h2>
        {noteToast && (
          <div className={"sv-toast " + (noteToast.type === "success" ? "sv-toast-success" : "sv-toast-error")}>
            {noteToast.message}
          </div>
        )}
        <form onSubmit={handleAddNote} style={{ marginBottom: 20 }}>
          <div className="sv-fg">
            <label htmlFor="offNote">Add a progress note</label>
            <textarea
              id="offNote"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="Describe the progress made..."
              style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", fontSize: 15, fontFamily: "var(--font-body)", resize: "vertical", background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }}
            />
          </div>
          <button
            type="submit"
            disabled={addingNote || !noteText.trim()}
            style={{ marginTop: 12, padding: "10px 24px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-lg)", fontSize: 15, fontWeight: 600, cursor: addingNote || !noteText.trim() ? "default" : "pointer", opacity: addingNote || !noteText.trim() ? 0.6 : 1 }}
          >
            {addingNote ? "Adding..." : "Add Note"}
          </button>
        </form>

        {progressEntries.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--color-muted)" }}>No progress notes yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...progressEntries].reverse().map((entry, i) => (
              <div key={i} style={{ padding: "12px 16px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", fontSize: 14, border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 4 }}>
                  {formatTimestamp(entry.timestamp)}
                </div>
                <div style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.note}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
