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

export default function OfficialNotificationsPage() {
  const { user, initialized } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(apiErr.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialized && !user) return
    if (user) fetchNotifications()
  }, [user, initialized, fetchNotifications])

  const handleMarkRead = useCallback(async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try { await markRead(id) } catch { fetchNotifications() }
  }, [fetchNotifications])

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAllRead(true)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try { await markAllRead() } catch { fetchNotifications() }
    finally { setMarkingAllRead(false) }
  }, [fetchNotifications])

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Delete this notification?")) return
    setNotifications(prev => prev.filter(n => n.id !== id))
    try { await deleteNotification(id) } catch { fetchNotifications() }
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h1 className="sv-section-title" style={{ margin: 0 }}>Notifications</h1>
        {notifications.length > 0 && unreadCount > 0 && (
          <button className="pv-btn pv-btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={handleMarkAllRead} disabled={markingAllRead}>
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
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="notif-card" key={i} style={{ opacity: 0.5 }}>
              <div className="notif-body">
                <div className="skeleton-line skeleton-line--medium" style={{ marginBottom: 6 }} />
                <div className="skeleton-line skeleton-line--xs" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 40 }}>No notifications yet.</p>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div>
          {notifications.map(n => (
            <div key={n.id} className={"notif-card" + (!n.is_read ? " notif-unread" : "")}>
              <div className="notif-body">
                <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.message }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                  <span className="notif-time">{formatTime(n.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {!n.is_read && (
                  <button className="notif-action-btn" onClick={() => handleMarkRead(n.id)} title="Mark as read">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
                {n.report_id && (
                  <button className="notif-action-btn" onClick={() => router.push(`/report-details/${n.report_id}`)} title="View report">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                )}
                <button className="notif-action-btn notif-action-delete" onClick={() => handleDelete(n.id)} title="Delete">
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
