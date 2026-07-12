"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSummary, getAnalytics, getRecentReports } from "@/lib/api/dashboard"
import { handleApiError } from "@/lib/api/error-handler"
import type { DashboardFilters } from "@/lib/api/dashboard"

interface SummaryData {
  total_reports: number
  open_reports: number
  in_review_reports: number
  resolved_reports: number
  pending_ai_reports: number
  reports_today: number
  reports_this_week: number
  reports_this_month: number
  total_notices: number
  total_citizens: number
}

interface AnalyticsData {
  by_category: { category: string; count: number }[]
  by_status: { status: string; count: number }[]
  by_municipality: { municipality: string; count: number }[]
  by_ward: { ward_number: number | null; count: number }[]
}

interface RecentReport {
  id: number
  title: string
  category: string
  status: string
  municipality: string
  ward_number: number | null
  citizen_name: string
  visibility?: boolean
  created_at: string
}

const STATUS_FILL_COLORS: Record<string, string> = {
  open: "#DC2626",
  in_review: "#D97706",
  resolved: "#059669",
  rejected: "#6B7280",
}

const CATEGORY_PALETTE = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1",
]

function SkeletonPrimary() {
  return (
    <div className="od-primary-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="od-primary-card" style={{ padding: "22px 24px" }}>
          <div className="skeleton-line skeleton-line--xs" style={{ width: "50%", marginBottom: 8 }} />
          <div className="skeleton-line skeleton-line--short" style={{ height: 30, marginBottom: 4 }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonSecondary() {
  return (
    <div className="od-secondary-row">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="od-secondary-item">
          <div className="skeleton-line skeleton-line--short" style={{ height: 22, width: "50%" }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonAnalytics() {
  return (
    <div className="od-analytics-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton-line skeleton-line--short" style={{ height: 14, width: "60%", marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div className="skeleton-line skeleton-line--xs" style={{ width: 70, flexShrink: 0 }} />
              <div className="skeleton-line" style={{ height: 22, flex: 1 }} />
              <div className="skeleton-line skeleton-line--xs" style={{ width: 30 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonTable() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
          <div className="skeleton-line skeleton-line--medium" style={{ flex: 2 }} />
          <div className="skeleton-line skeleton-line--xs" style={{ flex: 1 }} />
          <div className="skeleton-line skeleton-line--xs" style={{ flex: 1 }} />
          <div className="skeleton-line skeleton-line--xs" style={{ flex: 1 }} />
        </div>
      ))}
    </div>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function OfficialDashboardPage() {
  const router = useRouter()

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [reports, setReports] = useState<RecentReport[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)

  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [reportsError, setReportsError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = 20
  const [filterStatus, setFilterStatus] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterWard, setFilterWard] = useState("")

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true)
    setSummaryError(null)
    try {
      const data = await getSummary() as SummaryData
      setSummary(data)
    } catch (err) {
      setSummaryError(handleApiError(err).message)
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true)
    setAnalyticsError(null)
    try {
      const data = await getAnalytics() as AnalyticsData
      setAnalytics(data)
    } catch (err) {
      setAnalyticsError(handleApiError(err).message)
    } finally {
      setLoadingAnalytics(false)
    }
  }, [])

  const fetchReports = useCallback(async (p: number) => {
    setLoadingReports(true)
    setReportsError(null)
    const filters: DashboardFilters = { page: p }
    if (filterStatus) filters.status = filterStatus
    if (filterCategory) filters.category = filterCategory
    if (filterWard) filters.ward = Number(filterWard)
    try {
      const data = await getRecentReports(filters) as { count: number; results: RecentReport[] }
      setReports(data.results ?? [])
      setTotalCount(data.count ?? 0)
    } catch (err) {
      setReportsError(handleApiError(err).message)
    } finally {
      setLoadingReports(false)
    }
  }, [filterStatus, filterCategory, filterWard])

  useEffect(() => { fetchSummary() }, [fetchSummary])
  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
  useEffect(() => { fetchReports(page) }, [page, fetchReports])

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleFilterChange = () => {
    setPage(1)
    fetchReports(1)
  }

  const statusClass = (s: string) => {
    switch (s) {
      case "open": return "sv-status-open"
      case "in_review": return "sv-status-progress"
      case "resolved": return "sv-status-resolved"
      case "rejected": return "sv-status-rejected"
      default: return ""
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case "open": return "Open"
      case "in_review": return "In Review"
      case "resolved": return "Resolved"
      case "rejected": return "Rejected"
      default: return s
    }
  }

  const maxCategory = analytics?.by_category.length
    ? Math.max(...analytics.by_category.map(c => c.count), 1) : 1
  const maxStatus = analytics?.by_status.length
    ? Math.max(...analytics.by_status.map(s => s.count), 1) : 1
  const maxWard = analytics?.by_ward.length
    ? Math.max(...analytics.by_ward.map(w => w.count), 1) : 1

  return (
    <div className="sv-inner" style={{ maxWidth: 960 }}>
      <div className="od-header">
        <h1>Dashboard</h1>
        <span className="od-header-meta">
          Updated {formatDate(new Date())}
        </span>
      </div>

      {summaryError && (
        <div className="sv-toast sv-toast-error" style={{ marginBottom: 20 }}>
          {summaryError}
          <button
            className="pv-btn pv-btn-secondary"
            style={{ marginLeft: 12, fontSize: 12, padding: "4px 12px" }}
            onClick={fetchSummary}
          >
            Retry
          </button>
        </div>
      )}

      {loadingSummary ? (
        <>
          <SkeletonPrimary />
          <SkeletonSecondary />
        </>
      ) : summary && (
        <>
          <div className="od-primary-grid">
            <div className="od-primary-card od-primary-card--total">
              <div className="od-primary-value">{summary.total_reports}</div>
              <div className="od-primary-label">Total Reports</div>
            </div>
            <div className="od-primary-card od-primary-card--open">
              <div className="od-primary-value">{summary.open_reports}</div>
              <div className="od-primary-label">Open</div>
            </div>
            <div className="od-primary-card od-primary-card--review">
              <div className="od-primary-value">{summary.in_review_reports}</div>
              <div className="od-primary-label">In Review</div>
            </div>
            <div className="od-primary-card od-primary-card--resolved">
              <div className="od-primary-value">{summary.resolved_reports}</div>
              <div className="od-primary-label">Resolved</div>
            </div>
          </div>

          <div className="od-secondary-row">
            <div className="od-secondary-item">
              <div className="od-secondary-value">{summary.reports_today}</div>
              <div className="od-secondary-label">Today</div>
            </div>
            <div className="od-secondary-item">
              <div className="od-secondary-value">{summary.reports_this_week}</div>
              <div className="od-secondary-label">This Week</div>
            </div>
            <div className="od-secondary-item">
              <div className="od-secondary-value">{summary.reports_this_month}</div>
              <div className="od-secondary-label">This Month</div>
            </div>
          </div>
        </>
      )}

      {analyticsError && (
        <div className="sv-toast sv-toast-error" style={{ marginBottom: 20 }}>
          {analyticsError}
          <button
            className="pv-btn pv-btn-secondary"
            style={{ marginLeft: 12, fontSize: 12, padding: "4px 12px" }}
            onClick={fetchAnalytics}
          >
            Retry
          </button>
        </div>
      )}

      <section className="od-analytics-section">
        <h2>Analytics</h2>
        {loadingAnalytics ? (
          <SkeletonAnalytics />
        ) : analytics && (
          <div className="od-analytics-grid">
            <div className="od-chart-group">
              <div className="od-chart-group-title">Status</div>
              {analytics.by_status.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No data</p>
              )}
              {analytics.by_status.map((item) => (
                <div key={item.status} className="od-bar">
                  <span className="od-bar-label">{statusLabel(item.status)}</span>
                  <div className="od-bar-track">
                    <div
                      className="od-bar-fill"
                      style={{
                        width: `${(item.count / maxStatus) * 100}%`,
                        background: STATUS_FILL_COLORS[item.status] || "#6B7280",
                      }}
                    />
                  </div>
                  <span className="od-bar-count">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="od-chart-group">
              <div className="od-chart-group-title">Category</div>
              {analytics.by_category.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No data</p>
              )}
              {analytics.by_category.map((item, i) => (
                <div key={item.category} className="od-bar">
                  <span className="od-bar-label">{item.category.replace(/_/g, " ")}</span>
                  <div className="od-bar-track">
                    <div
                      className="od-bar-fill"
                      style={{
                        width: `${(item.count / maxCategory) * 100}%`,
                        background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
                      }}
                    />
                  </div>
                  <span className="od-bar-count">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="od-chart-group">
              <div className="od-chart-group-title">Ward</div>
              {analytics.by_ward.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No data</p>
              )}
              {analytics.by_ward.map((item) => (
                <div key={String(item.ward_number)} className="od-bar">
                  <span className="od-bar-label">
                    {item.ward_number ? `Ward ${item.ward_number}` : "Unassigned"}
                  </span>
                  <div className="od-bar-track">
                    <div
                      className="od-bar-fill"
                      style={{
                        width: `${(item.count / maxWard) * 100}%`,
                        background: "#10B981",
                      }}
                    />
                  </div>
                  <span className="od-bar-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="od-reports-section">
        <h2>Recent Reports</h2>

        <div className="od-filters">
          <select
            className="od-filter-select"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); handleFilterChange() }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="od-filter-select"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); handleFilterChange() }}
          >
            <option value="">All Categories</option>
            <option value="roads">Roads</option>
            <option value="street_lights">Street Lights</option>
            <option value="garbage">Garbage</option>
            <option value="water">Water</option>
            <option value="sewage">Sewage</option>
            <option value="electricity">Electricity</option>
            <option value="parks">Parks</option>
            <option value="noise">Noise</option>
            <option value="other">Other</option>
          </select>
          <input
            className="od-filter-input"
            type="number"
            placeholder="Ward #"
            value={filterWard}
            onChange={(e) => { setFilterWard(e.target.value); handleFilterChange() }}
            min={1}
            style={{ width: 90 }}
          />
        </div>

        {reportsError && (
          <div className="sv-toast sv-toast-error" style={{ marginBottom: 16 }}>
            {reportsError}
            <button
              className="pv-btn pv-btn-secondary"
              style={{ marginLeft: 12, fontSize: 12, padding: "4px 12px" }}
              onClick={() => fetchReports(page)}
            >
              Retry
            </button>
          </div>
        )}

        {loadingReports ? (
          <SkeletonTable />
        ) : reports.length === 0 ? (
          <p className="od-empty">No reports match the current filters.</p>
        ) : (
          <>
            <div className="sv-table-wrap">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Citizen</th>
                    <th>Ward</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/official-issue-details/${r.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontWeight: 500 }}>{r.title}</td>
                      <td>{r.citizen_name}</td>
                      <td>{r.ward_number ? `Ward ${r.ward_number}` : "\u2014"}</td>
                      <td>{r.category.replace(/_/g, " ")}</td>
                      <td>
                        <span className={`sv-status-badge ${statusClass(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: 20 }}>
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="pagination-info">Page {page} of {totalPages}</span>
                <button
                  className="pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
