'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getPublicProfile } from "@/lib/api/users"
import { getUserReports } from "@/lib/api/reports"
import type { PublicProfile } from "@/lib/api/users"
import type { FeedReport, FeedResponse } from "@/lib/api/reports"
import { handleApiError } from "@/lib/api/error-handler"

const STATUS_COLORS: Record<string, string> = {
  open: '#EF4444', in_review: '#D97706', resolved: '#059669', rejected: '#6B7280',
}
const STATUS_BGS: Record<string, string> = {
  open: '#FEE2E2', in_review: '#FEF3C7', resolved: '#D1FAE5', rejected: '#F3F4F6',
}
const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_review: 'In Review', resolved: 'Resolved', rejected: 'Rejected',
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z" />
    </svg>
  )
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reports, setReports] = useState<FeedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const userId = Number(id)
    setLoading(true)
    setError(null)
    Promise.all([
      getPublicProfile(userId).then(setProfile),
      getUserReports(userId).then((res: FeedResponse) => {
        setReports(res.results)
      }).finally(() => setReportsLoading(false)),
    ]).catch((err) => setError(handleApiError(err).message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="auth-card" style={{ textAlign: 'center', padding: 40, marginTop: 60 }}>
        <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="auth-card" style={{ textAlign: 'center', padding: 40, marginTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F9E8;</div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>User not found</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: 16 }}>{error || "The user you're looking for doesn't exist."}</p>
        <Link href="/community-feed" className="auth-btn auth-btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Back to Community Feed
        </Link>
      </div>
    )
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long',
  })
  const location = [profile.municipality, profile.ward_number ? `Ward ${profile.ward_number}` : ''].filter(Boolean).join(', ')

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 40px' }}>
      {/* Back link */}
      <div style={{ marginBottom: 12, paddingTop: 12 }}>
        <Link href="/community-feed" style={{ fontSize: 14, color: 'var(--color-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Back to Community Feed
        </Link>
      </div>

      {/* Cover */}
      <div style={{
        height: 240, borderRadius: '0 0 12px 12px', overflow: 'hidden', position: 'relative',
        background: profile.cover_photo ? `url(${profile.cover_photo}) center/cover no-repeat` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }} />

      {/* Profile card */}
      <div style={{
        background: 'var(--color-card-bg)', borderRadius: 12, border: '1px solid var(--color-border)',
        padding: '0 24px 24px', marginTop: -48, position: 'relative',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
          border: '4px solid var(--color-card-bg)', marginTop: -48,
          background: 'var(--color-bg)',
        }}>
          {profile.profile_picture ? (
            <img src={profile.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--color-muted)' }}>
              <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="24" cy="16" r="8" />
                <path d="M8 44c0-8.8 7.2-16 16-16s16 7.2 16 16" />
              </svg>
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <h1 style={{ fontSize: 22, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {profile.full_name}
            {profile.is_verified && (
              <span style={{ color: '#1D9BF0', fontSize: 18 }} title="Verified">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                </svg>
              </span>
            )}
          </h1>
          {profile.username && (
            <p style={{ margin: '2px 0 0', fontSize: 15, color: 'var(--color-muted)' }}>@{profile.username}</p>
          )}
        </div>

        {profile.bio && (
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5, color: 'var(--color-text)' }}>{profile.bio}</p>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--color-muted)', flexWrap: 'wrap' }}>
          {location && <span><i className="fa-solid fa-location-dot" /> {location}</span>}
          <span><i className="fa-regular fa-calendar" /> Joined {memberSince}</span>
        </div>

        <div style={{
          display: 'flex', gap: 24, marginTop: 16, paddingTop: 16,
          borderTop: '1px solid var(--color-border)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.report_count}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Reports</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.reputation_points}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Points</div>
          </div>
        </div>
      </div>

      {/* Reports section */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CategoryIcon /> Reports
        </h2>

        {reportsLoading ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-muted)', fontSize: 14 }}>
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-muted)', fontSize: 14 }}>
            No reports yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/report-details/${r.id}?from=user/${id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-card-bg)', textDecoration: 'none', color: 'inherit',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span><i className="fa-regular fa-calendar" /> {new Date(r.created_at).toLocaleDateString()}</span>
                    <span><i className="fa-solid fa-location-dot" /> {r.municipality}{r.ward_number ? `, Ward ${r.ward_number}` : ''}</span>
                  </div>
                </div>
                <span style={{
                  padding: '2px 10px', borderRadius: 10, fontWeight: 600, fontSize: 11,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  background: STATUS_BGS[r.status] || '#F3F4F6',
                  color: STATUS_COLORS[r.status] || '#6B7280',
                }}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
