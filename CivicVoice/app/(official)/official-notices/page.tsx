"use client"

import { useState, useEffect, useRef } from "react"

interface Notice {
  id: number
  title: string
  description: string
  location: string
  date: string
}

const initialNotices: Notice[] = [
  { id: 1, title: "Road maintenance near Baneshwor", description: "KMC will begin road maintenance on the Baneshwor stretch from New Baneshwor Chowk to Gyaneswor from Sunday. Traffic will be diverted via alternate routes.", location: "Baneshwor, Kathmandu", date: "Posted 2 days ago" },
  { id: 2, title: "Water supply interruption tomorrow", description: "Water supply will be suspended in Wards 3, 5, and 8 from 8 AM to 4 PM on Thursday due to scheduled maintenance.", location: "Wards 3, 5, 8", date: "Posted 3 days ago" },
  { id: 3, title: "New waste collection schedule", description: "KMC has revised the waste collection schedule for Wards 1—8. Collection will now happen twice a week on designated days.", location: "Kathmandu Metropolitan City", date: "Posted 5 days ago" },
  { id: 4, title: "Traffic diversion notice", description: "Traffic will be diverted on Durbar Marg from 10 PM to 5 AM for three nights starting Monday for road resurfacing.", location: "Durbar Marg, Kathmandu", date: "Posted 1 week ago" },
]

export default function OfficialNoticesPage() {
  const [notices, setNotices] = useState(initialNotices)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const mapEl = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const marker = useRef<any>(null)

  useEffect(() => {
    if ((window as any).L) { setLeafletLoaded(true); return }
    const s = document.createElement("script")
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    s.onload = () => setLeafletLoaded(true)
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapEl.current || !showForm) return
    const L = (window as any).L
    if (mapInstance.current) { mapInstance.current.invalidateSize(); return }
    const map = L.map(mapEl.current).setView([27.7172, 85.3240], 13)
    const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    })
    streetLayer.addTo(map)
    L.control.layers({ Street: streetLayer, Satellite: satelliteLayer }, null, { position: 'bottomleft' }).addTo(map)
    map.on("click", (e: any) => {
      if (marker.current) map.removeLayer(marker.current)
      marker.current = L.marker(e.latlng).addTo(map)
      const loc = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
      setLocation(loc)
    })
    mapInstance.current = map
    setTimeout(() => map.invalidateSize(), 100)
    return () => {
      map.remove()
      mapInstance.current = null
      marker.current = null
    }
  }, [leafletLoaded, showForm])

  const geocode = (q: string) => {
    if (!q.trim() || !mapInstance.current) return
    const L = (window as any).L
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=np`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.length) return
        const { lat, lon, display_name } = data[0]
        mapInstance.current.setView([lat, lon], 15)
        if (marker.current) mapInstance.current.removeLayer(marker.current)
        marker.current = L.marker([lat, lon]).addTo(mapInstance.current)
        setLocation(display_name)
      })
      .catch(() => {})
  }

  let geocodeTimer = useRef<any>(null)
  const handleLocationInput = (val: string) => {
    setLocation(val)
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    geocodeTimer.current = setTimeout(() => geocode(val), 600)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const newNotice: Notice = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || "Kathmandu",
      date: "Just now",
    }
    setNotices([newNotice, ...notices])
    setTitle("")
    setDescription("")
    setLocation("")
    setShowForm(false)
  }

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="sv-section-title" style={{ margin: 0 }}>Manage Notices</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 24px",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-lg)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Notice
        </button>
      </div>

      {showForm && (
        <div className="pv-modal-overlay" style={{ display: "flex" }} onClick={() => setShowForm(false)}>
          <div className="pv-modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="pv-modal-header">
              <h2>Create New Notice</h2>
              <button className="pv-modal-close" onClick={() => setShowForm(false)}>&#x2715;</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>
                  Title <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Road maintenance near Baneshwor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }}
                />
              </div>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>Description</label>
                <textarea
                  placeholder="Describe the notice details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, resize: "vertical", background: "var(--color-bg)", color: "var(--color-text)", outline: "none", fontFamily: "inherit" }}
                />
              </div>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>Location</label>
                <input
                  type="text"
                  placeholder="Type a location or click on the map"
                  value={location}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none", marginBottom: 10 }}
                />
                <div ref={mapEl} style={{ width: "100%", height: 280, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", overflow: "hidden" }} />
                <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "6px 0 0" }}>Click on the map to drop a pin, or type a location above.</p>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="pv-btn pv-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-primary">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hm-notice-list">
        {notices.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-muted)", padding: 40 }}>No notices yet.</p>
        )}
        {notices.map((n) => (
          <div key={n.id} className="hm-notice">
            <div>
              <div className="hm-notice-title">{n.title}</div>
              <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>{n.location}</div>
              <div className="hm-notice-date">{n.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
