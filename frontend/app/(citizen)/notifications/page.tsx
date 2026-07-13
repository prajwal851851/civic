'use client'

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getNotifications, markRead, markAllRead, deleteNotification } from "@/lib/api/notifications"
import { handleApiError } from "@/lib/api/error-handler"

interface NotificationItem {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  actor_name: string | null
  report_id: number | null
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
    <div className="notif-card" style={{ opacity: 0.6 }}>
      <div className="notif-body">
        <div className="skeleton-line skeleton-line--medium" style={{ marginBottom: 6 }} />
        <div className="skeleton-line skeleton-line--xs" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { user, initialized } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Set<number>>(new Set())
  const [markingRead, setMarkingRead] = useState<Set<number>>(new Set())
  const [markingAllRead, setMarkingAllRead] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNotifications() as { count?: number; results?: NotificationItem[] } | NotificationItem[]
      const items = Array.isArray(data) ? data : (data?.results ?? [])
      setNotifications(items)
    } catch (err) {
      const apiErr = handleApiError(err)
      if (apiErr.status === 401) {
        router.push("/login?redirect=" + encodeURIComponent("/notifications"))
        return
      }
      setError(apiErr.message)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (initialized && !user) {
      router.push("/login?redirect=" + encodeURIComponent("/notifications"))
      return
    }
    if (user) fetchNotifications()
  }, [user, initialized, router, fetchNotifications])

  const handleMarkRead = useCallback(async (id: number) => {
    setMarkingRead(prev => new Set(prev).add(id))
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try {
      await markRead(id)
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n))
    } finally {
      setMarkingRead(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAllRead(true)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await markAllRead()
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: false })))
    } finally {
      setMarkingAllRead(false)
    }
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Delete this notification?")) return
    setDeleting(prev => new Set(prev).add(id))
    const removed = notifications.filter(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await deleteNotification(id)
    } catch {
      setNotifications(prev => [...prev, ...removed])
    } finally {
      setDeleting(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!initialized || !user) return null

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="subtitle" style={{ margin: '4px 0 0' }}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <button
            className="pv-btn pv-btn-secondary"
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
          >
            {markingAllRead ? 'Marking...' : 'Mark All as Read'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>
          <p>{error}</p>
          <button className="pv-btn pv-btn-secondary" style={{ marginTop: 12 }} onClick={fetchNotifications}>Retry</button>
        </div>
      )}

      {loading && !error && (
        <div>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>
            <i className="fa-regular fa-bell-slash"></i>
          </div>
          <h3 style={{ margin: '0 0 8px' }}>No notifications yet</h3>
          <p style={{ margin: 0 }}>When you receive comments, upvotes, or status updates, they will appear here.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div>
          {notifications.map(n => (
            <div key={n.id} className={"notif-card" + (!n.is_read ? " notif-unread" : "") + (deleting.has(n.id) ? " notif-deleting" : "")}>
              <div className="notif-body">
                <div className="notif-title" style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{n.title}</div>
                <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.message }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                  <span className="notif-time">{formatTime(n.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {!n.is_read && (
                  <button
                    className="notif-action-btn"
                    onClick={() => handleMarkRead(n.id)}
                    disabled={markingRead.has(n.id)}
                    title="Mark as read"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
                {n.report_id && (
                  <button
                    className="notif-action-btn"
                    onClick={() => router.push(`/report-details/${n.report_id}`)}
                    title="View report"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                )}
                {n.type === "NOTICE" && (
                  <button
                    className="notif-action-btn"
                    onClick={() => router.push("/notices")}
                    title="View notices"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                  </button>
                )}
                <button
                  className="notif-action-btn notif-action-delete"
                  onClick={() => handleDelete(n.id)}
                  disabled={deleting.has(n.id)}
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
