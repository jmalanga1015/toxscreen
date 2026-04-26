import './FacilityList.css'

export default function FacilityList({ facilities, onSelect }) {
  const withReleases = facilities.filter(f => f.releases.length > 0)
  if (!withReleases.length) return null

  return (
    <div className="facility-list">
      <h2>{withReleases.length} Facilities with Releases</h2>
      <div className="facility-cards">
        {withReleases.map(facility => {
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
                  <span className="stat-label">Total released</span>
                  <span className="stat-value">
                    {totalLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Chemicals reported</span>
                  <span className="stat-value">{facility.releases.length}</span>
                </div>
                {topChemical && (
                  <div className="stat">
                    <span className="stat-label">Top chemical</span>
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
