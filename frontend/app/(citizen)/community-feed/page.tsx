"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSearch } from "@/lib/search-context"
import { getFeed, upvoteReport, removeUpvote } from "@/lib/api/reports"
import type { FeedReport, FeedResponse } from "@/lib/api/reports"
import { getComments, createComment } from "@/lib/api/comments"
import OfficialPendingBanner from "@/components/OfficialPendingBanner"

interface CommentType {
  id: number
  report: number
  user: number
  author_name: string
  author_profile_picture: string | null
  parent: number | null
  content: string
  is_edited: boolean
  replies: CommentType[]
  created_at: string
  updated_at: string
}

const ICONS = {
  comment: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  upvote: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  upvoteFilled: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}

const CATEGORY_ICONS: Record<string, string> = {
  roads: "fa-road",
  street_lights: "fa-lightbulb",
  garbage: "fa-trash",
  water: "fa-faucet-drip",
  sewage: "fa-toilet",
  electricity: "fa-bolt",
  parks: "fa-tree",
  noise: "fa-volume-high",
  other: "fa-clipboard",
}

const CATEGORY_LABELS: Record<string, string> = {
  roads: "Roads",
  street_lights: "Street Lights",
  garbage: "Garbage",
  water: "Water",
  sewage: "Sewage",
  electricity: "Electricity",
  parks: "Parks",
  noise: "Noise",
  other: "Other",
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
}

const CATEGORY_OPTS = [
  { value: "", label: "All Categories" },
  { value: "roads", label: "Roads" },
  { value: "street_lights", label: "Street Lights" },
  { value: "garbage", label: "Garbage" },
  { value: "water", label: "Water" },
  { value: "sewage", label: "Sewage" },
  { value: "electricity", label: "Electricity" },
  { value: "parks", label: "Parks" },
  { value: "noise", label: "Noise" },
  { value: "other", label: "Other" },
]

const STATUS_OPTS = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
]

