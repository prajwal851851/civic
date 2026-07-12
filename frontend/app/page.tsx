'use client'

import { useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { getFeed } from "@/lib/api/reports"
import type { FeedReport } from "@/lib/api/reports"
import { getNotices } from "@/lib/api/notices"

const HERO_PHOTO_MAIN = "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=80&auto=format&fit=crop"
const HERO_PHOTO_SMALL = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=640&q=80&auto=format&fit=crop"
const MISSION_PHOTO = "https://images.unsplash.com/photo-1611516491426-03025e6043c8?w=1000&q=80&auto=format&fit=crop"

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function catLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

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
        const result = await getFeed({ page_size: 4 })
        if (!cancelled) setRecentReports((result.results ?? []).slice(0, 4))
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
          total: w.total,
          resolved,
          progress,
          open,
          rCount: w.resolved,
          pCount: w.review,
          oCount: w.open,
        }
      })
      .filter((w) => w.rCount + w.pCount + w.oCount > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
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
              target.style.transitionDelay = (idx % 4) * 0.07 + 's'
              target.classList.add('hm-visible')
              obs.unobserve(target)
            }
          })
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
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
              const duration = 1600
              const start = performance.now()
              function update(now: number) {
                const elapsed = now - start
                const progress = Math.min(elapsed / duration, 1)
                const eased = 1 - Math.pow(1 - progress, 3)
                el.textContent = Math.floor(eased * target).toLocaleString()
                if (progress < 1) requestAnimationFrame(update)
                else el.textContent = target.toLocaleString()
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

  const featured =
    recentReports.find((r) => (r.images?.length ?? 0) > 0) ?? recentReports[0]
  const restReports = recentReports.filter((r) => r.id !== featured?.id).slice(0, 3)

  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="feed-panel">
          <div id="homeView" className="home-view" ref={homeRef}>
            <div className="ed-page">

              {/* ── Hero ─────────────────────────────── */}
              <section className="ed-hero">
                <span className="ed-hero-ghost" aria-hidden="true">आवाज</span>
                <div className="ed-hero-copy">
                  <p className="ed-kicker">नागरिक आवाज &mdash; the civic record of Kathmandu</p>
                  <h1 className="ed-hero-title">
                    Your street has a&nbsp;voice.
                    <em> Put it on the&nbsp;record.</em>
                  </h1>
                  <p className="ed-hero-lede">
                    A pothole, a dead street light, a leaking main &mdash; photograph it,
                    pin it, and send it straight to your ward office. Every report stays
                    public until it&rsquo;s fixed.
                  </p>
                  <div className="ed-hero-actions">
                    <Link href="/submit-report" className="ed-btn ed-btn-cta" id="homeReportBtn">
                      Report an issue
                    </Link>
                    <Link href="/community-feed" className="ed-linkline" id="homeExploreBtn">
                      Browse the public ledger
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </Link>
                  </div>
                </div>
                <div className="ed-hero-visual" aria-hidden="true">
                  <figure className="ed-hero-photo-main">
                    <img src={HERO_PHOTO_MAIN} alt="Aerial view of Kathmandu around Boudhanath stupa" loading="eager" />
                  </figure>
                  <figure className="ed-hero-photo-small">
                    <img src={HERO_PHOTO_SMALL} alt="Swayambhunath stupa with prayer flags, Kathmandu" loading="lazy" />
                  </figure>
                  {featured && (
                    <Link href={`/report-details/${featured.id}`} className="ed-hero-ticket">
                      {featured.images?.length > 0 && (
                        <span className="ed-ticket-photo">
                          <img src={featured.images[0].image} alt="" loading="lazy" />
                        </span>
                      )}
                      <span className="ed-ticket-tag">Latest report</span>
                      <span className="ed-ticket-title">{featured.title}</span>
                      <span className="ed-ticket-meta">
                        Ward {featured.ward_number} &middot; <b data-status={featured.status}>{statusLabel(featured.status)}</b>
                      </span>
                    </Link>
                  )}
                </div>
              </section>

              {/* ── Stat strip ───────────────────────── */}
              <section className="ed-stats hm-reveal" aria-label="Platform statistics">
                <div className="ed-stat">
                  <span className="hm-impact-number ed-stat-num" data-target="1250">0</span>
                  <span className="ed-stat-label">issues reported<br />across the valley</span>
                </div>
                <div className="ed-stat">
                  <span className="hm-impact-number ed-stat-num" data-target="850">0</span>
                  <span className="ed-stat-label">resolved &mdash;<br />on the public record</span>
                </div>
                <div className="ed-stat">
                  <span className="ed-stat-num">32</span>
                  <span className="ed-stat-label">wards covered,<br />Kathmandu metro</span>
                </div>
                <div className="ed-stat">
                  <span className="hm-impact-number ed-stat-num" data-target="5000">0</span>
                  <span className="ed-stat-label">neighbours watching<br />&amp; upvoting</span>
                </div>
              </section>

              {/* ── Live dispatches ──────────────────── */}
              <section className="ed-section hm-reveal">
                <header className="ed-sec-head">
                  <span className="ed-sec-index">01</span>
                  <h2 className="ed-sec-title">Live from the wards</h2>
                  <Link href="/community-feed" className="ed-linkline ed-sec-more" id="homeViewAllLink">
                    All reports
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </header>

                {reportsLoading ? (
                  <p className="ed-muted-note">Loading reports&hellip;</p>
                ) : !featured ? (
                  <p className="ed-muted-note">No reports yet. Be the first to file one.</p>
                ) : (
                  <>
                    <Link href={`/report-details/${featured.id}`} className="ed-feature">
                      <figure className="ed-feature-media">
                        {featured.images?.length ? (
                          <img src={featured.images[0].image} alt="" loading="lazy" />
                        ) : (
                          <span className="ed-media-fallback"><i className="fa-solid fa-clipboard-list"></i></span>
                        )}
                        <span className="ed-stamp" data-status={featured.status}>{statusLabel(featured.status)}</span>
                      </figure>
                      <div className="ed-feature-body">
                        <span className="ed-eyebrow">{catLabel(featured.category)} &middot; Ward {featured.ward_number}</span>
                        <h3 className="ed-feature-title">{featured.title}</h3>
                        <span className="ed-feature-meta">
                          {featured.municipality} &middot; {new Date(featured.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} &middot; {featured.total_upvotes} upvote{featured.total_upvotes === 1 ? '' : 's'}
                        </span>
                      </div>
                    </Link>

                    <div className="ed-dispatch-rows">
                      {restReports.map((r, i) => (
                        <Link key={r.id} href={`/report-details/${r.id}`} className="ed-dispatch-row">
                          <span className="ed-dispatch-num">{String(i + 2).padStart(2, '0')}</span>
                          <span className="ed-dispatch-main">
                            <span className="ed-dispatch-title">{r.title}</span>
                            <span className="ed-dispatch-meta">{catLabel(r.category)} &middot; Ward {r.ward_number} &middot; {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                          <span className="ed-stamp ed-stamp-inline" data-status={r.status}>{statusLabel(r.status)}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* ── How it works ─────────────────────── */}
              <section className="ed-section ed-how hm-reveal">
                <div className="ed-how-intro">
                  <header className="ed-sec-head ed-sec-head-bare">
                    <span className="ed-sec-index">02</span>
                    <h2 className="ed-sec-title">From complaint<br />to closed case</h2>
                  </header>
                  <p className="ed-how-lede">
                    No forms in triplicate, no office queues. A report filed from your
                    phone follows the same path every time &mdash; and you can watch it move.
                  </p>
                  <Link href="/submit-report" className="ed-btn ed-btn-cta" id="homeReportBtn2">Start a report</Link>
                </div>
                <ol className="ed-how-steps">
                  <li className="ed-how-step">
                    <span className="ed-how-num" aria-hidden="true">1</span>
                    <div>
                      <h3>Capture the evidence</h3>
                      <p>Photograph or film the problem. Clear evidence is what gets an assessment moving quickly.</p>
                    </div>
                  </li>
                  <li className="ed-how-step">
                    <span className="ed-how-num" aria-hidden="true">2</span>
                    <div>
                      <h3>Pin it on the map</h3>
                      <p>Drop a pin on the exact spot and add a landmark, so the crew doesn&rsquo;t search the whole street.</p>
                    </div>
                  </li>
                  <li className="ed-how-step">
                    <span className="ed-how-num" aria-hidden="true">3</span>
                    <div>
                      <h3>Neighbours weigh in</h3>
                      <p>People nearby verify and upvote. The loudest problems rise to the top of the ward&rsquo;s queue.</p>
                    </div>
                  </li>
                  <li className="ed-how-step">
                    <span className="ed-how-num" aria-hidden="true">4</span>
                    <div>
                      <h3>The ward answers</h3>
                      <p>Officials review, assign a team, and post updates until the issue is marked resolved &mdash; in public.</p>
                    </div>
                  </li>
                </ol>
              </section>

              {/* ── Ward ledger ──────────────────────── */}
              <section className="ed-section hm-reveal">
                <header className="ed-sec-head">
                  <span className="ed-sec-index">03</span>
                  <h2 className="ed-sec-title">The ward ledger</h2>
                  <Link href="/wards" className="ed-linkline ed-sec-more">
                    All 32 wards
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </header>
                <p className="ed-sec-sub">Most active wards, ranked by open case files.</p>
                {wardLoading ? (
                  <p className="ed-muted-note">Loading ward data&hellip;</p>
                ) : wardStats.length === 0 ? (
                  <p className="ed-muted-note">No ward data yet.</p>
                ) : (
                  <div className="ed-ledger">
                    {wardStats.map((w) => (
                      <div key={w.name} className="ed-ledger-row">
                        <span className="ed-ledger-ward">{w.name}</span>
                        <span className="ed-ledger-strip" aria-hidden="true">
                          <span className="ed-strip-resolved" style={{ width: w.resolved + '%' }}></span>
                          <span className="ed-strip-progress" style={{ width: w.progress + '%' }}></span>
                          <span className="ed-strip-open" style={{ width: w.open + '%' }}></span>
                        </span>
                        <span className="ed-ledger-counts">
                          <b>{w.total}</b> filed &middot; {w.rCount} resolved &middot; {w.pCount} active &middot; {w.oCount} open
                        </span>
                      </div>
                    ))}
                    <div className="ed-ledger-key">
                      <span><i className="ed-key-dot ed-strip-resolved"></i>Resolved</span>
                      <span><i className="ed-key-dot ed-strip-progress"></i>In review</span>
                      <span><i className="ed-key-dot ed-strip-open"></i>Open</span>
                    </div>
                  </div>
                )}
              </section>

              {/* ── Categories ───────────────────────── */}
              <section className="ed-section hm-reveal">
                <header className="ed-sec-head">
                  <span className="ed-sec-index">04</span>
                  <h2 className="ed-sec-title">What&rsquo;s bothering your block?</h2>
                </header>
                <div className="ed-cats">
                  {[
                    { cat: "road", label: "Road damage" },
                    { cat: "streetlight", label: "Street lights" },
                    { cat: "waste", label: "Waste & garbage" },
                    { cat: "water", label: "Water supply" },
                    { cat: "traffic", label: "Traffic" },
                    { cat: "environment", label: "Environment" },
                    { cat: "health", label: "Public health" },
                    { cat: "infrastructure", label: "Infrastructure" },
                    { cat: "safety", label: "Public safety" },
                    { cat: "other", label: "Everything else" },
                  ].map((c) => (
                    <Link key={c.cat} href={"/community-feed?category=" + c.cat} className="ed-cat-chip" data-cat={c.cat}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </section>

              {/* ── Mission panel ────────────────────── */}
              <section className="ed-mission hm-reveal">
                <figure className="ed-mission-photo" aria-hidden="true">
                  <img src={MISSION_PHOTO} alt="" loading="lazy" />
                </figure>
                <div className="ed-mission-body">
                  <p className="ed-kicker ed-kicker-light">Why this exists</p>
                  <h2 className="ed-mission-title">
                    A city fixes what
                    <em> its people can see.</em>
                  </h2>
                  <p className="ed-mission-text">
                    CivicVoice keeps every report, every response, and every delay in
                    plain view. Residents get a direct line to their ward office;
                    ward offices get a public track record worth defending.
                  </p>
                  <ul className="ed-mission-list">
                    <li>Every report publicly trackable, start to finish</li>
                    <li>Clear response timelines ward offices answer to</li>
                    <li>Neighbours decide what matters most, together</li>
                  </ul>
                </div>
              </section>

              {/* ── Noticeboard + map ────────────────── */}
              <section className="ed-section ed-board hm-reveal">
                <div className="ed-board-notices">
                  <header className="ed-sec-head ed-sec-head-bare">
                    <span className="ed-sec-index">05</span>
                    <h2 className="ed-sec-title">On the noticeboard</h2>
                  </header>
                  {noticesLoading ? (
                    <p className="ed-muted-note">Loading notices&hellip;</p>
                  ) : notices.length === 0 ? (
                    <p className="ed-muted-note">No notices yet.</p>
                  ) : (
                    <ul className="ed-notice-list">
                      {notices.slice(0, 4).map((n: any) => (
                        <li key={n.id} className="ed-notice">
                          <span className="ed-notice-title">{n.title}</span>
                          <span className="ed-notice-date">
                            {n.created_at
                              ? (() => {
                                  const days = Math.floor((Date.now() - new Date(n.created_at).getTime()) / 86400000)
                                  return days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`
                                })()
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/notices" className="ed-linkline">
                    All official notices
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </div>
                <Link href="/explore-map" className="ed-board-map" id="homeMapBtn">
                  <div className="ed-board-map-art" aria-hidden="true">
                    <svg viewBox="0 0 200 120" fill="none" width="100%" height="100%">
                      <circle cx="60" cy="45" r="4" fill="currentColor" opacity="0.85" />
                      <circle cx="130" cy="55" r="5" fill="currentColor" opacity="0.6" />
                      <circle cx="90" cy="80" r="3" fill="currentColor" opacity="0.5" />
                      <circle cx="150" cy="35" r="4" fill="currentColor" opacity="0.7" />
                      <circle cx="40" cy="70" r="3" fill="currentColor" opacity="0.45" />
                      <circle cx="110" cy="95" r="4" fill="currentColor" opacity="0.55" />
                      <circle cx="170" cy="75" r="3" fill="currentColor" opacity="0.4" />
                      <path d="M20 30 L80 20 L120 40 L180 28" stroke="currentColor" strokeWidth="0.7" opacity="0.35" />
                      <path d="M15 90 L70 70 L140 85 L190 65" stroke="currentColor" strokeWidth="0.7" opacity="0.35" />
                    </svg>
                  </div>
                  <div className="ed-board-map-body">
                    <h3>See what&rsquo;s happening around you</h3>
                    <p>Live reports across all 32 wards, on one map.</p>
                    <span className="ed-linkline ed-linkline-light">
                      Open the map
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                  </div>
                </Link>
              </section>

              {/* ── Emergency contacts ───────────────── */}
              <section className="ed-section hm-reveal">
                <header className="ed-sec-head">
                  <span className="ed-sec-index">06</span>
                  <h2 className="ed-sec-title">When it can&rsquo;t wait</h2>
                </header>
                <p className="ed-sec-sub">For emergencies, skip the app and call directly.</p>
                <div className="ed-em-table">
                  {[
                    { name: "Police", num: "100", mail: "emergency@nepalpolice.gov.np", url: "https://www.nepalpolice.gov.np", site: "nepalpolice.gov.np" },
                    { name: "Fire Brigade", num: "101" },
                    { name: "Ambulance", num: "102" },
                    { name: "Electricity (NEA)", num: "1150", mail: "info@nea.org.np", url: "https://www.nea.org.np", site: "nea.org.np" },
                    { name: "Water Supply", num: "103", mail: "info@kathmanduwater.org", url: "https://www.kathmanduwater.org", site: "kathmanduwater.org" },
                    { name: "Municipality", num: "145", mail: "info@kathemun.gov.np", url: "https://www.kathemun.gov.np", site: "kathemun.gov.np" },
                    { name: "Women Helpline", num: "1145" },
                    { name: "Child Helpline", num: "1098" },
                    { name: "Disaster Hotline", num: "1199" },
                  ].map((e) => (
                    <div key={e.name} className="ed-em-row">
                      <span className="ed-em-name">{e.name}</span>
                      <span className="ed-em-num">{e.num}</span>
                      <span className="ed-em-extra">
                        {e.mail ?? ""}
                        {e.url && (
                          <>
                            {e.mail ? " · " : ""}
                            <a href={e.url} target="_blank" rel="noopener">{e.site}</a>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── FAQ ──────────────────────────────── */}
              <section className="ed-section hm-reveal">
                <header className="ed-sec-head">
                  <span className="ed-sec-index">07</span>
                  <h2 className="ed-sec-title">Fair questions</h2>
                </header>
                <div className="ed-faq">
                  <details className="ed-faq-item">
                    <summary>How do I report something in my ward?</summary>
                    <div className="ed-faq-a">Hit &ldquo;Report an issue&rdquo; from the sidebar or this page. Snap a photo, drop a pin on the map, pick a category, and send. It goes straight to your ward office and shows up in the community feed.</div>
                  </details>
                  <details className="ed-faq-item">
                    <summary>How long do issues usually take to fix?</summary>
                    <div className="ed-faq-a">Depends on what it is. A broken street light might get fixed in a few days; a damaged road can take weeks. Every report shows its status &mdash; open, in review, or resolved &mdash; so you always know where things stand.</div>
                  </details>
                  <details className="ed-faq-item">
                    <summary>Can I report without giving my name?</summary>
                    <div className="ed-faq-a">Yes. Check &ldquo;Report anonymously&rdquo; when submitting. Your name stays hidden from other users; ward officials can still reach you if they need to follow up.</div>
                  </details>
                  <details className="ed-faq-item">
                    <summary>How do I check what happened to my report?</summary>
                    <div className="ed-faq-a">Open &ldquo;Submit Report&rdquo; and choose &ldquo;View your reports.&rdquo; Every report shows its current status, and you get notified the moment it changes.</div>
                  </details>
                  <details className="ed-faq-item">
                    <summary>Who actually handles the reports?</summary>
                    <div className="ed-faq-a">Your ward office. They review each report, assign it to the right department, and update the status so everyone can see the progress.</div>
                  </details>
                </div>
                <Link href="/faq" className="ed-linkline ed-faq-more">
                  More questions answered
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
              </section>

              {/* ── Footer ───────────────────────────── */}
              <footer className="ed-footer hm-reveal">
                <span className="ed-footer-mark">नागरिक आवाज</span>
                <nav className="ed-footer-nav">
                  <Link href="/about">About</Link>
                  <Link href="/contact">Contact</Link>
                  <Link href="/faq">FAQ</Link>
                  <Link href="/privacy-policy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                </nav>
                <span className="ed-footer-copy">&copy; 2026 CivicVoice &mdash; Kathmandu</span>
              </footer>

            </div>
          </div>
        </main>
      </div>
    </>
  )
}
