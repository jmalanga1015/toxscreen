import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getAllFacilitiesSummary, getFacilityById } from '../lib/supabase'
import FacilityDetail from './FacilityDetail'
import './ExploreMap.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function ExploreMap({ user }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 4,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      try {
        const facilities = await getAllFacilitiesSummary()
        setCount(facilities.length)

        const geojson = {
          type: 'FeatureCollection',
          features: facilities
            .filter(f => f.latitude && f.longitude)
            .map(f => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [f.longitude, f.latitude] },
              properties: {
                id: f.id,
                name: f.name,
                city: f.city,
                state: f.state,
                total_releases_lbs: f.total_releases_lbs,
              },
            })),
        }

        map.addSource('facilities', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 45,
        })

        // Cluster circles
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'facilities',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step', ['get', 'point_count'],
              '#27ae60', 20, '#e67e22', 100, '#e74c3c',
            ],
            'circle-radius': [
              'step', ['get', 'point_count'],
              18, 20, 26, 100, 34,
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        })

        // Cluster count labels
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'facilities',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          },
          paint: { 'text-color': '#fff' },
        })

        // Individual facility dots
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'facilities',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['==', ['get', 'total_releases_lbs'], 0], '#aaa',
              ['<', ['get', 'total_releases_lbs'], 1000], '#27ae60',
              ['<', ['get', 'total_releases_lbs'], 50000], '#e67e22',
              '#e74c3c',
            ],
            'circle-radius': 7,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#fff',
          },
        })

        // Click cluster → zoom in
        map.on('click', 'clusters', e => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
          const clusterId = features[0].properties.cluster_id
          map.getSource('facilities').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return
            map.easeTo({ center: features[0].geometry.coordinates, zoom })
          })
        })

        // Click individual facility → load detail
        map.on('click', 'unclustered-point', async e => {
          const { id } = e.features[0].properties
          setDetailLoading(true)
          setSelectedFacility(null)
          try {
            const facility = await getFacilityById(id)
            setSelectedFacility(facility)
          } catch (err) {
            console.error(err)
          } finally {
            setDetailLoading(false)
          }
        })

        // Cursor changes
        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
        map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = '' })

        // Close detail when clicking blank map
        map.on('click', e => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters', 'unclustered-point'] })
          if (!features.length) setSelectedFacility(null)
        })

      } catch (err) {
        console.error(err)
        setError('Failed to load facilities.')
      } finally {
        setLoading(false)
      }
    })

    return () => map.remove()
  }, [])

  return (
    <div className="explore-wrap">
      <div className="explore-bar">
        <div className="explore-bar-left">
          <span className="explore-title">Explore</span>
          {loading
            ? <span className="explore-count">Loading facilities…</span>
            : error
              ? <span className="explore-count explore-count--error">{error}</span>
              : <span className="explore-count">{count.toLocaleString()} facilities nationwide</span>
          }
        </div>
        <div className="explore-legend">
          <span className="explore-legend-item">
            <span className="explore-dot explore-dot--green" /> &lt;1k lbs
          </span>
          <span className="explore-legend-item">
            <span className="explore-dot explore-dot--orange" /> 1k–50k lbs
          </span>
          <span className="explore-legend-item">
            <span className="explore-dot explore-dot--red" /> 50k+ lbs
          </span>
        </div>
      </div>

      <div className="explore-content">
        <div ref={containerRef} className="explore-map">
          {loading && (
            <div className="explore-loading">
              <div className="explore-spinner" />
              <span>Loading all US facilities…</span>
            </div>
          )}
        </div>

        {(selectedFacility || detailLoading) && (
          <div className="explore-detail-panel">
            {detailLoading ? (
              <div className="explore-detail-loading">
                <div className="explore-spinner" />
                <span>Loading facility…</span>
              </div>
            ) : (
              <FacilityDetail
                facility={selectedFacility}
                user={user}
                onBack={() => setSelectedFacility(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
