"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getFeed } from "@/lib/api/reports"
import type { FeedReport } from "@/lib/api/reports"

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
  const [issues, setIssues] = useState<FeedReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      try {
        const result = await getFeed({ page_size: 100 })
        if (!cancelled) setIssues(result.results ?? [])
      } catch {
        // ignore
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

      <section className="sv-form-section">
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Ward</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)', fontSize: 14 }}>Loading issues...</td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)', fontSize: 14 }}>No issues found.</td></tr>
              ) : (
                issues.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>Ward {r.ward_number}</td>
                    <td>{r.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                    <td>{r.address || r.municipality}</td>
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
