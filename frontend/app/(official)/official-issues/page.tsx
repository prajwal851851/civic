"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getRecentReports } from "@/lib/api/dashboard"

interface OfficialIssue {
  id: number
  title: string
  category: string
  status: string
  municipality: string
  ward_number: number | null
  citizen_name: string
  visibility: boolean
  created_at: string
}

const STATUS_MAP: Record<string, string> = {
  open: "Open",
  in_review: "In Progress",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
}

const statusClass = (status: string) => {
  switch (STATUS_MAP[status] || status) {
    case "Open": return "sv-status-open"
    case "In Progress": return "sv-status-progress"
    case "Resolved": return "sv-status-resolved"
    case "Rejected": return "sv-status-rejected"
    default: return ""
  }
}

export default function OfficialIssuesPage() {
  const [issues, setIssues] = useState<OfficialIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      try {
        // Official dashboard API returns ALL citizen reports (including unpublished)
        const result = await getRecentReports({ page: 1 }) as {
          results?: OfficialIssue[]
          count?: number
        }
        // Fetch up to a few pages so new submissions are not missed
        const first = result.results ?? []
        const count = result.count ?? first.length
        let all = [...first]
        const pageSize = 20
        const totalPages = Math.max(1, Math.ceil(count / pageSize))
        for (let p = 2; p <= Math.min(totalPages, 5); p++) {
          const next = await getRecentReports({ page: p }) as { results?: OfficialIssue[] }
          all = all.concat(next.results ?? [])
        }
        if (!cancelled) setIssues(all)
      } catch {
        if (!cancelled) setError("Failed to load issues.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <h1 className="sv-section-title">All Issues</h1>
      <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: -8, marginBottom: 20 }}>
        Every report submitted by citizens appears here. Use Manage to update status.
      </p>

      <section className="sv-form-section">
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Citizen</th>
                <th>Date</th>
                <th>Ward</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-muted)", fontSize: 14 }}>Loading issues...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#ef4444", fontSize: 14 }}>{error}</td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-muted)", fontSize: 14 }}>No issues found.</td></tr>
              ) : (
                issues.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.title}
                      {!r.visibility && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: "var(--color-muted)" }}>(hidden)</span>
                      )}
                    </td>
                    <td>{r.citizen_name || "—"}</td>
                    <td>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td>{r.ward_number ? `Ward ${r.ward_number}` : "—"}</td>
                    <td>{r.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</td>
                    <td>
                      <span className={`sv-status-badge ${statusClass(r.status)}`}>{STATUS_MAP[r.status] || r.status}</span>
                      <Link
                        href={`/official-issue-details/${r.id}`}
                        className="official-manage-link"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
