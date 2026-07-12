"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { getFeed } from "@/lib/api/reports"
import type { FeedReport } from "@/lib/api/reports"

interface WardData {
  name: string
  total: string
  resolved: number
  review: number
  open: number
  rPct: number
  vPct: number
  oPct: number
  tags: string[]
}

const WARD_COUNT = 32

function computeWardData(reports: FeedReport[]): WardData[] {
  const map = new Map<number, { total: number; resolved: number; review: number; open: number; cats: Map<string, number> }>()

  for (let i = 1; i <= WARD_COUNT; i++) {
    map.set(i, { total: 0, resolved: 0, review: 0, open: 0, cats: new Map() })
  }

  for (const r of reports) {
    const w = map.get(r.ward_number)
    if (!w) continue
    w.total++
    if (r.status === "resolved") w.resolved++
    else if (r.status === "in_review") w.review++
    else if (r.status === "open") w.open++
    const catCount = w.cats.get(r.category) ?? 0
    w.cats.set(r.category, catCount + 1)
  }

  const result: WardData[] = []
  for (let i = 1; i <= WARD_COUNT; i++) {
    const w = map.get(i)!
    const total = w.total
    const rPct = total ? Math.round((w.resolved / total) * 100) : 0
    const vPct = total ? Math.round((w.review / total) * 100) : 0
    const oPct = total ? Math.round((w.open / total) * 100) : 0

    const sortedCats = [...w.cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    const tags = sortedCats.map(([cat]) =>
      cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    )

    result.push({
      name: `Ward ${i}`,
      total: total.toString(),
      resolved: w.resolved,
      review: w.review,
      open: w.open,
      rPct,
      vPct,
      oPct,
      tags,
    })
  }

  return result
}

type Category = "all" | "well-resolved" | "on-track" | "attention"

function classifyWard(w: WardData): Category {
  if (w.rPct >= 65) return "well-resolved"
  if (w.rPct >= 50) return "on-track"
  return "attention"
}

function WardRow({ w }: { w: WardData }) {
  return (
    <div className="ward-row">
      <div className="ward-body">
        <div className="ward-row-top">
          <span className="ward-name">{w.name}</span>
          <span className="ward-total"><strong>{w.total}</strong> issues</span>
        </div>
        <div className="ward-stats">
          <span><span className="num num--green">{w.resolved}</span> resolved</span>
          <span><span className="num num--amber">{w.review}</span> in review</span>
          <span><span className="num num--red">{w.open}</span> open</span>
        </div>
        <div className="ward-progress">
          <div className="ward-progress-inner">
            <div className="ward-progress-seg ward-progress-resolved" style={{ width: w.rPct + "%" }}></div>
            <div className="ward-progress-seg ward-progress-review" style={{ width: w.vPct + "%" }}></div>
            <div className="ward-progress-seg ward-progress-open" style={{ width: w.oPct + "%" }}></div>
          </div>
        </div>
        <div className="ward-bottom">
          <div className="ward-tags">
            {w.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <Link href="/community-feed" className="ward-view-link">
            <span>View Reports</span> <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function WardsPage() {
  const [allReports, setAllReports] = useState<FeedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<Category>("all")

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      try {
        const result = await getFeed({ page_size: 100 })
        if (!cancelled) setAllReports(result.results ?? [])
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  const allWards = useMemo(() => computeWardData(allReports), [allReports])

  const filtered = useMemo(() => {
    return allWards.filter((w) => {
      const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === "all" || classifyWard(w) === category
      return matchSearch && matchCat
    })
  }, [allWards, search, category])

  const sections = useMemo(() => {
    if (category !== "all") return [{ label: "Results", key: "results", wards: filtered, desc: "" }]
    return [{ label: "All Wards", key: "all", wards: filtered, desc: "" }]
  }, [filtered, category])

  const counts = useMemo(() => ({
    "well-resolved": allWards.filter((w) => classifyWard(w) === "well-resolved").length,
    "on-track": allWards.filter((w) => classifyWard(w) === "on-track").length,
    "attention": allWards.filter((w) => classifyWard(w) === "attention").length,
  }), [allWards])

  if (loading) {
    return (
      <div className="page-wrapper">
        <p style={{ textAlign: "center", color: "var(--color-muted)", padding: 40, fontSize: 14 }}>Loading ward data...</p>
      </div>
    )
  }

  return (
    <>
      <div className="page-wrapper">
        <h1>Ward-wise Activity</h1>
        <p className="subtitle">Breakdown of reported issues across all 32 wards of Kathmandu, categorised by resolution rate.</p>

        <div className="ward-filter-bar">
          <input
            type="text"
            placeholder="Search ward by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {([{ key: "all", label: "All" }, { key: "well-resolved", label: `Well Resolved (${counts["well-resolved"]})` }, { key: "on-track", label: `On Track (${counts["on-track"]})` }, { key: "attention", label: `Attention (${counts["attention"]})` }] as const).map(({ key, label }) => (
            <button
              key={key}
              className={"ward-filter-btn" + (category === key ? " active" : "")}
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {sections.map((sec) => (
          <div key={sec.key} className="ward-section">
            {category === "all" && (
              <>
                <div className="ward-section-head">
                  <h2 className="ward-section-title">{sec.label}</h2>
                </div>
              </>
            )}
            {sec.wards.map((w) => <WardRow key={w.name} w={w} />)}
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-muted)", padding: 40 }}>No wards match your filter.</p>
        )}
      </div>
    </>
  )
}
