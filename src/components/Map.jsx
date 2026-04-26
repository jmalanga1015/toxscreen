import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './Map.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function Map({ facilities, onSelect, selectedId }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const facilitiesRef = useRef([])

  // Initialize map once
  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Event delegation: catch clicks on "See Facility Details" buttons inside popups
    containerRef.current.addEventListener('click', e => {
      const btn = e.target.closest('[data-facility-id]')
      if (!btn) return
      const id = Number(btn.dataset.facilityId)
      const facility = facilitiesRef.current.find(f => f.id === id)
      if (facility) onSelect?.(facility)
    })

    return () => mapRef.current.remove()
  }, [])

  // Update markers whenever facilities change
  useEffect(() => {
    facilitiesRef.current = facilities

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (!facilities.length) return

    const map = mapRef.current
    const bounds = new mapboxgl.LngLatBounds()

    for (const facility of facilities) {
      if (!facility.latitude || !facility.longitude) continue

      const topChemicals = [...facility.releases]
        .filter(r => r.total_releases_lbs > 0)
        .sort((a, b) => b.total_releases_lbs - a.total_releases_lbs)
        .slice(0, 5)

      const chemicalRows = topChemicals.length
        ? topChemicals.map(r =>
            `<tr>
              <td>${r.chemical}</td>
              <td>${r.total_releases_lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs</td>
            </tr>`
          ).join('')
        : '<tr><td colspan="2">No release data</td></tr>'

      const popup = new mapboxgl.Popup({ maxWidth: '300px' }).setHTML(`
        <div class="popup">
          <strong>${facility.name}</strong>
          <span>${facility.city}, ${facility.state}</span>
          <div class="popup-table-wrap">
            <table>
              <thead><tr><th>Chemical</th><th>Released</th></tr></thead>
              <tbody>${chemicalRows}</tbody>
            </table>
          </div>
          <button class="popup-detail-btn" data-facility-id="${facility.id}">
            See Facility Details
          </button>
        </div>
      `)

      const totalLbs = facility.releases.reduce((sum, r) => sum + r.total_releases_lbs, 0)
      const color = totalLbs === 0 ? '#aaa'
        : totalLbs < 1000 ? '#27ae60'
        : totalLbs < 50000 ? '#e67e22'
        : '#e74c3c'

      const marker = new mapboxgl.Marker({ color })
        .setLngLat([facility.longitude, facility.latitude])
        .setPopup(popup)
        .addTo(map)

      marker.getElement().style.cursor = 'pointer'
      markersRef.current.push(marker)
      bounds.extend([facility.longitude, facility.latitude])
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 13 })
    }
  }, [facilities])

  return <div ref={containerRef} className="map-container" />
}
