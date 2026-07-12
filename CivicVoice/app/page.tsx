'use client'

import { useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { getFeed } from "@/lib/api/reports"
import type { FeedReport } from "@/lib/api/reports"
import { getNotices } from "@/lib/api/notices"

export default function Home() {
  const homeRef = useRef<HTMLDivElement>(null)
  const [recentReports, setRecentReports] = useState<FeedReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [wardReports, setWardReports] = useState<FeedReport[]>([])
  const [wardLoading, setWardLoading] = useState(true)
  const [notices, setNotices] = useState<any[]>([])
  const [noticesLoading, setNoticesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchRecent() {
      try {
        const result = await getFeed({ page_size: 3 })
        if (!cancelled) setRecentReports((result.results ?? []).slice(0, 3))
      } catch {
        // silently fail — keep empty
      } finally {
        if (!cancelled) setReportsLoading(false)
      }
    }
    fetchRecent()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchWards() {
      try {
        const result = await getFeed({ page_size: 100 })
        if (!cancelled) setWardReports(result.results ?? [])
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setWardLoading(false)
      }
    }
    fetchWards()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchNotices() {
      try {
        const result = await getNotices()
        if (!cancelled) setNotices(result.results ?? result ?? [])
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setNoticesLoading(false)
      }
    }
    fetchNotices()
    return () => { cancelled = true }
  }, [])


  const wardStats = useMemo(() => {
    if (!wardReports.length) return []
    const map = new Map<number, { total: number; resolved: number; review: number; open: number }>()
    for (let i = 1; i <= 32; i++) map.set(i, { total: 0, resolved: 0, review: 0, open: 0 })
    for (const r of wardReports) {
      const w = map.get(r.ward_number)
      if (!w) continue
      w.total++
      if (r.status === "resolved") w.resolved++
      else if (r.status === "in_review") w.review++
      else if (r.status === "open") w.open++
    }
    return [...map.entries()]
      .map(([num, w]) => {
        const total = w.total
        const resolved = total ? Math.round((w.resolved / total) * 100) : 0
        const progress = total ? Math.round((w.review / total) * 100) : 0
        const open = total ? Math.round((w.open / total) * 100) : 0
        return {
          name: `Ward ${num}`,
          total: `${w.total} issue${w.total !== 1 ? "s" : ""}`,
          resolved,
          progress,
          open,
          rCount: w.resolved,
          pCount: w.review,
          oCount: w.open,
        }
      })
      .filter((w) => w.rCount + w.pCount + w.oCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .slice(0, 8)
  }, [wardReports])

  useEffect(() => {
    const el = homeRef.current
    if (!el) return

    const reveals = el.querySelectorAll<HTMLElement>('.hm-reveal')
    if ('IntersectionObserver' in window && reveals.length) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement
              const idx = Array.prototype.indexOf.call(reveals, target)
              target.style.transitionDelay = idx * 0.06 + 's'
              target.classList.add('hm-visible')
              obs.unobserve(target)
            }
          })
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      )
      reveals.forEach((el) => obs.observe(el))
    } else {
      reveals.forEach((el) => el.classList.add('hm-visible'))
    }

    const counters = el.querySelectorAll<HTMLElement>('.hm-impact-number[data-target]')
    if (counters.length && 'IntersectionObserver' in window) {
      const counterObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement
              const target = parseInt(el.dataset.target || '0', 10)
              const duration = 1500
              const start = performance.now()
              function update(now: number) {
                const elapsed = now - start
                const progress = Math.min(elapsed / duration, 1)
                el.textContent = Math.floor(progress * target).toString()
                if (progress < 1) requestAnimationFrame(update)
              }
              requestAnimationFrame(update)
              counterObs.unobserve(el)
            }
          })
        },
        { threshold: 0.3 }
      )
      counters.forEach((el) => counterObs.observe(el))
    }
  }, [])

  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="feed-panel">
          <div id="homeView" className="home-view" ref={homeRef}>
            <div className="home-inner">

              <section className="hm-hero">
                <div className="hm-hero-bg"></div>
                <div className="hm-hero-body">
                  <div className="hm-badge" data-i18n="hero.badge">नागरिक आवाज — CivicVoice</div>
                  <h1 className="hm-title" data-i18n="hero.heading">Report Local Issues.<br /><span>Track Their Progress.</span></h1>
                  <p className="hm-desc" data-i18n="hero.desc">Small actions create better neighbourhoods. Snap a photo, report an issue, and follow up with your ward office — all in one place.</p>
                  <div className="hm-actions">
                    <Link href="/submit-report" className="hm-btn hm-btn-primary" id="homeReportBtn" data-i18n="hero.reportBtn">Report an Issue</Link>
                    <Link href="/community-feed" className="hm-btn hm-btn-secondary" id="homeExploreBtn" data-i18n="hero.exploreBtn">
                      Explore Community Feed <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </Link>
                  </div>
                </div>
              </section>

              <section className="hm-impact hm-reveal">
                <div className="hm-impact-grid">
                  <div className="hm-impact-stat">
                    <div className="hm-impact-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    </div>
                    <div>
                      <div className="hm-impact-number" data-target="1250">0</div>
                      <div className="hm-impact-label" data-i18n="stat.issuesReported">Issues Reported</div>
                      <div className="hm-impact-desc" data-i18n="stat.issuesReported.desc">from potholes to water leaks</div>
                    </div>
                  </div>
                  <div className="hm-impact-stat">
                    <div className="hm-impact-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    </div>
                    <div>
                      <div className="hm-impact-number" data-target="850">0</div>
                      <div className="hm-impact-label" data-i18n="stat.issuesResolved">Issues Resolved</div>
                      <div className="hm-impact-desc" data-i18n="stat.issuesResolved.desc">track record of action</div>
                    </div>
                  </div>
                  <div className="hm-impact-stat">
                    <div className="hm-impact-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </div>
                    <div>
                      <div className="hm-impact-number">32</div>
                      <div className="hm-impact-label" data-i18n="stat.wardsCovered">Wards Covered</div>
                      <div className="hm-impact-desc" data-i18n="stat.wardsCovered.desc">across Kathmandu valley</div>
                    </div>
                  </div>
                  <div className="hm-impact-stat">
                    <div className="hm-impact-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div>
                      <div className="hm-impact-number" data-target="5000">0</div>
                      <div className="hm-impact-label" data-i18n="stat.communityMembers">Community Members</div>
                      <div className="hm-impact-desc" data-i18n="stat.communityMembers.desc">neighbours helping neighbours</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="hm-reports hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.recentReports">Recent Community Reports</h2>
                  <Link href="/community-feed" className="hm-sec-link" id="homeViewAllLink" data-i18n="home.viewAll">View All <span>&rarr;</span></Link>
                </div>
                <div className="hm-report-grid">
                  {reportsLoading ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-muted)', padding: 40, fontSize: 14 }}>Loading reports...</p>
                  ) : recentReports.length === 0 ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-muted)', padding: 40, fontSize: 14 }}>No reports yet.</p>
                  ) : (
                    recentReports.filter((r) => r.images?.length > 0 || r.videos?.length > 0).map((r) => (
                      <Link key={r.id} href={`/report-details/${r.id}`} className="hm-report-link">
                        <article className="hm-report">
                          <div className="hm-report-img">
                            {r.images?.length ? (
                              <img src={r.images[0].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                            ) : null}
                          </div>
                          <div className="hm-report-body">
                            <div className="hm-report-meta">
                              <span className="hm-report-cat">{r.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                              <span className="hm-report-status" data-status={r.status}>{r.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                            </div>
                            <h3 className="hm-report-title">{r.title}</h3>
                            <div className="hm-report-info">
                              <span><i className="fa-solid fa-location-dot"></i> {r.municipality}</span>
                              <span><i className="fa-solid fa-building"></i> Ward {r.ward_number}</span>
                              <span><i className="fa-solid fa-calendar"></i> {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span><i className="fa-solid fa-thumbs-up"></i> {r.total_upvotes}</span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <section className="hm-wards hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.wardActivity">Ward-wise Activity</h2>
                  <Link href="/wards" className="hm-sec-link" data-i18n="home.viewAllWards">View All Wards <span>&rarr;</span></Link>
                </div>
                <div className="hm-ward-grid">
                  {wardLoading ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-muted)', padding: 20, fontSize: 14 }}>Loading ward data...</p>
                  ) : wardStats.length === 0 ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-muted)', padding: 20, fontSize: 14 }}>No ward data yet.</p>
                  ) : (
                    wardStats.map((w) => (
                      <div key={w.name} className="hm-ward-card">
                        <div className="hm-ward-top"><span className="hm-ward-name">{w.name}</span><span className="hm-ward-total">{w.total}</span></div>
                        <div className="hm-ward-strip">
                          <span className="hm-ward-bar hm-ward-bar-resolved" style={{ width: w.resolved + '%' }}></span>
                          <span className="hm-ward-bar hm-ward-bar-progress" style={{ width: w.progress + '%' }}></span>
                          <span className="hm-ward-bar hm-ward-bar-open" style={{ width: w.open + '%' }}></span>
                        </div>
                        <div className="hm-ward-breakdown">
                          <span className="hm-ward-break-item"><span className="hm-break-dot hm-dot-resolved"></span>{w.rCount} Resolved</span>
                          <span className="hm-ward-break-item"><span className="hm-break-dot hm-dot-progress"></span>{w.pCount} Active</span>
                          <span className="hm-ward-break-item"><span className="hm-break-dot hm-dot-open"></span>{w.oCount} Open</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="hm-works hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.howItWorks">How It Works</h2>
                </div>
                <div className="hm-steps">
                  <div className="hm-step">
                    <div className="hm-step-icon">📝</div>
                    <h3 className="hm-step-title" data-i18n="hiw.step1.title">Report an Issue</h3>
                    <p className="hm-step-desc" data-i18n="hiw.step1.desc">Snap a photo, pin the location, describe what's wrong.</p>
                  </div>
                  <div className="hm-step">
                    <div className="hm-step-icon">👥</div>
                    <h3 className="hm-step-title" data-i18n="hiw.step2.title">Community Verification</h3>
                    <p className="hm-step-desc" data-i18n="hiw.step2.desc">Neighbours verify and upvote reports to prioritise what matters.</p>
                  </div>
                  <div className="hm-step">
                    <div className="hm-step-icon"><i className="fa-solid fa-building"></i></div>
                    <h3 className="hm-step-title" data-i18n="hiw.step3.title">Official Review</h3>
                    <p className="hm-step-desc" data-i18n="hiw.step3.desc">Your ward office reviews, assigns a team, and posts updates.</p>
                  </div>
                  <div className="hm-step">
                    <div className="hm-step-icon"><i className="fa-solid fa-check"></i></div>
                    <h3 className="hm-step-title" data-i18n="hiw.step4.title">Resolution</h3>
                    <p className="hm-step-desc" data-i18n="hiw.step4.desc">Issue resolved and closed — publicly visible for accountability.</p>
                  </div>
                </div>
              </section>

              <section className="hm-guide hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.howToReport">How to Report an Issue</h2>
                </div>
                <div className="hm-guide-grid">
                  <div className="hm-guide-step">
                    <span className="hm-guide-num">1</span>
                    <div className="hm-guide-body">
                      <span className="hm-guide-icon">📸</span>
                      <h3 className="hm-guide-title" data-i18n="hiw.step1.title">Capture Evidence</h3>
                      <p className="hm-guide-desc">Take clear photos or a short video of the issue. Good evidence helps ward officials assess the problem quickly.</p>
                    </div>
                  </div>
                  <div className="hm-guide-step">
                    <span className="hm-guide-num">2</span>
                    <div className="hm-guide-body">
                      <span className="hm-guide-icon"><i className="fa-solid fa-location-dot"></i></span>
                      <h3 className="hm-guide-title" data-i18n="hiw.step2.title">Pin the Location</h3>
                      <p className="hm-guide-desc">Use the interactive map to mark the exact spot. Include a nearby landmark or street name for reference.</p>
                    </div>
                  </div>
                  <div className="hm-guide-step">
                    <span className="hm-guide-num">3</span>
                    <div className="hm-guide-body">
                      <span className="hm-guide-icon">📝</span>
                      <h3 className="hm-guide-title" data-i18n="hiw.step3.title">Describe the Issue</h3>
                      <p className="hm-guide-desc">Select a category, set the priority level, and add a brief description. Be specific about the problem and its impact.</p>
                    </div>
                  </div>
                  <div className="hm-guide-step">
                    <span className="hm-guide-num">4</span>
                    <div className="hm-guide-body">
                      <span className="hm-guide-icon">📨</span>
                      <h3 className="hm-guide-title" data-i18n="hiw.step4.title">Submit Report</h3>
                      <p className="hm-guide-desc">Review your report and submit. It is sent directly to your ward office and appears in the community feed.</p>
                    </div>
                  </div>
                  <div className="hm-guide-step">
                    <span className="hm-guide-num">5</span>
                    <div className="hm-guide-body">
                      <span className="hm-guide-icon">🔔</span>
                      <h3 className="hm-guide-title" data-i18n="hiw.step5.title">Track Progress</h3>
                      <p className="hm-guide-desc">Get notified when your report is reviewed, assigned, or resolved. You can follow updates in real time.</p>
                    </div>
                  </div>
                </div>
                <div className="hm-guide-cta">
                  <Link href="/submit-report" className="hm-btn hm-btn-primary" id="homeReportBtn2" data-i18n="btn.startReport">Start a Report Now</Link>
                </div>
              </section>

              <section className="hm-cats hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.browseCategory">Browse by Category</h2>
                </div>
                <div className="hm-cat-grid">
                  {[
                    { cat: "road", icon: <i className="fa-solid fa-road"></i>, label: "Road Damage" },
                    { cat: "streetlight", icon: "💡", label: "Street Lights" },
                    { cat: "waste", icon: <i className="fa-solid fa-trash"></i>, label: "Waste Management" },
                    { cat: "water", icon: "🚰", label: "Water Supply" },
                    { cat: "traffic", icon: "🚦", label: "Traffic" },
                    { cat: "environment", icon: "🌳", label: "Environment" },
                    { cat: "health", icon: "🏥", label: "Public Health" },
                    { cat: "infrastructure", icon: "🏢", label: "Infrastructure" },
                    { cat: "safety", icon: "🚨", label: "Public Safety" },
                    { cat: "other", icon: "📌", label: "Others" },
                  ].map((c) => (
                    <Link
                      key={c.cat}
                      href={"/community-feed?category=" + c.cat}
                      className="hm-cat-card"
                      data-cat={c.cat}
                    >
                      <span className="hm-cat-icon">{c.icon}</span>
                      <span className="hm-cat-name" data-i18n={"cat." + c.cat}>{c.label}</span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="hm-mission hm-reveal">
                <div className="hm-mission-inner">
                  <div className="hm-mission-left">
                    <div className="hm-mission-tag" data-i18n="home.mission">Our Mission</div>
                    <h2 className="hm-mission-title" data-i18n="home.mission.heading">Making Kathmandu<br />more responsive,<br /><span>one report at a time</span></h2>
                  </div>
                  <div className="hm-mission-right">
                    <p className="hm-mission-text">CivicVoice connects residents with their ward offices to report, track, and resolve community issues. Every report is publicly trackable, every ward office is held accountable, and every neighbour can contribute.</p>
                    <div className="hm-mission-principles">
                      <div className="hm-mission-principle">
                        <span className="hm-mission-principle-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
                        <span>Transparency — every report publicly trackable</span>
                      </div>
                      <div className="hm-mission-principle">
                        <span className="hm-mission-principle-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
                        <span>Accountability — clear response timelines for ward offices</span>
                      </div>
                      <div className="hm-mission-principle">
                        <span className="hm-mission-principle-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
                        <span>Community — neighbours prioritising what affects everyone</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="hm-notices hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.notices">Official Notices</h2>
                  <Link href="/notices" className="hm-sec-link" data-i18n="btn.viewAllNotices">View All Notices <span>&rarr;</span></Link>
                </div>
                <div className="hm-notice-list">
                  {noticesLoading ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 16, fontSize: 14 }}>Loading notices...</p>
                  ) : notices.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 16, fontSize: 14 }}>No notices yet.</p>
                  ) : (
                    notices.slice(0, 4).map((n: any) => (
                      <div key={n.id} className="hm-notice">
                        <div>
                          <div className="hm-notice-title">{n.title}</div>
                          <div className="hm-notice-date">
                            {n.created_at
                              ? (() => {
                                  const days = Math.floor((Date.now() - new Date(n.created_at).getTime()) / 86400000)
                                  return days === 0 ? "Posted today" : days === 1 ? "Posted 1 day ago" : `Posted ${days} days ago`
                                })()
                              : ""}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="hm-map-cta hm-reveal">
                <div className="hm-map-body">
                  <h2 className="hm-map-title" data-i18n="home.exploreMap">See what's happening around you</h2>
                  <p className="hm-map-desc">Browse live reports across all 32 wards of Kathmandu. Zoom in to see issues near your neighbourhood.</p>
                  <Link href="/explore-map" className="hm-btn hm-btn-primary" id="homeMapBtn" data-i18n="btn.openMap">
                    Open Map <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </div>
                <div className="hm-map-preview">
                  <svg viewBox="0 0 200 120" fill="none" width="100%" height="100%"><rect width="200" height="120" rx="8" fill="var(--color-pill-bg)" /><circle cx="60" cy="45" r="4" fill="var(--color-primary)" opacity="0.7" /><circle cx="130" cy="55" r="5" fill="var(--color-accent)" opacity="0.7" /><circle cx="90" cy="80" r="3" fill="var(--color-primary)" opacity="0.6" /><circle cx="150" cy="35" r="4" fill="var(--color-primary)" opacity="0.7" /><circle cx="40" cy="70" r="3" fill="var(--color-accent)" opacity="0.5" /><circle cx="110" cy="95" r="4" fill="var(--color-primary)" opacity="0.6" /><circle cx="170" cy="75" r="3" fill="var(--color-accent)" opacity="0.5" /><rect x="50" y="28" width="20" height="14" rx="2" fill="none" stroke="var(--color-primary)" strokeWidth="0.8" opacity="0.5" /><text x="60" y="38" fill="var(--color-muted)" fontSize="5" textAnchor="middle" opacity="0.7">Your area</text></svg>
                </div>
              </section>

              <section className="hm-emergency hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.emergency">Emergency Contacts</h2>
                </div>
                <div className="hm-em-list">
                  <div className="hm-em-row"><span className="hm-em-name">Police</span><span className="hm-em-detail">100</span><span className="hm-em-detail">emergency@nepalpolice.gov.np</span><a href="https://www.nepalpolice.gov.np" className="hm-em-link" target="_blank" rel="noopener">nepalpolice.gov.np</a></div>
                  <div className="hm-em-row"><span className="hm-em-name">Fire Brigade</span><span className="hm-em-detail">101</span><span className="hm-em-detail">—</span><span className="hm-em-detail">—</span></div>
                  <div className="hm-em-row"><span className="hm-em-name">Ambulance</span><span className="hm-em-detail">102</span><span className="hm-em-detail">—</span><span className="hm-em-detail">—</span></div>
                  <div className="hm-em-row"><span className="hm-em-name">Electricity</span><span className="hm-em-detail">1150</span><span className="hm-em-detail">info@nea.org.np</span><a href="https://www.nea.org.np" className="hm-em-link" target="_blank" rel="noopener">nea.org.np</a></div>
                  <div className="hm-em-row"><span className="hm-em-name">Water Supply</span><span className="hm-em-detail">103</span><span className="hm-em-detail">info@kathmanduwater.org</span><a href="https://www.kathmanduwater.org" className="hm-em-link" target="_blank" rel="noopener">kathmanduwater.org</a></div>
                  <div className="hm-em-row"><span className="hm-em-name">Municipality</span><span className="hm-em-detail">145</span><span className="hm-em-detail">info@kathemun.gov.np</span><a href="https://www.kathemun.gov.np" className="hm-em-link" target="_blank" rel="noopener">kathemun.gov.np</a></div>
                  <div className="hm-em-row"><span className="hm-em-name">Women Helpline</span><span className="hm-em-detail">1145</span><span className="hm-em-detail">—</span><span className="hm-em-detail">—</span></div>
                  <div className="hm-em-row"><span className="hm-em-name">Child Helpline</span><span className="hm-em-detail">1098</span><span className="hm-em-detail">—</span><span className="hm-em-detail">—</span></div>
                  <div className="hm-em-row"><span className="hm-em-name">Disaster Hotline</span><span className="hm-em-detail">1199</span><span className="hm-em-detail">—</span><span className="hm-em-detail">—</span></div>
                </div>
              </section>

              <section className="hm-faq hm-reveal">
                <div className="hm-sec-header">
                  <h2 className="hm-sec-title" data-i18n="home.faq">Common Questions</h2>
                </div>
                <div className="hm-faq-list">
                  <details className="hm-faq-item">
                    <summary className="hm-faq-q">How do I report something in my ward?</summary>
                    <div className="hm-faq-a">Hit &quot;Report an Issue&quot; from the sidebar or homepage. Snap a photo, drop a pin on the map, pick a category, and send. It goes straight to your ward office and shows up in the community feed.</div>
                  </details>
                  <details className="hm-faq-item">
                    <summary className="hm-faq-q">How long do issues usually take to fix?</summary>
                    <div className="hm-faq-a">Depends on what it is. A broken street light might get fixed in a few days. A damaged road can take weeks. Every report shows its status — Open, In Progress, or Resolved — so you always know where things stand.</div>
                  </details>
                  <details className="hm-faq-item">
                    <summary className="hm-faq-q">Can I report without giving my name?</summary>
                    <div className="hm-faq-a">Yes. Just check &quot;Report Anonymously&quot; when submitting. Your name stays hidden from other users. Ward officials will still be able to contact you if they need to follow up.</div>
                  </details>
                  <details className="hm-faq-item">
                    <summary className="hm-faq-q">How do I check what happened to my report?</summary>
                    <div className="hm-faq-a">Go to &quot;Submit Report&quot; and click &quot;View Your Reports.&quot; Every report shows its current status, and you will get notified when something changes.</div>
                  </details>
                  <details className="hm-faq-item">
                    <summary className="hm-faq-q">Who actually handles the reports?</summary>
                    <div className="hm-faq-a">Your ward office reviews and assigns each report to the right department. They handle the work and update the status so everyone can see the progress.</div>
                  </details>
                </div>
                <div className="hm-faq-cta">
                  <Link href="/faq" className="hm-faq-link" data-i18n="btn.moreQuestions">More Questions <span>&rarr;</span></Link>
                </div>
              </section>

              <div className="sv-footer hm-reveal">
                <Link href="/about" data-i18n="footer.about">About</Link> &middot; <Link href="/contact" data-i18n="footer.contact">Contact</Link> &middot; <Link href="/faq" data-i18n="footer.faq">FAQ</Link> &middot; <Link href="/privacy-policy" data-i18n="footer.privacy">Privacy Policy</Link> &middot; <Link href="/terms" data-i18n="footer.terms">Terms &amp; Conditions</Link>
                <br /><br />
                &copy; 2026 CivicVoice
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  )
}
