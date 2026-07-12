'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createReport, getMyReports, deleteReport } from "@/lib/api/reports"
import { handleApiError } from "@/lib/api/error-handler"
import { reverseGeocode, detectWard, getWardCentroid, geocode } from "@/lib/geo-utils"
import type { FeedReport } from "@/lib/api/reports"

const CATEGORY_MAP: Record<string, string> = {
  "Road Damage": "roads",
  "Street Light": "street_lights",
  "Garbage": "garbage",
  "Water Supply": "water",
  "Electricity": "electricity",
  "Drainage": "sewage",
  "Traffic": "other",
  "Public Safety": "other",
  "Other": "other",
}

const CATEGORY_LABEL: Record<string, string> = {
  roads: "Roads",
  street_lights: "Street Lights",
  garbage: "Garbage",
  water: "Water",
  sewage: "Sewage",
  electricity: "Electricity",
  parks: "Parks",
  noise: "Noise",
  other: "Other",
}

function countBy<T>(items: T[], fn: (item: T) => string): Record<string, number> {
  const map: Record<string, number> = {}
  items.forEach(item => {
    const k = fn(item)
    map[k] = (map[k] || 0) + 1
  })
  return map
}

const MAX_IMAGES = 5
const MAX_VIDEOS = 2
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

interface SelectedFile {
  file: File
  preview: string
  error?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function SubmitReportPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"submit" | "reports">("submit")
  const [showReview, setShowReview] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "", category: "", description: "", ward: "", priority: "Low", address: "", anonymous: false,
  })
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [lightboxFile, setLightboxFile] = useState<SelectedFile | null>(null)
  const uploadRef = useRef<HTMLDivElement>(null)

  const [myReports, setMyReports] = useState<FeedReport[]>([])
  const [myReportsLoading, setMyReportsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const stats = useMemo(() => {
    const statusCounts = countBy(myReports, r => r.status)
    const catCounts = countBy(myReports, r => r.category)
    const wardCoverage = new Set(myReports.map(r => r.ward_number)).size
    return {
      total: myReports.length,
      open: statusCounts['open'] || 0,
      progress: statusCounts['in_review'] || 0,
      resolved: statusCounts['resolved'] || 0,
      rejected: statusCounts['rejected'] || 0,
      categories: Object.keys(catCounts).length,
      wards: wardCoverage,
    }
  }, [myReports])

  const [geoJSONData, setGeoJSONData] = useState<any>(null)
  const formMapEl = useRef<HTMLDivElement>(null)
  const reportsMapEl = useRef<HTMLDivElement>(null)
  const formMapInstance = useRef<any>(null)
  const reportsMapInstance = useRef<any>(null)
  const reportsMapInitialized = useRef(false)
  const formMarker = useRef<any>(null)
  const formBoundaryLayer = useRef<any>(null)
  const reportsBoundaryLayer = useRef<any>(null)
  const reportsBoundaryInitialized = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogOpenRef = useRef(false)
  const wardFromAddressRef = useRef(false)
  const wardFromClickRef = useRef(false)

  const handleMapClick = useCallback(async (e: any) => {
    const L = (window as any).L
    const map = formMapInstance.current
    if (!map) return
    if (formMarker.current) map.removeLayer(formMarker.current)
    formMarker.current = L.marker(e.latlng).addTo(map)
    const newLat = e.latlng.lat
    const newLng = e.latlng.lng
    setLat(newLat)
    setLng(newLng)
    const ward = detectWard(newLat, newLng, geoJSONData)
    if (ward) {
      wardFromClickRef.current = true
      setFormData(fd => ({ ...fd, ward }))
    }
    const address = await reverseGeocode(newLat, newLng)
    if (address) setFormData(fd => ({ ...fd, address }))
  }, [geoJSONData])

  // Load Leaflet JS
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

  // Fetch GeoJSON
  useEffect(() => {
    if (!leafletLoaded || geoJSONData) return
    fetch('/kmc_wards.geojson')
      .then(r => r.json())
      .then(data => setGeoJSONData(data))
      .catch(() => {})
  }, [leafletLoaded, geoJSONData])

  // Init form map
  useEffect(() => {
    if (!leafletLoaded || !formMapEl.current || formMapInstance.current) return
    const L = (window as any).L
    const map = L.map(formMapEl.current).setView([27.7172, 85.3240], 14)
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
    formMapInstance.current = map
    map.on('click', handleMapClick)
    return () => {
      map.remove()
      formMapInstance.current = null
      formMarker.current = null
    }
  }, [leafletLoaded, handleMapClick])

  // When ward changes manually, move marker to ward centroid
  const prevWardRef = useRef(formData.ward)
  useEffect(() => {
    if (!geoJSONData || !formMapInstance.current) return
    if (formData.ward === prevWardRef.current) return
    prevWardRef.current = formData.ward
    if (!formData.ward) return
    // Skip if this ward change came from address geocoding or map click
    if (wardFromAddressRef.current || wardFromClickRef.current) {
      wardFromAddressRef.current = false
      wardFromClickRef.current = false
      return
    }
    const centroid = getWardCentroid(formData.ward, geoJSONData)
    if (!centroid) return
    const [cLng, cLat] = centroid
    const L = (window as any).L
    const map = formMapInstance.current
    if (formMarker.current) map.removeLayer(formMarker.current)
    formMarker.current = L.marker([cLat, cLng]).addTo(map)
    map.setView([cLat, cLng], 15)
    setLat(cLat)
    setLng(cLng)
  }, [formData.ward, geoJSONData])

  // Debounced address geocoding
  const addressTimer = useRef<any>(null)
  const prevAddressRef = useRef(formData.address)
  useEffect(() => {
    if (prevAddressRef.current === formData.address) return
    prevAddressRef.current = formData.address
    if (!formData.address.trim() || !formMapInstance.current) return
    if (addressTimer.current) clearTimeout(addressTimer.current)
    addressTimer.current = setTimeout(async () => {
      const result = await geocode(formData.address)
      if (!result || !formMapInstance.current) return
      const L = (window as any).L
      const map = formMapInstance.current
      if (formMarker.current) map.removeLayer(formMarker.current)
      formMarker.current = L.marker([result.lat, result.lng]).addTo(map)
      map.setView([result.lat, result.lng], 15)
      setLat(result.lat)
      setLng(result.lng)
      const ward = detectWard(result.lat, result.lng, geoJSONData)
      if (ward) {
        wardFromAddressRef.current = true
        setFormData(fd => ({ ...fd, ward }))
      }
    }, 600)
  }, [formData.address, geoJSONData])

  // Form boundaries
  useEffect(() => {
    if (!formMapInstance.current || !geoJSONData) return
    const L = (window as any).L
    const layer = L.geoJSON(geoJSONData, {
      style: { color: '#2563EB', weight: 2.5, fillColor: '#2563EB', fillOpacity: 0.1 },
      onEachFeature: (feature: any, layer: any) => {
        if (feature.properties.ward) {
          layer.bindTooltip(`Ward ${feature.properties.ward}`, { permanent: true, direction: 'center', className: 'ward-label' })
        }
      },
    })
    formBoundaryLayer.current = layer
    if ((document.getElementById('svFormBoundaries') as HTMLInputElement)?.checked) {
      formMapInstance.current.addLayer(layer)
    }
    const cb = document.getElementById('svFormBoundaries') as HTMLInputElement
    const handler = () => {
      if (!formMapInstance.current || !formBoundaryLayer.current) return
      if (cb.checked) {
        formMapInstance.current.addLayer(formBoundaryLayer.current)
      } else {
        formMapInstance.current.removeLayer(formBoundaryLayer.current)
      }
    }
    cb?.addEventListener('change', handler)
    return () => cb?.removeEventListener('change', handler)
  }, [geoJSONData])

  // Init reports map (runs when tab becomes reports or myReports changes)
  useEffect(() => {
    if (!leafletLoaded || activeTab !== 'reports' || !reportsMapEl.current) return

    if (reportsMapInstance.current) {
      reportsMapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof (window as any).L.Marker) {
          reportsMapInstance.current?.removeLayer(layer)
        }
      })
    }

    const L_ = (window as any).L
    let map = reportsMapInstance.current
    if (!map) {
      if (!reportsMapInitialized.current) {
        map = L_.map(reportsMapEl.current).setView([27.7172, 85.3240], 12)
        const streetLayer = L_.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        const satelliteLayer = L_.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        })
        streetLayer.addTo(map)
        L_.control.layers({ Street: streetLayer, Satellite: satelliteLayer }, null, { position: 'bottomleft' }).addTo(map)
        reportsMapInstance.current = map
        reportsMapInitialized.current = true
      } else {
        return
      }
    }

    const colors: Record<string, string> = { open: '#EF4444', in_review: '#D97706', resolved: '#059669', rejected: '#6B7280' }
    const statusLabels: Record<string, string> = { open: 'Open', in_review: 'In Review', resolved: 'Resolved', rejected: 'Rejected' }
    const statusBg: Record<string, string> = { open: '#FEE2E2', in_review: '#FEF3C7', resolved: '#D1FAE5', rejected: '#F3F4F6' }

    myReports.filter(r => r.latitude && r.longitude).forEach(r => {
      const rLat = parseFloat(r.latitude)
      const rLng = parseFloat(r.longitude)
      if (isNaN(rLat) || isNaN(rLng)) return
      const icon = L_.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:${colors[r.status] || '#EF4444'};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px">\uD83D\uDD34</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      })
      L_.marker([rLat, rLng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size:12px;display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            <span style="background:${statusBg[r.status] || '#FEE2E2'};color:${colors[r.status] || '#EF4444'};padding:2px 10px;border-radius:10px;font-weight:600">${statusLabels[r.status] || 'Open'}</span>
            <span style="background:#F3F4F6;padding:2px 10px;border-radius:10px;color:#374151">Ward ${r.ward_number}</span>
            <span style="background:#F3F4F6;padding:2px 10px;border-radius:10px;color:#374151">${CATEGORY_LABEL[r.category] || r.category}</span>
          </div>
          <b style="font-size:15px">${r.title}</b>
          <div style="margin-top:4px;font-size:13px;color:#6B7280">${r.address || ''}</div>
        `)
    })

    // Add boundaries if geoJSONData already loaded
    if (geoJSONData && !reportsBoundaryInitialized.current) {
      const layer = L_.geoJSON(geoJSONData, {
        style: { color: '#2563EB', weight: 2.5, fillColor: '#2563EB', fillOpacity: 0.1 },
        onEachFeature: (feature: any, layer: any) => {
          if (feature.properties.ward) {
            layer.bindTooltip(`Ward ${feature.properties.ward}`, { permanent: true, direction: 'center', className: 'ward-label' })
          }
        },
      })
      reportsBoundaryLayer.current = layer
      if ((document.getElementById('svReportsBoundaries') as HTMLInputElement)?.checked) {
        map.addLayer(layer)
      }
      reportsBoundaryInitialized.current = true
    }

    // Set up boundaries toggle
    const cb = document.getElementById('svReportsBoundaries') as HTMLInputElement
    const handler = () => {
      if (!reportsMapInstance.current || !reportsBoundaryLayer.current) return
      if (cb.checked) {
        reportsMapInstance.current.addLayer(reportsBoundaryLayer.current)
      } else {
        reportsMapInstance.current.removeLayer(reportsBoundaryLayer.current)
      }
    }
    cb?.addEventListener('change', handler)
  }, [leafletLoaded, activeTab, geoJSONData, myReports])

  // Fetch my reports when the tab switches
  useEffect(() => {
    if (activeTab !== "reports" || !user) return
    let cancelled = false
    setMyReportsLoading(true)
    getMyReports()
      .then((data: unknown) => {
        if (cancelled) return
        const reports = (data as { results?: FeedReport[] } | FeedReport[])
        setMyReports(Array.isArray(reports) ? reports : (reports.results || []))
      })
      .catch(() => {
        if (!cancelled) setMyReports([])
      })
      .finally(() => {
        if (!cancelled) setMyReportsLoading(false)
      })
    return () => { cancelled = true }
  }, [activeTab, user])

  const handleDeleteMyReport = useCallback(async (id: number) => {
    if (!confirm("Delete this report permanently? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await deleteReport(id)
      setMyReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      const apiErr = handleApiError(err)
      alert(apiErr.message || "Could not delete report.")
    } finally {
      setDeletingId(null)
    }
  }, [])

  // Cleanup preview URLs on unmount only
  const previewUrls = useRef<string[]>([])
  useEffect(() => {
    previewUrls.current = selectedFiles.map(f => f.preview).filter(Boolean)
  }, [selectedFiles])
  useEffect(() => {
    return () => {
      previewUrls.current.forEach(u => URL.revokeObjectURL(u))
    }
  }, [])

  const validateAndAddFiles = useCallback((files: FileList | File[]) => {
    const newFiles: SelectedFile[] = []
    const currentImages = selectedFiles.filter(f => f.file.type.startsWith("image/")).length
    const currentVideos = selectedFiles.filter(f => f.file.type.startsWith("video/")).length
    let imageCount = currentImages
    let videoCount = currentVideos
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      if (!isImage && !isVideo) continue
      if (isImage) {
        if (imageCount >= MAX_IMAGES) {
          newFiles.push({ file, preview: "", error: `Max ${MAX_IMAGES} images allowed` })
          continue
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          newFiles.push({ file, preview: "", error: "Invalid image type (jpg, png, webp only)" })
          continue
        }
        if (file.size > MAX_IMAGE_SIZE) {
          newFiles.push({ file, preview: "", error: `Image exceeds 10 MB (${formatSize(file.size)})` })
          continue
        }
        imageCount++
      }
      if (isVideo) {
        if (videoCount >= MAX_VIDEOS) {
          newFiles.push({ file, preview: "", error: `Max ${MAX_VIDEOS} videos allowed` })
          continue
        }
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
          newFiles.push({ file, preview: "", error: "Invalid video type (mp4, mov, webm only)" })
          continue
        }
        if (file.size > MAX_VIDEO_SIZE) {
          newFiles.push({ file, preview: "", error: `Video exceeds 50 MB (${formatSize(file.size)})` })
          continue
        }
        videoCount++
      }
      newFiles.push({ file, preview: URL.createObjectURL(file) })
    }
    setMediaError(null)
    setSelectedFiles(prev => [...prev, ...newFiles])
  }, [selectedFiles])

  const removeFile = useCallback((index: number) => {
    setMediaError(null)
    setSelectedFiles(prev => {
      const removed = prev[index]
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) validateAndAddFiles(e.dataTransfer.files)
  }, [validateAndAddFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dialogOpenRef.current = false
    if (e.target.files?.length) {
      validateAndAddFiles(e.target.files)
      e.target.value = ""
    }
  }, [validateAndAddFiles])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push("/login?redirect=" + encodeURIComponent("/submit-report"))
      return
    }
    const hasMedia = selectedFiles.some((sf) => !sf.error)
    if (!hasMedia) {
      setMediaError("Photo or video is required")
      uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSubmitError(null)
    setShowReview(true)
  }

  const confirmSubmit = async () => {
    const hasMedia = selectedFiles.some((sf) => !sf.error)
    if (!hasMedia) {
      setMediaError("Photo or video is required")
      setShowReview(false)
      setTimeout(() => uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100)
      setSubmitting(false)
      return
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      const backendCategory = CATEGORY_MAP[formData.category] || "other"
      const finalLat = lat ?? 27.7172
      const finalLng = lng ?? 85.3240

      const fd = new FormData()
      fd.append("title", formData.title)
      fd.append("description", formData.description)
      fd.append("category", backendCategory)
      fd.append("municipality", "Kathmandu")
      fd.append("ward_number", formData.ward || "1")
      fd.append("address", formData.address)
      fd.append("latitude", finalLat.toFixed(6))
      fd.append("longitude", finalLng.toFixed(6))
      fd.append("visibility", formData.anonymous ? "false" : "true")

      selectedFiles.forEach(sf => {
        if (sf.error) return
        if (sf.file.type.startsWith("image/")) {
          fd.append("uploaded_images", sf.file)
        } else if (sf.file.type.startsWith("video/")) {
          fd.append("uploaded_videos", sf.file)
        }
      })

      const result = await createReport(fd)
      setShowReview(false)
      setFormData({ title: "", category: "", description: "", ward: "", priority: "Low", address: "", anonymous: false })
      setLat(null)
      setLng(null)
      setSelectedFiles([])
      setLightboxFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      router.push(`/report-details/${result.id}`)
    } catch (err: unknown) {
      const apiErr = handleApiError(err)
      setSubmitError(apiErr.message)
      setSubmitting(false)
    }
  }

  return (
    <div id="submitView" style={{ display: 'block' }}>
      <div className="sv-inner">
        <section className="sv-hero">
          <div className="sv-hero-badge">Civic Reporting Portal</div>
          <h1 className="sv-hero-title">Report a <span>Community Issue</span></h1>
          <p className="sv-hero-desc">Found a civic problem? Help your community by reporting it. Upload evidence, pinpoint the exact location, and contribute towards building safer, smarter, and more accountable neighborhoods.</p>
        </section>
        <div className="sv-tabs">
          <button className={"sv-tab" + (activeTab === "submit" ? " active" : "")} onClick={() => setActiveTab("submit")}>Submit New Report</button>
          {user && (
            <button className={"sv-tab" + (activeTab === "reports" ? " active" : "")} onClick={() => setActiveTab("reports")}>View Your Reports</button>
          )}
        </div>

        {activeTab === "submit" && (
          <div className="sv-tab-content" id="svSubmitTab">
            <section className="sv-form-section">
              <form className="sv-form" id="svForm" onSubmit={handleSubmit}>
                <div className="sv-fg">
                  <label>Issue Title *</label>
                  <input id="svTitle" type="text" placeholder="Streetlight not working near Baneshwor Chowk" required
                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="sv-fg">
                  <label>Issue Category *</label>
                  <select id="svCategory" required
                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Select Category</option>
                    <option>Road Damage</option>
                    <option>Street Light</option>
                    <option>Garbage</option>
                    <option>Water Supply</option>
                    <option>Electricity</option>
                    <option>Drainage</option>
                    <option>Traffic</option>
                    <option>Public Safety</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="sv-fg">
                  <label>Description *</label>
                  <textarea id="svDescription" rows={5} placeholder="Describe the issue in detail..." required
                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
                <div className="sv-grid-2">
                  <div className="sv-fg">
                    <label>Ward Number</label>
                    <input id="svWard" type="number" placeholder="Ward Number"
                      value={formData.ward} onChange={(e) => setFormData({ ...formData, ward: e.target.value })} />
                  </div>
                  <div className="sv-fg">
                    <label>Priority Level</label>
                    <select id="svPriority"
                      value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Emergency</option>
                    </select>
                    <div className="sv-priority-info">
                      <div><strong>Low:</strong> Minor inconvenience</div>
                      <div><strong>Medium:</strong> Affects day-to-day</div>
                      <div><strong>High:</strong> Prompt attention needed</div>
                      <div><strong>Emergency:</strong> Immediate threat</div>
                    </div>
                  </div>
                </div>
                <div className="sv-fg">
                  <label>Address * <small style={{fontWeight:400,color:'var(--color-muted)'}}>(Click the map to auto-fill)</small></label>
                  <input id="svAddress" type="text" placeholder="Click on the map or type an address" required
                    value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <label className="sv-boundary-toggle"><input type="checkbox" id="svFormBoundaries" defaultChecked /> Show Ward Boundaries</label>
                <div className="sv-map-box" id="svFormMap" ref={formMapEl} style={{ minHeight: 250, borderRadius: 'var(--radius-md)' }}>
                  {!leafletLoaded && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted)', fontSize: 14, background: 'var(--color-pill-bg)', borderRadius: 'var(--radius-md)' }}>
                      Loading map...
                    </div>
                  )}
                </div>
                <div className="sv-upload-box" ref={uploadRef}>
                  <h2>Upload Photos / Videos</h2>
                  <p>Upload photos or videos as evidence{mediaError ? <span style={{color:'#EF4444',marginLeft:8,fontSize:13}}>— {mediaError}</span> : null}.</p>
                  <div className={`sv-dropzone${dragging ? ' sv-dropzone-dragging' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={(e) => {
                      if (e.target !== e.currentTarget) return
                      if (dialogOpenRef.current) return
                      dialogOpenRef.current = true
                      fileInputRef.current?.click()
                      setTimeout(() => { dialogOpenRef.current = false }, 500)
                    }}>
                    <input type="file" multiple accept="image/*,video/*" ref={fileInputRef}
                      onChange={handleFileInputChange} style={{ display: 'none' }} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom:8,color:'var(--color-muted)'}}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <div style={{fontSize:14,color:'var(--color-text)'}}>Drag &amp; drop files here or <strong style={{color:'var(--color-primary)'}}>browse</strong></div>
                    <div style={{fontSize:12,color:'var(--color-muted)',marginTop:4}}>Images: jpg, png, webp (max 10 MB each) &middot; Videos: mp4, mov, webm (max 50 MB each)</div>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:12,marginTop:16}}>
                      {selectedFiles.map((sf, i) => (
                        <div key={i} className="sv-file-card">
                          <div className="sv-file-card-remove" onClick={(e) => { e.stopPropagation(); removeFile(i) }}>&times;</div>
                          {sf.error ? (
                            <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',minHeight:60,background:'var(--color-pill-bg)',borderRadius:8,fontSize:11,color:'#EF4444',textAlign:'center',padding:8}}>{sf.error}</div>
                          ) : sf.file.type.startsWith("video/") ? (
                            <div style={{position:'relative',cursor:'pointer'}} onClick={() => setLightboxFile(sf)}>
                              <video src={sf.preview} style={{width:'100%',maxHeight:220,borderRadius:8,background:'#000'}} controls />
                            </div>
                          ) : (
                            <div style={{position:'relative',cursor:'pointer',borderRadius:8,overflow:'hidden'}} onClick={() => setLightboxFile(sf)}>
                              <img src={sf.preview} alt="" style={{width:'100%',maxHeight:220,objectFit:'contain',borderRadius:8,background:'var(--color-pill-bg)'}} />
                            </div>
                          )}
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 6px'}}>
                            <span style={{fontSize:11,color:'var(--color-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{sf.file.name}</span>
                            <span style={{fontSize:10,color:'var(--color-muted)',flexShrink:0}}>{formatSize(sf.file.size)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {lightboxFile && (
                    <div className="sv-lightbox" onClick={() => setLightboxFile(null)}>
                      <div className="sv-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="sv-lightbox-close" onClick={() => setLightboxFile(null)}>&times;</button>
                        {lightboxFile.file.type.startsWith("video/") ? (
                          <video src={lightboxFile.preview} controls autoPlay style={{maxWidth:'90vw',maxHeight:'85vh',borderRadius:8}} />
                        ) : (
                          <img src={lightboxFile.preview} alt="" style={{maxWidth:'90vw',maxHeight:'85vh',borderRadius:8,objectFit:'contain'}} />
                        )}
                        <div style={{marginTop:8,fontSize:13,color:'var(--color-muted)',textAlign:'center'}}>{lightboxFile.file.name} ({formatSize(lightboxFile.file.size)})</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="sv-anonymous-box">
                  <label className="sv-checkbox-container">
                    <input id="svAnonymous" type="checkbox"
                      checked={formData.anonymous} onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })} />
                    <span>Report Anonymously</span>
                  </label>
                  <small>Your identity will remain hidden from other community members.</small>
                </div>
                <div className="sv-guideline-card">
                  <h3>Community Guidelines</h3>
                  <ul>
                    <li>Provide accurate and truthful information.</li>
                    <li>Respect privacy and avoid sharing sensitive personal details.</li>
                    <li>Do not upload harmful, abusive, or misleading content.</li>
                    <li>Avoid submitting duplicate reports.</li>
                  </ul>
                </div>
                <button className="sv-submit-btn" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Report"}</button>
              </form>
            </section>
          </div>
        )}

        {user && activeTab === "reports" && (
          <div className="sv-tab-content" id="svReportsTab">
            <section className="sv-reports-section">
              <h2 className="sv-section-title">Your Reports</h2>

                  <div className="sv-stats-row" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                    <div className="sv-stat-card" style={{ flex: 1, minWidth: 120, background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)' }}>{stats.total}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>Total Reports</div>
                    </div>
                    <div className="sv-stat-card" style={{ flex: 1, minWidth: 120, background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#EF4444' }}>{stats.open}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>Open</div>
                    </div>
                    <div className="sv-stat-card" style={{ flex: 1, minWidth: 120, background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#D97706' }}>{stats.progress}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>In Review</div>
                    </div>
                    <div className="sv-stat-card" style={{ flex: 1, minWidth: 120, background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>{stats.resolved}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>Resolved</div>
                    </div>
                    <div className="sv-stat-card" style={{ flex: 1, minWidth: 120, background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#6B7280' }}>{stats.rejected}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>Rejected</div>
                    </div>
                  </div>

                  {myReportsLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>Loading your reports...</div>
                  ) : myReports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No reports yet. Submit your first report!</div>
                  ) : (
                  <div className="sv-table-wrap">
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Date</th>
                          <th>Ward</th>
                          <th>Category</th>
                          <th>Address</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody id="svReportsBody">
                        {myReports.map(r => {
                          const effectiveStatus = r.status === 'open' && !r.visibility ? 'unapproved' : r.status
                          const statusColors: Record<string, string> = { open: '#EF4444', unapproved: '#9CA3AF', in_review: '#D97706', resolved: '#059669', rejected: '#6B7280' }
                          const statusBgs: Record<string, string> = { open: '#FEE2E2', unapproved: '#F3F4F6', in_review: '#FEF3C7', resolved: '#D1FAE5', rejected: '#F3F4F6' }
                          const statusLabels: Record<string, string> = { open: 'Open', unapproved: 'Unapproved', in_review: 'In Review', resolved: 'Resolved', rejected: 'Rejected' }
                          return (
                          <tr key={r.id} className="sv-table-row-clickable">
                            <td onClick={() => router.push(`/report-details/${r.id}?from=submit-report`)}>{r.title}</td>
                            <td onClick={() => router.push(`/report-details/${r.id}?from=submit-report`)}>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td onClick={() => router.push(`/report-details/${r.id}?from=submit-report`)}>{r.ward_number}</td>
                            <td onClick={() => router.push(`/report-details/${r.id}?from=submit-report`)}>{CATEGORY_LABEL[r.category] || r.category}</td>
                            <td onClick={() => router.push(`/report-details/${r.id}?from=submit-report`)}>{r.address || '-'}</td>
                            <td onClick={() => router.push(`/report-details/${r.id}?from=submit-report`)}>
                              <span className="mv-list-status" style={{
                                background: statusBgs[effectiveStatus] || '#FEE2E2',
                                color: statusColors[effectiveStatus] || '#EF4444',
                                padding: '2px 10px', borderRadius: 10, fontWeight: 600, fontSize: 12,
                              }}>
                                {statusLabels[effectiveStatus] || effectiveStatus}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteMyReport(r.id)
                                }}
                                disabled={deletingId === r.id}
                                style={{
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '6px 12px',
                                  cursor: deletingId === r.id ? 'not-allowed' : 'pointer',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {deletingId === r.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}
              <label className="sv-boundary-toggle"><input type="checkbox" id="svReportsBoundaries" defaultChecked /> Show Ward Boundaries</label>
              <div className="sv-reports-map-wrap">
                <div className="mv-legend">
                  <span><span className="mv-dot mv-dot-red"></span> Open</span>
                  <span><span className="mv-dot mv-dot-orange"></span> In Review</span>
                  <span><span className="mv-dot mv-dot-green"></span> Resolved</span>
                </div>
                <div id="svReportsMap" ref={reportsMapEl} className="sv-reports-map" style={{ minHeight: 250, borderRadius: 'var(--radius-md)' }}>
                  {!leafletLoaded && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted)', fontSize: 14, background: 'var(--color-pill-bg)', borderRadius: 'var(--radius-md)' }}>
                      Loading map...
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {showReview && (
          <div className="sv-modal" id="svReviewModal" style={{ display: 'flex' }}>
            <div className="sv-modal-content">
              <h2>Review Your Report</h2>
              <div className="sv-review-item"><div className="sv-review-label">Issue Title</div><div>{formData.title}</div></div>
              <div className="sv-review-item"><div className="sv-review-label">Category</div><div>{formData.category}</div></div>
              <div className="sv-review-item"><div className="sv-review-label">Priority</div><div>{formData.priority}</div></div>
              <div className="sv-review-item"><div className="sv-review-label">Address</div><div>{formData.address || '-'}</div></div>
              <div className="sv-review-item"><div className="sv-review-label">Ward</div><div>{formData.ward || '-'}</div></div>
              <div className="sv-review-item"><div className="sv-review-label">Files</div><div>{selectedFiles.filter(f=>!f.error).length} selected ({selectedFiles.filter(f=>f.error).length > 0 ? `${selectedFiles.filter(f=>f.error).length} with errors, ` : ''}{selectedFiles.filter(f=>f.file.type.startsWith('image/')).length} image{selectedFiles.filter(f=>f.file.type.startsWith('image/')).length !== 1 ? 's' : ''}, {selectedFiles.filter(f=>f.file.type.startsWith('video/')).length} video{selectedFiles.filter(f=>f.file.type.startsWith('video/')).length !== 1 ? 's' : ''})</div></div>
              <div className="sv-review-item"><div className="sv-review-label">Anonymous Report</div><div>{formData.anonymous ? "Yes" : "No"}</div></div>
              {submitError && <div className="sv-review-item" style={{ color: '#EF4444' }}><div className="sv-review-label">Error</div><div>{submitError}</div></div>}
              <div className="sv-modal-buttons">
                <button className="sv-edit-btn" onClick={() => setShowReview(false)} disabled={submitting}>Edit Report</button>
                <button className="sv-confirm-btn" onClick={confirmSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Confirm Submission"}</button>
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  )
}
