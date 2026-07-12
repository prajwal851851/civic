import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Ward Activity — CivicVoice",
  description: "Detailed ward activity for Kathmandu wards.",
}

interface WardData {
  name: string; total: string; resolved: number; review: number; open: number
  rPct: number; vPct: number; oPct: number; tags: string[]
}

const wardsWellResolved: WardData[] = [
  { name: 'Ward 2', total: '14', resolved: 10, review: 2, open: 2, rPct: 71, vPct: 14, oPct: 14, tags: ['Water Supply', 'Waste Management'] },
  { name: 'Ward 3', total: '28', resolved: 20, review: 4, open: 4, rPct: 71, vPct: 14, oPct: 14, tags: ['Road Damage', 'Street Lighting'] },
  { name: 'Ward 6', total: '10', resolved: 8, review: 1, open: 1, rPct: 80, vPct: 10, oPct: 10, tags: ['Water Supply', 'Sanitation'] },
  { name: 'Ward 12', total: '10', resolved: 8, review: 1, open: 1, rPct: 80, vPct: 10, oPct: 10, tags: ['Street Lighting', 'Road Repair'] },
  { name: 'Ward 23', total: '3', resolved: 2, review: 1, open: 0, rPct: 67, vPct: 33, oPct: 0, tags: ['Waste Management'] },
  { name: 'Ward 25', total: '6', resolved: 4, review: 1, open: 1, rPct: 67, vPct: 17, oPct: 17, tags: ['Water Supply'] },
]

const wardsOnTrack: WardData[] = [
  { name: 'Ward 1', total: '20', resolved: 11, review: 5, open: 4, rPct: 55, vPct: 25, oPct: 20, tags: ['Potholes', 'Street Lighting'] },
  { name: 'Ward 4', total: '8', resolved: 4, review: 2, open: 2, rPct: 50, vPct: 25, oPct: 25, tags: ['Drainage', 'Street Lighting'] },
  { name: 'Ward 8', total: '12', resolved: 7, review: 2, open: 3, rPct: 58, vPct: 17, oPct: 25, tags: ['Water Supply', 'Road Damage'] },
  { name: 'Ward 9', total: '6', resolved: 3, review: 2, open: 1, rPct: 50, vPct: 33, oPct: 17, tags: ['Waste Collection'] },
  { name: 'Ward 10', total: '18', resolved: 9, review: 6, open: 3, rPct: 50, vPct: 33, oPct: 17, tags: ['Road Damage', 'Drainage'] },
  { name: 'Ward 11', total: '4', resolved: 2, review: 1, open: 1, rPct: 50, vPct: 25, oPct: 25, tags: ['Water Supply'] },
  { name: 'Ward 14', total: '9', resolved: 5, review: 2, open: 2, rPct: 56, vPct: 22, oPct: 22, tags: ['Street Lighting', 'Water Supply'] },
  { name: 'Ward 16', total: '7', resolved: 4, review: 2, open: 1, rPct: 57, vPct: 29, oPct: 14, tags: ['Waste Management'] },
  { name: 'Ward 17', total: '11', resolved: 6, review: 3, open: 2, rPct: 55, vPct: 27, oPct: 18, tags: ['Road Damage', 'Drainage'] },
  { name: 'Ward 18', total: '12', resolved: 7, review: 2, open: 3, rPct: 58, vPct: 17, oPct: 25, tags: ['Water Supply', 'Waste Management'] },
  { name: 'Ward 19', total: '5', resolved: 3, review: 1, open: 1, rPct: 60, vPct: 20, oPct: 20, tags: ['Street Lighting'] },
  { name: 'Ward 20', total: '13', resolved: 8, review: 3, open: 2, rPct: 62, vPct: 23, oPct: 15, tags: ['Road Damage', 'Street Lighting'] },
  { name: 'Ward 21', total: '17', resolved: 9, review: 5, open: 3, rPct: 53, vPct: 29, oPct: 18, tags: ['Drainage', 'Waste Management'] },
  { name: 'Ward 22', total: '8', resolved: 5, review: 2, open: 1, rPct: 63, vPct: 25, oPct: 13, tags: ['Water Supply', 'Road Damage'] },
  { name: 'Ward 24', total: '19', resolved: 11, review: 5, open: 3, rPct: 58, vPct: 26, oPct: 16, tags: ['Road Damage', 'Waste Collection'] },
  { name: 'Ward 26', total: '14', resolved: 7, review: 4, open: 3, rPct: 50, vPct: 29, oPct: 21, tags: ['Street Lighting', 'Drainage'] },
  { name: 'Ward 27', total: '9', resolved: 5, review: 2, open: 2, rPct: 56, vPct: 22, oPct: 22, tags: ['Water Supply', 'Road Damage'] },
  { name: 'Ward 28', total: '11', resolved: 6, review: 3, open: 2, rPct: 55, vPct: 27, oPct: 18, tags: ['Waste Management', 'Street Lighting'] },
  { name: 'Ward 29', total: '4', resolved: 2, review: 1, open: 1, rPct: 50, vPct: 25, oPct: 25, tags: ['Water Supply'] },
  { name: 'Ward 30', total: '7', resolved: 4, review: 2, open: 1, rPct: 57, vPct: 29, oPct: 14, tags: ['Road Damage'] },
  { name: 'Ward 31', total: '8', resolved: 5, review: 2, open: 1, rPct: 63, vPct: 25, oPct: 13, tags: ['Street Lighting', 'Water Supply'] },
  { name: 'Ward 32', total: '10', resolved: 6, review: 2, open: 2, rPct: 60, vPct: 20, oPct: 20, tags: ['Road Damage', 'Waste Management'] },
]

