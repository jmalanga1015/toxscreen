import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './Map.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function fmt(lbs) {
  if (lbs > 0 && lbs < 1) return '<1'
  return lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function getColor(totalLbs) {
  if (totalLbs === 0) return '#aaa'
  if (totalLbs < 1000) return '#27ae60'
  if (totalLbs < 50000) return '#e67e22'
  return '#e74c3c'
}

export default function Map({ facilities, onSelect, selected, hideZeroReleases }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [preview, setPreview] = useState(null)
  const [ringPos, setRingPos] = useState(null)

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current.on('click', () => setPreview(null))

    return () => mapRef.current.remove()
  }, [])

  useEffect(() => {
    setPreview(null)
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (!facilities.length) return

    const map = mapRef.current
    const bounds = new mapboxgl.LngLatBounds()

    for (const facility of facilities) {
      if (!facility.latitude || !facility.longitude) continue

      const totalLbs = facility.releases.reduce((sum, r) => sum + r.total_releases_lbs, 0)
      if (hideZeroReleases && totalLbs === 0) continue

      const color = getColor(totalLbs)

      const marker = new mapboxgl.Marker({ color })
        .setLngLat([facility.longitude, facility.latitude])
        .addTo(map)

      const el = marker.getElement()
      el.style.cursor = 'pointer'

      el.addEventListener('click', e => {
        e.stopPropagation()
        if (window.innerWidth > 768) {
          onSelect?.(facility)
        } else {
          setPreview(facility)
        }
      })

      markersRef.current.push(marker)
      bounds.extend([facility.longitude, facility.latitude])
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 13 })
    }
  }, [facilities, hideZeroReleases])

  // Track selected facility: fly to it and update ring position on every render frame
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!selected?.latitude || !selected?.longitude) {
      setRingPos(null)
      return
    }

    const updateRing = () => {
      const pt = map.project([selected.longitude, selected.latitude])
      setRingPos({ x: pt.x, y: pt.y })
    }

    map.on('render', updateRing)
    updateRing()

    map.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(map.getZoom(), 11),
      speed: 1.4,
    })

    return () => map.off('render', updateRing)
  }, [selected])

  const selectedTotalLbs = selected
    ? selected.releases.reduce((sum, r) => sum + r.total_releases_lbs, 0)
    : 0
  const ringColor = selected ? getColor(selectedTotalLbs) : null

  const topChemicals = preview
    ? [...preview.releases]
        .filter(r => r.total_releases_lbs > 0)
        .sort((a, b) => b.total_releases_lbs - a.total_releases_lbs)
        .slice(0, 3)
    : []

  const totalLbs = preview
    ? preview.releases.reduce((sum, r) => sum + r.total_releases_lbs, 0)
    : 0

  return (
    <div ref={containerRef} className="map-container">
      {/* Pulsing ring overlay — positioned via map.project() */}
      {ringPos && ringColor && (
        <div
          className="selected-highlight"
          style={{
            left: ringPos.x,
            top: ringPos.y,
            '--highlight-color': ringColor,
          }}
        />
      )}

      {preview && (
        <div className="map-preview-card">
          <div className="map-preview-header">
            <div className="map-preview-title">
              <div className="map-preview-name">{preview.name}</div>
              <div className="map-preview-sub">
                {preview.city}, {preview.state} · {preview.distance_miles} mi away
              </div>
            </div>
            <button className="map-preview-close" onClick={() => setPreview(null)}>×</button>
          </div>
          <div className="map-preview-total">{fmt(totalLbs)} lbs total released</div>
          {topChemicals.length > 0 && (
            <div className="map-preview-chemicals">
              {topChemicals.map(r => (
                <div key={r.chemical} className="map-preview-chem">
                  <span className="map-preview-chem-name">{r.chemical}</span>
                  <span className="map-preview-chem-lbs">{fmt(r.total_releases_lbs)} lbs</span>
                </div>
              ))}
            </div>
          )}
          <button
            className="map-preview-btn"
            onClick={() => { onSelect?.(preview); setPreview(null) }}
          >
            See Full Details
          </button>
        </div>
      )}
    </div>
  )
}
