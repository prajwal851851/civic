"use client"

import { use, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getReport } from "@/lib/api/reports"
import {
  getComments,
  createComment,
} from "@/lib/api/comments"
import { upvoteReport, removeUpvote } from "@/lib/api/reports"
import { handleApiError } from "@/lib/api/error-handler"
import { useAuth } from "@/lib/auth-context"
import type { FeedImage, FeedVideo } from "@/lib/api/reports"

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

interface ReportDetail {
  id: number
  citizen: number
  citizen_name: string
  title: string
  description: string
  category: string
  latitude: string
  longitude: string
  municipality: string
  ward_number: number
  address: string
  status: string
  ai_status: string
  visibility: boolean
  progress_notes: string
  moderation_note: string
  images: FeedImage[]
  videos: FeedVideo[]
  total_upvotes: number
  has_upvoted: boolean
  created_at: string
  updated_at: string
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
  rejected: "Rejected",
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

function parseProgressNotes(raw: string): { date: string; note: string }[] {
  if (!raw || !raw.trim()) return []
  return raw
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      const match = line.match(/^\[(.*?)\]\s*(.*)/)
      if (match) return { date: match[1], note: match[2] }
      return { date: "", note: line }
    })
}

interface Props {
  params: Promise<{ id: string }>
}

function Skeleton() {
  return (
    <div className="page-wrapper">
      <div className="rd-skeleton-block" style={{ width: 120, height: 20, marginBottom: 24 }} />
      <div className="rd-skeleton-block" style={{ width: "80%", height: 32, marginBottom: 16 }} />
      <div className="rd-skeleton-block" style={{ width: "60%", height: 20, marginBottom: 24 }} />
      <div className="rd-skeleton-block" style={{ width: "100%", height: 100, marginBottom: 24 }} />
      <div className="rd-skeleton-block" style={{ width: "100%", height: 200, marginBottom: 24 }} />
      <div className="rd-skeleton-block" style={{ width: "40%", height: 20, marginBottom: 16 }} />
    </div>
  )
}

