import './FacilityDetail.css'

function fmt(lbs) {
  return lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export default function FacilityDetail({ facility, onBack }) {
  const sorted = [...facility.releases].sort((a, b) => b.total_releases_lbs - a.total_releases_lbs)

  const totalLbs = sorted.reduce((sum, r) => sum + r.total_releases_lbs, 0)
  const totalAir = sorted.reduce((sum, r) => sum + r.air_releases_lbs, 0)
  const totalWater = sorted.reduce((sum, r) => sum + r.water_releases_lbs, 0)
  const totalLand = sorted.reduce((sum, r) => sum + r.land_releases_lbs, 0)

  return (
    <div className="facility-detail">
      <button className="back-btn" onClick={onBack}>← Back to results</button>

      <div className="detail-header">
        <h2>{facility.name}</h2>
        <p className="detail-address">
          {facility.address}, {facility.city}, {facility.state} {facility.zip_code}
          <span className="detail-distance">{facility.distance_miles} mi away</span>
        </p>
      </div>

      <div className="detail-summary">
        <div className="summary-card">
          <span className="summary-label">Total released</span>
          <span className="summary-value">{fmt(totalLbs)} lbs</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">To air</span>
          <span className="summary-value">{fmt(totalAir)} lbs</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">To water</span>
          <span className="summary-value">{fmt(totalWater)} lbs</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">To land</span>
          <span className="summary-value">{fmt(totalLand)} lbs</span>
        </div>
      </div>

      <div className="detail-table-wrap">
        <table className="detail-table">
          <thead>
            <tr>
              <th>Chemical</th>
              <th>Air (lbs)</th>
              <th>Water (lbs)</th>
              <th>Land (lbs)</th>
              <th>Total (lbs)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.chemical}>
                <td>{r.chemical}</td>
                <td>{fmt(r.air_releases_lbs)}</td>
                <td>{fmt(r.water_releases_lbs)}</td>
                <td>{fmt(r.land_releases_lbs)}</td>
                <td className="total-col">{fmt(r.total_releases_lbs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="detail-footnote">
        Data from EPA Toxics Release Inventory (TRI), reporting year 2024.
      </p>
    </div>
  )
}
