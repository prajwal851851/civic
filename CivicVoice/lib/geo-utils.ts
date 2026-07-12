export function pointInPolygon(
  point: [number, number],
  polygon: number[][][],
): boolean {
  const [x, y] = point
  let inside = false
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }
  }
  return inside
}

export function polygonCentroid(ring: number[][]): [number, number] {
  let cx = 0
  let cy = 0
  for (const [x, y] of ring) {
    cx += x
    cy += y
  }
  return [cx / ring.length, cy / ring.length]
}

export function detectWard(
  lat: number,
  lng: number,
  geoJSON: any,
): string | null {
  if (!geoJSON?.features) return null
  for (const feature of geoJSON.features) {
    if (feature.geometry.type !== "Polygon") continue
    const coords = feature.geometry.coordinates
    if (pointInPolygon([lng, lat], coords)) {
      return feature.properties?.ward ?? null
    }
  }
  return null
}

export function getWardCentroid(
  ward: string,
  geoJSON: any,
): [number, number] | null {
  if (!geoJSON?.features) return null
  for (const feature of geoJSON.features) {
    if (feature.geometry.type !== "Polygon") continue
    if (String(feature.properties?.ward) === String(ward)) {
      const coords = feature.geometry.coordinates[0]
      if (coords?.length) return polygonCentroid(coords)
    }
  }
  return null
}

export async function geocode(
  query: string,
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=np`,
      { headers: { "User-Agent": "CivicVoice/1.0" } },
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    }
  } catch {
    return null
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "CivicVoice/1.0" } },
    )
    if (!res.ok) return ""
    const data = await res.json()
    return data.display_name ?? ""
  } catch {
    return ""
  }
}