const wardsNeedsAttention: WardData[] = [
  { name: 'Ward 5', total: '16', resolved: 6, review: 5, open: 5, rPct: 38, vPct: 31, oPct: 31, tags: ['Waste Management', 'Drainage'] },
  { name: 'Ward 7', total: '22', resolved: 10, review: 7, open: 5, rPct: 45, vPct: 32, oPct: 23, tags: ['Road Damage', 'Water Supply'] },
  { name: 'Ward 13', total: '15', resolved: 7, review: 5, open: 3, rPct: 47, vPct: 33, oPct: 20, tags: ['Waste Collection', 'Street Lighting'] },
  { name: 'Ward 15', total: '22', resolved: 10, review: 7, open: 5, rPct: 45, vPct: 32, oPct: 23, tags: ['Health Services', 'Sanitation'] },
]

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
            <div className="ward-progress-seg ward-progress-resolved" style={{ width: w.rPct + '%' }}></div>
            <div className="ward-progress-seg ward-progress-review" style={{ width: w.vPct + '%' }}></div>
            <div className="ward-progress-seg ward-progress-open" style={{ width: w.oPct + '%' }}></div>
          </div>
        </div>
        <div className="ward-bottom">
          <div className="ward-tags">
            {w.tags.map((t) => <span key={t}>{t}</span>)}
          </div>
          <Link href="/" className="ward-view-link">
            <span>View Reports</span> <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function WardActivityPage() {
  return (
    <div className="page-wrapper">
      <h1>Ward-wise Activity</h1>
      <p className="subtitle">Breakdown of reported issues across all 32 wards of Kathmandu, categorised by resolution rate.</p>

      <div className="ward-section">
        <div className="ward-section-head ward-section-head--green">
          <span className="ward-section-count ward-section-count--green">6</span>
          <h2 className="ward-section-title">Well Resolved</h2>
        </div>
        <p className="ward-section-desc">Wards with 65% or higher resolution rate — responsive and efficient.</p>
        {wardsWellResolved.map((w) => <WardRow key={w.name} w={w} />)}
      </div>

      <div className="ward-section">
        <div className="ward-section-head ward-section-head--amber">
          <span className="ward-section-count ward-section-count--amber">22</span>
          <h2 className="ward-section-title">On Track</h2>
        </div>
        <p className="ward-section-desc">Wards with resolution rates between 50% and 64% — making steady progress.</p>
        {wardsOnTrack.map((w) => <WardRow key={w.name} w={w} />)}
      </div>

      <div className="ward-section">
        <div className="ward-section-head ward-section-head--red">
          <span className="ward-section-count ward-section-count--red">4</span>
          <h2 className="ward-section-title">Needs Attention</h2>
        </div>
        <p className="ward-section-desc">Wards with resolution rates below 50% — these need more active community reporting.</p>
        {wardsNeedsAttention.map((w) => <WardRow key={w.name} w={w} />)}
      </div>
    </div>
  )
}
