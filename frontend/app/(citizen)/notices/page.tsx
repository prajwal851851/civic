'use client'

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getNotices } from "@/lib/api/notices"
import { handleApiError } from "@/lib/api/error-handler"

interface NoticeItem {
  id: number
  title: string
  content: string
  municipality: string
  ward_number: number | null
  is_pinned: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
  created_by_name: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function SkeletonCard() {
  return (
    <div className="notice-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
      <div className="skeleton-line skeleton-line--medium" style={{ marginBottom: 8 }} />
      <div className="skeleton-line skeleton-line--xs" style={{ marginBottom: 6 }} />
      <div className="skeleton-line" />
    </div>
  )
}

export default function NoticesPage() {
  const router = useRouter()
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [municipality, setMunicipality] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const fetchNotices = useCallback(async (p: number, q: string, m: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNotices({ page: p, search: q || undefined, municipality: m || undefined }) as PaginatedResponse<NoticeItem>
      setNotices(data.results || [])
      setTotalPages(Math.ceil((data.count || 0) / 20))
    } catch (err) {
      const apiErr = handleApiError(err)
      setError(apiErr.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotices(page, search, municipality)
  }, [page, fetchNotices])

  const handleSearch = () => {
    setPage(1)
    fetchNotices(1, search, municipality)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="page-wrapper">
      <h1>Official Notices</h1>
      <p className="subtitle">Latest announcements and updates from municipality ward offices.</p>

      <div className="notice-search">
        <input
          type="text"
          placeholder="Search notices by keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {municipality && (
          <button
            className="pv-btn pv-btn-secondary"
            style={{ fontSize: 13, padding: '8px 14px', whiteSpace: 'nowrap' }}
            onClick={() => { setMunicipality(""); setPage(1); fetchNotices(1, search, "") }}
          >
            {municipality} &times;
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>
          <p>{error}</p>
          <button className="pv-btn pv-btn-secondary" style={{ marginTop: 12 }} onClick={() => fetchNotices(page, search, municipality)}>Retry</button>
        </div>
      )}

      {loading && !error && (
        <div>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && notices.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 40 }}>
          {search || municipality ? 'No notices match your search.' : 'No notices published yet.'}
        </p>
      )}

      {!loading && !error && notices.length > 0 && (
        <>
          {notices.map(n => {
            const isExpanded = expanded.has(n.id)
            return (
              <div
                key={n.id}
                className={"notice-card" + (isExpanded ? " expanded" : "") + (n.is_pinned ? " notice-pinned" : "")}
                onClick={() => toggleExpand(n.id)}
              >
                <h2>{n.is_pinned && <span className="notice-pin-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg> </span>}{n.title}</h2>
                <div className="notice-meta">
                  {n.municipality}{n.ward_number ? `, Ward ${n.ward_number}` : ''} &middot; Posted {formatDate(n.created_at)}
                </div>
                <div className={isExpanded ? "" : "notice-excerpt"}>
                  <p>{n.content}</p>
                </div>
                <span className="notice-toggle">
                  {isExpanded ? "Show less" : "Read more"}
                </span>
              </div>
            )
          })}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                &laquo; Previous
              </button>
              <span className="pagination-info">Page {page} of {totalPages}</span>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
