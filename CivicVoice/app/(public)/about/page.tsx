import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About — CivicVoice",
  description: "Bridging the gap between citizens and local government through transparent issue reporting.",
}

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <h1>About CivicVoice</h1>
      <p className="subtitle">Bridging the gap between citizens and local government through transparent issue reporting.</p>

      <h2>Our Mission</h2>
      <p>CivicVoice is a community-driven platform that empowers citizens to report local issues — from potholes and broken streetlights to garbage dumping and water leaks — directly to municipal authorities. We believe that every voice matters and that transparent communication between residents and local government is the foundation of a thriving community.</p>

      <p><strong>Our goal is simple:</strong> make it easy for anyone to report a problem, track its progress, and see it resolved — all in one place.</p>

      <h2>Why CivicVoice?</h2>
      <p>Traditional methods of reporting civic issues — phone calls, emails, or in-person visits — are often slow, opaque, and discouraging. CivicVoice replaces that with a streamlined, map-based system where every report is visible, accountable, and actionable.</p>

      <h2>Our Values</h2>
      <div className="values-grid">
        <div className="value-card">
<i className="fa-solid fa-eye"></i>
           <h3 data-i18n="about.transparency">Transparency</h3>
           <p data-i18n="about.transparencyDesc">Every report is publicly visible with real-time status updates so everyone knows what&apos;s happening.</p>
         </div>
         <div className="value-card">
           <i className="fa-solid fa-bolt"></i>
           <h3 data-i18n="about.efficiency">Efficiency</h3>
           <p data-i18n="about.efficiencyDesc">Officials can triage, assign, and resolve issues faster with a centralized dashboard and map view.</p>
         </div>
         <div className="value-card">
           <i className="fa-solid fa-handshake"></i>
           <h3 data-i18n="about.community">Community</h3>
           <p data-i18n="about.communityDesc">Citizens can support each other&apos;s reports, comment, and collaborate to prioritize the most urgent issues.</p>
         </div>
         <div className="value-card">
           <i className="fa-solid fa-shield-halved"></i>
           <h3 data-i18n="about.accountability">Accountability</h3>
           <p data-i18n="about.accountabilityDesc">Every resolution is attributed to a specific official with timestamps and notes for full traceability.</p>
         </div>
      </div>

      <h2>How It Works</h2>
      <ul>
        <li><strong>Report</strong> — Citizens submit issues with a photo, description, location pin on the map, and category.</li>
        <li><strong>Track</strong> — Each report is shown on the public map and community feed with real-time status (Open, In Review, Resolved).</li>
        <li><strong>Resolve</strong> — Municipal officials review, update statuses, add notes and evidence, and mark issues as resolved.</li>
        <li><strong>Celebrate</strong> — The community sees progress and completed work, building trust in local governance.</li>
      </ul>

      <h2>Who Built It</h2>
      <p>CivicVoice was developed as a civic technology initiative to improve urban governance through digital tools. We are a team of developers, designers, and urban policy enthusiasts committed to making our cities better, one report at a time.</p>
    </div>
  )
}
