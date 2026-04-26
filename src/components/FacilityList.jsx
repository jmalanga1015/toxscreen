import { useState } from 'react'
import './FacilityList.css'

function fmt(lbs) {
  if (lbs > 0 && lbs < 1) return '<1'
  return lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

const SORT_OPTIONS = [
  { value: 'distance',  label: 'Distance' },
  { value: 'releases',  label: 'Total Released' },
  { value: 'chemicals', label: 'Chemicals Reported' },
]

function sortFacilities(facilities, sortBy) {
  return [...facilities].sort((a, b) => {
    if (sortBy === 'distance') return a.distance_miles - b.distance_miles
    if (sortBy === 'releases') {
      const aTotal = a.releases.reduce((s, r) => s + r.total_releases_lbs, 0)
      const bTotal = b.releases.reduce((s, r) => s + r.total_releases_lbs, 0)
      return bTotal - aTotal
    }
    if (sortBy === 'chemicals') return b.releases.length - a.releases.length
    return 0
  })
}

export default function FacilityList({ facilities, onSelect }) {
  const [sortBy, setSortBy] = useState('distance')

  const withReleases = facilities.filter(f => f.releases.length > 0)
  if (!withReleases.length) return null

  const sorted = sortFacilities(withReleases, sortBy)

  return (
    <div className="facility-list">
      <div className="list-header">
        <h2>{withReleases.length} Facilities with Releases</h2>
        <div className="sort-control">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="facility-cards">
        {sorted.map(facility => {
          const topChemical = [...facility.releases]
            .sort((a, b) => b.total_releases_lbs - a.total_releases_lbs)[0]

          const totalLbs = facility.releases
            .reduce((sum, r) => sum + r.total_releases_lbs, 0)

          return (
            <div key={facility.id} className="facility-card" onClick={() => onSelect(facility)} role="button" tabIndex={0}>
              <div className="card-header">
                <span className="facility-name">{facility.name}</span>
                <span className="distance">{facility.distance_miles} mi</span>
              </div>
              <div className="card-location">
                {facility.address}, {facility.city}, {facility.state} {facility.zip_code}
              </div>
              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Total Released</span>
                  <span className="stat-value">
                    {fmt(totalLbs)} lbs
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Chemicals Reported</span>
                  <span className="stat-value">{facility.releases.length}</span>
                </div>
                {topChemical && (
                  <div className="stat">
                    <span className="stat-label">Top Chemical</span>
                    <span className="stat-value">{topChemical.chemical}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
