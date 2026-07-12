'use client'

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { posts, categories } from "@/lib/data"
import { formatCount, statusLabel } from "@/lib/utils"

const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' }
const statusColors: Record<string, string> = { open: '#EF4444', progress: '#D97706', resolved: '#059669' }
const statusBadgeBg: Record<string, string> = { open: '#FEE2E2', progress: '#FEF3C7', resolved: '#D1FAE5' }

export default function ExploreMapPage() {
  const [view, setView] = useState<'map' | 'list'>('map')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [boundaries, setBoundaries] = useState(true)
  const [listPosts, setListPosts] = useState(posts)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const mapElRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersLayer = useRef<any>(null)
  const boundaryLayer = useRef<any>(null)

  const filterPosts = useCallback(() => {
    let list = posts.filter(p => p.lat && p.lng)
    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        `ward ${p.ward}`.includes(q)
      )
    }
    if (catFilter !== 'all') list = list.filter(p => p.category === catFilter)
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter(p => p.priority === priorityFilter)
    if (dateFilter === 'week') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      list = list.filter(p => new Date(p.date).getTime() > weekAgo)
    } else if (dateFilter === 'month') {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      list = list.filter(p => new Date(p.date).getTime() > monthAgo)
    } else if (dateFilter === '3months') {
      const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
      list = list.filter(p => new Date(p.date).getTime() > threeMonthsAgo)
    }
    setListPosts(list)
  }, [search, catFilter, statusFilter, priorityFilter, dateFilter])

  // Debounced filter
  useEffect(() => {
    const timer = setTimeout(filterPosts, 200)
    return () => clearTimeout(timer)
  }, [filterPosts])

  // Dynamically load Leaflet JS
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapElRef.current || mapInstance.current) return
    const L = (window as any).L
    const map = L.map(mapElRef.current).setView([27.7172, 85.3240], 13)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    })
    streetLayer.addTo(map)
    L.control.layers({ Street: streetLayer, Satellite: satelliteLayer }, null, { position: 'bottomleft' }).addTo(map)
    mapInstance.current = map
    markersLayer.current = L.layerGroup().addTo(map)

    fetch('/kmc_wards.geojson')
      .then(r => r.json())
      .then(data => {
        const layer = L.geoJSON(data, {
          style: { color: '#2563EB', weight: 2.5, fillColor: '#2563EB', fillOpacity: 0.1 },
          onEachFeature: (feature: any, layer: any) => {
            const wardNum = feature.properties.ward
            if (wardNum) {
              layer.bindTooltip(`Ward ${wardNum}`, { permanent: true, direction: 'center', className: 'ward-label' })
            }
          },
        })
        boundaryLayer.current = layer
        if (boundaries) {
          layer.addTo(map)
          map.fitBounds(layer.getBounds(), { padding: [20, 20] })
        }
      })
      .catch(() => {})

    return () => {
      map.remove()
      mapInstance.current = null
      markersLayer.current = null
      boundaryLayer.current = null
    }
  }, [leafletLoaded])

  // Update markers when filters change
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return
    const L = (window as any).L
    const layer = markersLayer.current
    layer.clearLayers()

    const colors = { open: '#EF4444', progress: '#D97706', resolved: '#059669' }

    listPosts.forEach(p => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:${colors[p.status] || '#EF4444'};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:transform 0.15s;cursor:pointer"><div style="width:10px;height:10px;border-radius:50%;background:#fff;opacity:0.9"></div></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      })
      L.marker([p.lat, p.lng], { icon })
        .addTo(layer)
        .bindPopup(`
          <b style="font-size:15px">${p.title}</b>
          <div style="margin-top:4px;font-size:13px;color:#6B7280">${p.category} &middot; Ward ${p.ward} &middot; ${p.date}</div>
          <div style="margin-top:4px;font-size:13px;color:#6B7280">${formatCount(p.likes)} likes &middot; ${formatCount(p.comments)} comments</div>
        `)
    })
  }, [listPosts])

  // Toggle boundary layer
  useEffect(() => {
    if (!mapInstance.current || !boundaryLayer.current) return
    if (boundaries) {
      mapInstance.current.addLayer(boundaryLayer.current)
    } else {
      mapInstance.current.removeLayer(boundaryLayer.current)
    }
  }, [boundaries])

  // Invalidate size when switching to map view
  useEffect(() => {
    if (view === 'map' && mapInstance.current) {
      setTimeout(() => mapInstance.current.invalidateSize(), 200)
    }
  }, [view])

  return (
    <div id="mapView" style={{ display: 'block' }}>
      <div className="mv-inner">
        <section className="mv-hero">
          <div className="sv-hero-badge">Explore Map</div>
          <h1 className="sv-hero-title">Issue Map &mdash; <span>Kathmandu</span></h1>
          <p className="sv-hero-desc">Browse civic issues across the Kathmandu Metropolitan City. Click on markers to see report details.</p>
        </section>
        <div className="mv-search-row">
          <svg className="mv-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="16.3" y1="16.3" x2="21" y2="21" strokeLinecap="round" /></svg>
          <input type="text" className="mv-search-input" id="mvSearch" placeholder="Search location, ward, or issue..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="mv-filter-row">
          <select className="mv-select" id="mvCategoryFilter" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="mv-select" id="mvStatusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {['open', 'progress', 'resolved'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select className="mv-select" id="mvPriorityFilter" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            {Object.entries(priorityLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select className="mv-select" id="mvDateFilter" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="3months">Past 3 Months</option>
          </select>
        </div>
        <div className="mv-layer-row">
          <label className="mv-layer-label"><input type="checkbox" id="mvLayerBoundaries" checked={boundaries} onChange={e => setBoundaries(e.target.checked)} /> Ward Boundaries</label>
        </div>
        <div className="mv-view-toggle">
          <button className={`mv-toggle-btn${view === 'map' ? ' active' : ''}`} id="mvMapViewBtn" onClick={() => setView('map')}>Map View</button>
          <button className={`mv-toggle-btn${view === 'list' ? ' active' : ''}`} id="mvListViewBtn" onClick={() => setView('list')}>List View</button>
        </div>
        <div className="mv-map-wrap" id="mvMapWrap" style={{ display: view === 'map' ? '' : 'none' }}>
          <div className="mv-legend" id="mvLegend">
            <span><span className="mv-dot mv-dot-red"></span> Open</span>
            <span><span className="mv-dot mv-dot-orange"></span> In Review</span>
            <span><span className="mv-dot mv-dot-green"></span> Resolved</span>
          </div>
          <div id="exploreMap" ref={mapElRef} className="mv-map" style={{ minHeight: 400, background: 'var(--color-pill-bg)' }}>
            {!leafletLoaded && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted)', fontSize: 14 }}>
                Loading map...
              </div>
            )}
          </div>
        </div>
        <div className="mv-list-wrap" id="mvListWrap" style={{ display: view === 'list' ? 'block' : 'none' }}>
          <div className="mv-list" id="mvList">
            {listPosts.length === 0 ? (
              <div className="mv-list-empty">No issues match your filters.</div>
            ) : (
              listPosts.map(p => (
                <div className="mv-list-card" key={p.id} data-id={p.id}>
                  <div className="mv-list-head">
                    <span className="mv-list-status" style={{ background: statusBadgeBg[p.status], color: statusColors[p.status] }}>
                      {p.status === 'open' ? '\uD83D\uDD34' : p.status === 'progress' ? '\uD83D\uDFE0' : '\uD83D\uDFE2'} {statusLabel(p.status)}
                    </span>
                    <span className="mv-list-priority">{priorityLabels[p.priority] || ''}</span>
                  </div>
                  <div className="mv-list-title">{p.title}</div>
                  <div className="mv-list-meta">{p.location} &middot; Ward {p.ward}</div>
                  <div className="mv-list-stats">{formatCount(p.likes)} likes &middot; {formatCount(p.comments)} comments</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