export default function ReportDetailsPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSubmit = searchParams.get("from") === "submit-report"
  const fromUser = searchParams.get("from")?.startsWith("user/")
    ? searchParams.get("from")!.replace("user/", "")
    : null
  const { user } = useAuth()

  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  const [comments, setComments] = useState<CommentType[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [upvoting, setUpvoting] = useState(false)

  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const [expandedImg, setExpandedImg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setErrorStatus(null)
      try {
        const reportData = (await getReport(Number(id))) as ReportDetail
        if (cancelled) return
        setReport(reportData)
        setHasUpvoted(reportData.has_upvoted)
        setUpvoteCount(reportData.total_upvotes)
        document.title = `${reportData.title} — CivicVoice`
      } catch (err: unknown) {
        if (cancelled) return
        const apiErr = handleApiError(err)
        setError(apiErr.message)
        setErrorStatus(apiErr.status)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function loadComments() {
      setCommentsLoading(true)
      try {
        const data = (await getComments(Number(id))) as CommentType[]
        if (!cancelled) setComments(data)
      } catch {
        // silently ignore — comments are secondary content
      } finally {
        if (!cancelled) setCommentsLoading(false)
      }
    }
    loadComments()
    return () => { cancelled = true }
  }, [id])

  const handleUpvote = useCallback(async () => {
    if (upvoting) return
    setUpvoting(true)
    const wasUpvoted = hasUpvoted
    setHasUpvoted(!hasUpvoted)
    setUpvoteCount((c) => (wasUpvoted ? c - 1 : c + 1))
    try {
      if (wasUpvoted) {
        await removeUpvote(Number(id))
      } else {
        await upvoteReport(Number(id))
      }
    } catch {
      setHasUpvoted(wasUpvoted)
      setUpvoteCount((c) => (wasUpvoted ? c + 1 : c - 1))
    } finally {
      setUpvoting(false)
    }
  }, [id, hasUpvoted, upvoting])

  const handleAddComment = useCallback(async () => {
    const text = commentInput.trim()
    if (!text || commentSubmitting) return
    setCommentSubmitting(true)
    const optimistic: CommentType = {
      id: -Date.now(),
      report: Number(id),
      user: Number(user?.id) || -1,
      author_name: user?.name || "You",
      author_profile_picture: user?.photoURL || null,
      parent: null,
      content: text,
      is_edited: false,
      replies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, optimistic])
    setCommentInput("")
    try {
      const created = (await createComment(Number(id), {
        content: text,
      })) as CommentType
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? created : c)),
      )
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id))
    } finally {
      setCommentSubmitting(false)
    }
  }, [id, commentInput, commentSubmitting, user])

  if (loading) return <Skeleton />

  if (error) {
    let icon = "fa-triangle-exclamation"
    let title = "Something went wrong"
    if (errorStatus === 404) {
      icon = "fa-map-pin"
      title = "Report not found"
    }
    return (
      <div className="page-wrapper">
        <div className="rd-error-card">
          <i className={`fa-solid ${icon}`} style={{ fontSize: 40, color: "var(--color-muted)", marginBottom: 12 }} />
          <h2>{title}</h2>
          <p style={{ color: "#6B7280", margin: "0 0 20px" }}>{error}</p>
          <div className="rd-error-actions">
            <button className="rd-btn rd-btn-primary" onClick={() => router.back()}>
              <i className="fa-solid fa-arrow-left" /> Go Back
            </button>
            <button className="rd-btn rd-btn-secondary" onClick={() => router.push("/community-feed")}>
              Browse Feed
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  const progressEntries = parseProgressNotes(report.progress_notes)
  const statusClass = report.status.toLowerCase().replace(/\s+/g, "-")
  const categoryLabel = CATEGORY_LABELS[report.category] || report.category
  const statusLabel = STATUS_LABELS[report.status] || report.status

  return (
    <div className="page-wrapper rd-page">
      <Link href={fromUser ? `/user/${fromUser}` : fromSubmit ? "/submit-report" : "/community-feed"} className="back-link">
        <i className="fa-solid fa-arrow-left" /> {fromUser ? "Back to Profile" : fromSubmit ? "Back to My Reports" : "Back to Feed"}
      </Link>

      {/* Moderation Banner */}
      {!report.visibility && report.status === "open" && (
        <div className="rd-banner rd-banner--pending">
          <i className="fa-solid fa-clock" />
          <span>This report is pending review. It will be published to the community feed after an official approves it.</span>
        </div>
      )}
      {report.status === "rejected" && report.moderation_note && (
        <div className="rd-banner rd-banner--rejected">
          <i className="fa-solid fa-circle-xmark" />
          <div>
            <strong>Report Rejected</strong>
            <p>{report.moderation_note}</p>
          </div>
        </div>
      )}
      {report.visibility && report.moderation_note && (
        <div className="rd-banner rd-banner--approved">
          <i className="fa-solid fa-circle-check" />
          <div>
            <strong>Report Approved</strong>
            <p>{report.moderation_note}</p>
          </div>
        </div>
      )}

      {/* Title & Status */}
      <div className="rd-header">
        <h1 className="report-title">{report.title}</h1>
        <span className={`report-badge ${statusClass}`}>{statusLabel}</span>
      </div>
      <p className="rd-byline">
        Reported by{" "}
        <Link href={`/user/${report.citizen}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
          {report.citizen_name}
        </Link>{" "}
        &middot; {formatDate(report.created_at)}
        {report.updated_at !== report.created_at && (
          <> &middot; Updated {formatTimeAgo(report.updated_at)}</>
        )}
      </p>

      {/* Metadata Grid */}
      <div className="rd-meta-grid">
        <div className="rd-meta-item">
          <i className="fa-solid fa-tag" />
          <div>
            <span className="rd-meta-label">Category</span>
            <span className="rd-meta-value">{categoryLabel}</span>
          </div>
        </div>
        <div className="rd-meta-item">
          <i className="fa-solid fa-building" />
          <div>
            <span className="rd-meta-label">Location</span>
            <span className="rd-meta-value">
              {report.municipality}, Ward {report.ward_number}
            </span>
          </div>
        </div>
        {report.address && (
          <div className="rd-meta-item">
            <i className="fa-solid fa-location-dot" />
            <div>
              <span className="rd-meta-label">Address</span>
              <span className="rd-meta-value">{report.address}</span>
            </div>
          </div>
        )}
        <div className="rd-meta-item">
          <i className="fa-solid fa-eye" />
          <div>
            <span className="rd-meta-label">Visibility</span>
            <span className="rd-meta-value">
              {report.visibility ? "Public" : "Private"}
            </span>
          </div>
        </div>
        <div className="rd-meta-item">
          <i className="fa-solid fa-microchip" />
          <div>
            <span className="rd-meta-label">AI Status</span>
            <span className="rd-meta-value">
              {report.ai_status.charAt(0).toUpperCase() + report.ai_status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="report-description">{report.description}</p>

      {/* Images */}
      {report.images.length > 0 && (
        <div className="rd-media-grid">
          {report.images.map((img) => (
            <div key={img.id} className="rd-img-wrapper">
              {imgErrors[img.id] ? (
                <div className="rd-img-fallback">
                  <i className="fa-solid fa-image" />
                  <span>Image unavailable</span>
                </div>
              ) : (
                <img
                  src={img.image}
                  alt=""
                  loading="lazy"
                  className="rd-img"
                  onClick={() => setExpandedImg(img.image)}
                  onError={() => setImgErrors((prev) => ({ ...prev, [img.id]: true }))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {report.videos.length > 0 && (
        <div className="rd-media-grid">
          {report.videos.map((v) => (
            <div key={v.id} className="rd-video-wrapper">
              <video
                src={v.video}
                controls
                preload="metadata"
                className="rd-video"
                aria-label="Report video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="rd-actions">
        <button
          className={"rd-action-btn" + (hasUpvoted ? " upvoted" : "")}
          onClick={handleUpvote}
          disabled={upvoting}
          aria-label={hasUpvoted ? "Remove upvote" : "Upvote"}
        >
          <i className={`fa-solid fa-thumbs-up ${hasUpvoted ? "upvoted-icon" : ""}`} />
          <span>{upvoteCount} {upvoteCount === 1 ? "Upvote" : "Upvotes"}</span>
        </button>
        <button
          className="rd-action-btn"
          onClick={() => {
            const url = `${window.location.origin}/report-details/${id}`
            if (navigator.share) {
              navigator.share({ title: report.title, url }).catch(() => {})
            } else {
              navigator.clipboard.writeText(url).catch(() => {})
            }
          }}
        >
          <i className="fa-solid fa-share-nodes" />
          <span>Share</span>
        </button>
      </div>

      {/* Progress Notes */}
      {progressEntries.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">
            <i className="fa-solid fa-clock-rotate-left" /> Progress Notes
          </h3>
          <div className="rd-progress-list">
            {progressEntries.map((entry, i) => (
              <div key={i} className="rd-progress-item">
                <div className="rd-progress-dot" />
                <div className="rd-progress-body">
                  {entry.date && (
                    <span className="rd-progress-date">
                      {formatDate(entry.date)}
                    </span>
                  )}
                  <p className="rd-progress-text">{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="rd-section">
        <h3 className="rd-section-title">
          <i className="fa-solid fa-comment" /> Comments ({comments.length})
        </h3>

        {commentsLoading ? (
          <div className="rd-skeleton-block" style={{ width: "100%", height: 80, marginBottom: 16 }} />
        ) : (
          <div className="rd-comments-list">
            {comments.length === 0 ? (
              <p className="rd-empty-text">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rd-comment">
                  <div className="rd-comment-avatar-col">
                    {c.author_profile_picture ? (
                      <img
                        src={c.author_profile_picture}
                        alt=""
                        className="rd-comment-avatar"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="rd-comment-avatar-placeholder">
                        {c.author_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="rd-comment-body">
                    <div className="rd-comment-header">
                      <span className="rd-comment-author">{c.author_name}</span>
                      <span className="rd-comment-date">{formatTimeAgo(c.created_at)}</span>
                    </div>
                    <p className="rd-comment-text">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="rd-comment-input-row">
          <input
            type="text"
            className="rd-comment-input"
            placeholder="Add a comment..."
            maxLength={1000}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddComment()
            }}
          />
          <button
            type="button"
            className="rd-comment-submit"
            disabled={commentSubmitting || !commentInput.trim()}
            onClick={handleAddComment}
          >
            {commentSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Image Lightbox */}
      {expandedImg && (
        <div className="rd-lightbox" onClick={() => setExpandedImg(null)}>
          <img src={expandedImg} alt="Enlarged" className="rd-lightbox-img" />
          <button className="rd-lightbox-close" onClick={() => setExpandedImg(null)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
    </div>
  )
}