const WARD_OPTS = [
  { value: "", label: "All Wards" },
  ...Array.from({ length: 32 }, (_, i) => ({ value: String(i + 1), label: `Ward ${i + 1}` })),
]

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return String(n)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function SkeletonCard() {
  return (
    <div className="post-card skeleton" aria-hidden="true">
      <div className="post-card-head">
        <div className="post-author">
          <div className="skeleton-avatar" />
          <div className="author-meta">
            <div className="skeleton-line skeleton-line--short" />
            <div className="skeleton-line skeleton-line--xs" />
          </div>
        </div>
      </div>
      <div className="skeleton-line skeleton-line--medium" style={{ marginTop: 12 }} />
      <div className="skeleton-line" style={{ marginTop: 8 }} />
      <div className="skeleton-line skeleton-line--medium" style={{ marginTop: 8 }} />
      <div className="skeleton-media" style={{ marginTop: 12 }} />
      <div className="post-actions" style={{ marginTop: 12 }}>
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
      </div>
    </div>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  const prevRef = useRef(value)
  useEffect(() => {
    if (prevRef.current === value) return
    prevRef.current = value
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function CommunityFeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { searchQuery, setSearchQuery } = useSearch()

  const page = Number(searchParams.get("page")) || 1
  const sort = searchParams.get("sort") || "newest"
  const q = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const status = searchParams.get("status") || ""
  const ward = searchParams.get("ward") || ""

  const debouncedQ = useDebounce(q, 300)

  const [data, setData] = useState<FeedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const upvotingRef = useRef<Set<number>>(new Set())
  const [cfOpenCommentId, setCfOpenCommentId] = useState<number | null>(null)
  const [fetchedComments, setFetchedComments] = useState<Record<number, CommentType[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [commentSubmitting, setCommentSubmitting] = useState<Record<number, boolean>>({})
  const [commentLoading, setCommentLoading] = useState<Record<number, boolean>>({})
  const [mediaIndex, setMediaIndex] = useState<Record<number, number>>({})

  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      const qVal = overrides.q !== undefined ? overrides.q : q
      const pageVal = overrides.page !== undefined ? overrides.page : String(page)
      const sortVal = overrides.sort !== undefined ? overrides.sort : sort
      const catVal = overrides.category !== undefined ? overrides.category : category
      const statVal = overrides.status !== undefined ? overrides.status : status
      const wardVal = overrides.ward !== undefined ? overrides.ward : ward

      if (qVal) params.set("q", qVal)
      if (pageVal && pageVal !== "1") params.set("page", pageVal)
      if (sortVal && sortVal !== "newest") params.set("sort", sortVal)
      if (catVal) params.set("category", catVal)
      if (statVal) params.set("status", statVal)
      if (wardVal) params.set("ward", wardVal)

      const str = params.toString()
      return `/community-feed${str ? `?${str}` : ""}`
    },
    [q, page, sort, category, status, ward],
  )

  const navigate = useCallback(
    (overrides: Record<string, string | undefined>) => {
      router.push(buildUrl(overrides))
    },
    [router, buildUrl],
  )

  const syncDoneRef = useRef(false)
  useEffect(() => {
    if (!syncDoneRef.current && q) {
      setSearchQuery(q)
      syncDoneRef.current = true
    }
  }, [q, setSearchQuery])

  useEffect(() => {
    if (searchQuery === q) return
    const id = setTimeout(() => {
      navigate({ q: searchQuery || "", page: "1" })
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery, q, navigate])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    async function fetchFeed() {
      setLoading(true)
      setError(null)
      try {
        const filters: Record<string, unknown> = { page }
        if (debouncedQ) filters.q = debouncedQ
        if (sort) filters.sort = sort
        if (category) filters.category = category
        if (status) filters.status = status
        if (ward) filters.ward = Number(ward)

        const result = await getFeed(filters as Parameters<typeof getFeed>[0])
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      } catch (err: unknown) {
        if (cancelled) return
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ERR_CANCELED") return
        setError("Failed to load reports. Please try again.")
        setLoading(false)
      }
    }

    fetchFeed()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [page, debouncedQ, sort, category, status, ward])

  const handleUpvote = useCallback(
    async (reportId: number, currentlyUpvoted: boolean) => {
      if (!user) {
        router.push("/login?redirect=" + encodeURIComponent("/community-feed"))
        return
      }
      if (upvotingRef.current.has(reportId)) return
      upvotingRef.current.add(reportId)

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          results: prev.results.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  has_upvoted: !currentlyUpvoted,
                  total_upvotes: currentlyUpvoted ? r.total_upvotes - 1 : r.total_upvotes + 1,
                }
              : r,
          ),
        }
      })

      try {
        if (currentlyUpvoted) {
          await removeUpvote(reportId)
        } else {
          await upvoteReport(reportId)
        }
      } catch {
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            results: prev.results.map((r) =>
              r.id === reportId
                ? {
                    ...r,
                    has_upvoted: currentlyUpvoted,
                    total_upvotes: currentlyUpvoted ? r.total_upvotes + 1 : r.total_upvotes - 1,
                  }
                : r,
            ),
          }
        })
      } finally {
        upvotingRef.current.delete(reportId)
      }
    },
    [user, router],
  )

  const handleShare = useCallback((report: FeedReport) => {
    const url = `${window.location.origin}/report/${report.id}`
    if (navigator.share) {
      navigator.share({ title: report.title, text: report.description, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }, [])

  const toggleComments = useCallback(async (reportId: number) => {
    if (cfOpenCommentId === reportId) {
      setCfOpenCommentId(null)
      return
    }
    setCfOpenCommentId(reportId)
    if (!fetchedComments[reportId]) {
      setCommentLoading((prev) => ({ ...prev, [reportId]: true }))
      try {
        const comments = await getComments(reportId)
        setFetchedComments((prev) => ({ ...prev, [reportId]: comments as CommentType[] }))
      } catch {
        // ignore — user can retry by toggling again
      } finally {
        setCommentLoading((prev) => ({ ...prev, [reportId]: false }))
      }
    }
  }, [cfOpenCommentId, fetchedComments])

  const handleSubmitComment = useCallback(async (reportId: number) => {
    const text = commentInputs[reportId]?.trim()
    if (!text || commentSubmitting[reportId]) return
    setCommentSubmitting((prev) => ({ ...prev, [reportId]: true }))
    const optimisticComment: CommentType = {
      id: -Date.now(),
      report: reportId,
      user: -1,
      author_name: user?.name || "You",
      author_profile_picture: user?.photoURL || null,
      parent: null,
      content: text,
      is_edited: false,
      replies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setFetchedComments((prev) => ({
      ...prev,
      [reportId]: [...(prev[reportId] || []), optimisticComment],
    }))
    setCommentInputs((prev) => ({ ...prev, [reportId]: "" }))
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        results: prev.results.map((r) =>
          r.id === reportId ? { ...r, total_comments: r.total_comments + 1 } : r,
        ),
      }
    })
    try {
      const newComment = await createComment(reportId, { content: text })
      setFetchedComments((prev) => ({
        ...prev,
        [reportId]: (prev[reportId] || []).map((c) =>
          c.id === optimisticComment.id ? (newComment as CommentType) : c,
        ),
      }))
    } catch {
      setFetchedComments((prev) => ({
        ...prev,
        [reportId]: (prev[reportId] || []).filter((c) => c.id !== optimisticComment.id),
      }))
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          results: prev.results.map((r) =>
            r.id === reportId ? { ...r, total_comments: r.total_comments - 1 } : r,
          ),
        }
      })
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [reportId]: false }))
    }
  }, [commentInputs, commentSubmitting, user])

  const totalPages = data ? Math.ceil(data.count / 20) : 0
  const hasPrevious = data?.previous != null || page > 1
  const hasNext = data?.next != null

  const filterCount = [category, status, ward].filter(Boolean).length

  const activeFilters = useMemo(
    () => ({ category, status, ward }),
    [category, status, ward],
  )

  return (
    <div id="feedView" style={{ display: "block" }}>
      <div className="feed-container">
        <OfficialPendingBanner />

        <div className="feed-toolbar">
          <div className="feed-tabs" role="tablist" aria-label="Sort reports">
            {[
              { key: "newest", label: "All Issues" },
              { key: "recent", label: "Most Recent" },
              { key: "most_upvoted", label: "Most Upvoted" },
            ].map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={sort === tab.key}
                className={"feed-tab" + (sort === tab.key ? " active" : "")}
                onClick={() => navigate({ sort: tab.key, page: "1" })}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className={"filter-dropdown" + (filterOpen ? " open" : "")}
            id="cfFilter"
            ref={filterRef}
          >
            <button
              className="filter-btn"
              id="cfFilterBtn"
              onClick={() => setFilterOpen(!filterOpen)}
              aria-expanded={filterOpen}
              aria-haspopup="true"
            >
              <span id="cfFilterLabel">
                <i className="fa-solid fa-sliders"></i>{" "}
                {filterCount > 0
                  ? `${filterCount} ${filterCount > 1 ? "Filters" : "Filter"} Applied`
                  : "Filter"}
              </span>
              <i className="fa-solid fa-chevron-down"></i>
            </button>
            {filterOpen && (
              <div className="filter-menu" id="cfFilterMenu" style={{ display: "block" }} role="dialog" aria-label="Filters">
                <div className="filter-group">
                  <label className="filter-group-label" id="filter-cat-label">Category</label>
                  <select
                    className="filter-select"
                    aria-labelledby="filter-cat-label"
                    value={category}
                    onChange={(e) => navigate({ category: e.target.value, page: "1" })}
                  >
                    {CATEGORY_OPTS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-divider" />

                <div className="filter-group">
                  <label className="filter-group-label" id="filter-status-label">Status</label>
                  <select
                    className="filter-select"
                    aria-labelledby="filter-status-label"
                    value={status}
                    onChange={(e) => navigate({ status: e.target.value, page: "1" })}
                  >
                    {STATUS_OPTS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-divider" />

                <div className="filter-group">
                  <label className="filter-group-label" id="filter-ward-label">Ward</label>
                  <select
                    className="filter-select"
                    aria-labelledby="filter-ward-label"
                    value={ward}
                    onChange={(e) => navigate({ ward: e.target.value, page: "1" })}
                  >
                    {WARD_OPTS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-divider" />

                <div className="filter-apply-wrap">
                  <button
                    className="filter-reset-btn"
                    id="cfResetBtn"
                    onClick={() => {
                      navigate({ category: "", status: "", ward: "", page: "1" })
                      setFilterOpen(false)
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className="filter-apply-btn"
                    id="cfApplyBtn"
                    onClick={() => setFilterOpen(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {data && !loading && !error && data.results.length > 0 && debouncedQ && (
          <div className="search-info">
            <span>Search results for "<strong>{debouncedQ}</strong>"</span>
            <button className="search-info-clear" onClick={() => {
              setSearchQuery("")
              syncDoneRef.current = true
              navigate({ q: "", page: "1" })
            }}>
              Clear
            </button>
          </div>
        )}

        {loading && (
          <div className="feed-list" id="feedList" aria-live="polite" aria-label="Loading reports">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="empty-state" role="alert">
            <div className="empty-state-icon">
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 48, color: "#ef4444" }}></i>
            </div>
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => {
                setError(null)
                setLoading(true)
                const params = new URLSearchParams()
                if (q) params.set("q", q)
                if (page > 1) params.set("page", String(page))
                if (sort !== "newest") params.set("sort", sort)
                if (category) params.set("category", category)
                if (status) params.set("status", status)
                if (ward) params.set("ward", ward)
                navigate(Object.fromEntries(params))
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && data.results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fa-regular fa-rectangle-list" style={{ fontSize: 48, color: "var(--color-muted)" }}></i>
            </div>
            <p>{debouncedQ ? `No reports match "${debouncedQ}".` : "No reports have been submitted yet."}</p>
            {(debouncedQ || category || status || ward) && (
              <button
                className="retry-btn"
                onClick={() => {
                  setSearchQuery("")
                  syncDoneRef.current = true
                  navigate({ q: "", category: "", status: "", ward: "", page: "1" })
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && data && data.results.length > 0 && (
          <>
            <div className="feed-list" id="feedList">
              {data.results.map((report) => {
                const catIcon = CATEGORY_ICONS[report.category] || "fa-clipboard"
                const catName = CATEGORY_LABELS[report.category] || report.category
                const reportStatus = STATUS_LABELS[report.status] || report.status

                return (
                  <article key={report.id} className="post-card" data-id={report.id}>
                    <div className="post-card-head">
                      <div className="post-author">
                        <Link href={`/user/${report.citizen}`} className="post-author-link">
                          {report.citizen_profile_picture ? (
                            <img
                              src={report.citizen_profile_picture}
                              alt=""
                              className="avatar-img"
                              width={36}
                              height={36}
                            />
                          ) : (
                            <span className="avatar" dangerouslySetInnerHTML={{ __html: ICONS.user }} />
                          )}
                        </Link>
                        <div className="author-meta">
                          <Link href={`/user/${report.citizen}`} className="author-name-link">
                            <span className="author-name">
                              <Highlight text={report.citizen_name} query={debouncedQ} />
                            </span>
                          </Link>
                          <span className="post-date">{formatTime(report.created_at)}</span>
                        </div>
                      </div>
                      <div className="head-right">
                        <span className="status-badge" data-status={report.status}>
                          {reportStatus}
                        </span>
                      </div>
                    </div>

                    <h3 className="post-title">
                      <Highlight text={report.title} query={debouncedQ} />
                    </h3>

                    <div className="post-meta-row">
                      <span className="cf-location">
                        <i className="fa-solid fa-location-dot"></i> {report.municipality}
                      </span>
                      <span className="cf-cat">
                        <i className={"fa-solid " + catIcon}></i> {catName}
                      </span>
                      <span className="cf-ward">
                        <i className="fa-solid fa-building"></i> Ward {report.ward_number}
                      </span>
                    </div>

                    <p className="post-body">
                      <Highlight text={report.description} query={debouncedQ} />
                    </p>

                    {(report.images.length > 0 || report.videos.length > 0) && (
                      <div className="post-media">
                        {report.images.length > 0 && (
                          <>
                            <div className="post-media-carousel">
                              {report.images.length > 1 && (
                                <button
                                  className="carousel-arrow carousel-arrow--left"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMediaIndex((prev) => ({
                                      ...prev,
                                      [report.id]: Math.max(0, (prev[report.id] || 0) - 1),
                                    }))
                                  }}
                                  aria-label="Previous image"
                                >
                                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                              )}
                              <div className="post-media-item">
                                <img
                                  src={report.images[mediaIndex[report.id] || 0].image}
                                  alt={report.title}
                                  loading="lazy"
                                  onClick={() => {
                                    const next = ((mediaIndex[report.id] || 0) + 1) % report.images.length
                                    setMediaIndex((prev) => ({ ...prev, [report.id]: next }))
                                  }}
                                />
                              </div>
                              {report.images.length > 1 && (
                                <button
                                  className="carousel-arrow carousel-arrow--right"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMediaIndex((prev) => ({
                                      ...prev,
                                      [report.id]: Math.min(report.images.length - 1, (prev[report.id] || 0) + 1),
                                    }))
                                  }}
                                  aria-label="Next image"
                                >
                                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                              )}
                            </div>
                            {report.images.length > 1 && (
                              <div className="carousel-dots">
                                {report.images.map((_, i) => (
                                  <button
                                    key={i}
                                    className={"carousel-dot" + (i === (mediaIndex[report.id] || 0) ? " active" : "")}
                                    onClick={() => setMediaIndex((prev) => ({ ...prev, [report.id]: i }))}
                                    aria-label={`Image ${i + 1}`}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        {report.videos.map((v) => (
                          <div key={v.id} className="post-media-item post-media-item--video">
                            <video src={v.video} controls preload="metadata" aria-label="Report video" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="post-actions">
                      <div className="action-group">
                        <button
                          className={"action-pill upvote-pill" + (report.has_upvoted ? " upvoted" : "")}
                          data-action="upvote"
                          aria-pressed={report.has_upvoted}
                          aria-label={`${report.has_upvoted ? "Remove upvote" : "Upvote"} (${report.total_upvotes} upvotes)`}
                          onClick={() => handleUpvote(report.id, report.has_upvoted)}
                          dangerouslySetInnerHTML={{
                            __html:
                              ICONS.upvote +
                              '<span class="upvote-count">' +
                              formatCount(report.total_upvotes) +
                              "</span>",
                          }}
                        />
                        <button
                          className={"action-pill" + (cfOpenCommentId === report.id ? " active" : "")}
                          data-action="comment"
                          aria-label={`${report.total_comments} comments`}
                          onClick={() => toggleComments(report.id)}
                          dangerouslySetInnerHTML={{
                            __html:
                              ICONS.comment + "<span>" + formatCount(report.total_comments) + "</span>",
                          }}
                        />
                        <button
                          className="action-pill"
                          data-action="share"
                          aria-label="Share this report"
                          onClick={() => handleShare(report)}
                          dangerouslySetInnerHTML={{
                            __html: ICONS.share + "<span>Share</span>",
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className="cf-comments-section"
                      style={{ display: cfOpenCommentId === report.id ? "block" : "none" }}
                    >
                      {commentLoading[report.id] ? (
                        <div style={{ padding: "12px 16px", textAlign: "center", color: "var(--color-muted)", fontSize: 13 }}>
                          Loading comments...
                        </div>
                      ) : (
                        <div className="cf-comments-list">
                          {(fetchedComments[report.id] || []).length > 0 ? (
                            (fetchedComments[report.id] || []).map((c) => (
                              <div key={c.id} className="cf-comment">
                                <div className="cf-comment-author-row">
                                  {c.author_profile_picture ? (
                                    <img src={c.author_profile_picture} alt="" className="cf-comment-avatar" width={24} height={24} />
                                  ) : (
                                    <span className="cf-comment-avatar-placeholder">
                                      {c.author_name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="cf-comment-author">{c.author_name}</span>
                                  <span className="cf-comment-time">{formatTime(c.created_at)}</span>
                                </div>
                                <p className="cf-comment-text">{c.content}</p>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: "#9CA3AF", fontSize: 13, padding: "8px 16px" }}>
                              No comments yet.
                            </p>
                          )}
                        </div>
                      )}
                      <div className="cf-comment-input-row">
                        <input
                          type="text"
                          className="cf-comment-input"
                          placeholder="Add a comment..."
                          maxLength={1000}
                          value={commentInputs[report.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [report.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmitComment(report.id)
                          }}
                        />
                        <button
                          type="button"
                          className="cf-comment-submit"
                          disabled={commentSubmitting[report.id] || !(commentInputs[report.id]?.trim())}
                          onClick={() => handleSubmitComment(report.id)}
                        >
                          {commentSubmitting[report.id] ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {totalPages > 1 && (
              <nav className="pagination" aria-label="Report pagination">
                <button
                  className="pagination-btn"
                  disabled={!hasPrevious}
                  onClick={() => navigate({ page: String(page - 1) })}
                  aria-label="Previous page"
                >
                  <i className="fa-solid fa-chevron-left"></i> Previous
                </button>

                <div className="pagination-info">
                  Page {page} of {totalPages}
                </div>

                <button
                  className="pagination-btn"
                  disabled={!hasNext}
                  onClick={() => navigate({ page: String(page + 1) })}
                  aria-label="Next page"
                >
                  Next <i className="fa-solid fa-chevron-right"></i>
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
