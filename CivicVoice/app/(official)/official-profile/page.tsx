"use client"

import { useAuth } from "@/lib/auth-context"

export default function OfficialProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const initials = user.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <h1 className="sv-section-title">Official Profile</h1>

      <div className="pv-card" style={{ marginBottom: 24 }}>
        <div className="pv-card-top" style={{ alignItems: "center", marginTop: 0 }}>
          <div className="pv-avatar" style={{ width: 64, height: 64, fontSize: 24, background: "var(--color-primary)", color: "#fff" }}>
            {initials}
          </div>
          <div className="pv-user-info" style={{ paddingTop: 0 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
              {user.name}
            </h1>
            <div className="pv-badges" style={{ marginBottom: 8 }}>
              <span className="pv-badge">Verified Official</span>
              {user.username && <span className="pv-badge">@{user.username}</span>}
            </div>
          </div>
        </div>
        <div className="pv-stats">
          <div className="pv-stat"><h2>6</h2><p>Reports Managed</p></div>
          <div className="pv-stat"><h2>2</h2><p>Resolved</p></div>
          <div className="pv-stat"><h2>4</h2><p>Active Cases</p></div>
          <div className="pv-stat"><h2>98%</h2><p>Response Rate</p></div>
        </div>
      </div>

      <div className="pv-card">
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
          Account Details
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
          <div><strong>Official ID:</strong> {user.id}</div>
          <div><strong>Name:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Username:</strong> {user.username ? `@${user.username}` : "—"}</div>
        </div>
      </div>
    </div>
  )
}
