import { useState, useEffect } from 'react'
import { getChemicalInfo, getConcernLabel } from '../lib/chemicals'
import { fetchChemicalDescriptions } from '../lib/pubchem'
import './FacilityDetail.css'

function fmt(lbs) {
  if (lbs > 0 && lbs < 1) return '<1'
  return lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function ConcernBadge({ concern }) {
  return (
    <span className={`concern-badge concern-${concern}`}>
      {getConcernLabel(concern)}
    </span>
  )
}

export default function FacilityDetail({ facility, onBack }) {
  const [pubchemDescriptions, setPubchemDescriptions] = useState({})
  const [loadingDescriptions, setLoadingDescriptions] = useState(false)

  const sorted = [...facility.releases].sort((a, b) => b.total_releases_lbs - a.total_releases_lbs)

  const totalLbs = sorted.reduce((sum, r) => sum + r.total_releases_lbs, 0)
  const totalAir = sorted.reduce((sum, r) => sum + r.air_releases_lbs, 0)
  const totalWater = sorted.reduce((sum, r) => sum + r.water_releases_lbs, 0)
  const totalLand = sorted.reduce((sum, r) => sum + r.land_releases_lbs, 0)

  useEffect(() => {
    setLoadingDescriptions(true)
    setPubchemDescriptions({})
    fetchChemicalDescriptions(sorted.map(r => r.chemical)).then(results => {
      setPubchemDescriptions(results)
      setLoadingDescriptions(false)
    })
  }, [facility.id])

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
          <span className="summary-label">Total Released</span>
          <span className="summary-value">{fmt(totalLbs)} lbs</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">To Air</span>
          <span className="summary-value">{fmt(totalAir)} lbs</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">To Water</span>
          <span className="summary-value">{fmt(totalWater)} lbs</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">To Land</span>
          <span className="summary-value">{fmt(totalLand)} lbs</span>
        </div>
      </div>

      <div className="chemical-list">
        {sorted.map(r => {
          const info = getChemicalInfo(r.chemical)
          const pubchem = pubchemDescriptions[r.chemical] ?? null
          const description = pubchem?.description ?? null
          const pubchemUrl = pubchem?.url ?? null

          return (
            <div key={r.chemical} className="chemical-row">
              <div className="chemical-header">
                <span className="chemical-name">{r.chemical}</span>
                <div className="chemical-meta">
                  {info && (
                <>
                  <ConcernBadge concern={info.concern} />
                  <span className="iris-label">{info.irisClassification}</span>
                </>
              )}
                  <span className="chemical-total">{fmt(r.total_releases_lbs)} lbs</span>
                </div>
              </div>

              {loadingDescriptions && !description ? (
                <p className="chemical-summary loading">Loading health information…</p>
              ) : description ? (
                <p className="chemical-summary">
                  {description}{' '}
                  <a href={pubchemUrl} target="_blank" rel="noreferrer" className="pubchem-link">Source: NIH PubChem</a>
                </p>
              ) : (
                <p className="chemical-summary no-description">
                  No description available. Search this chemical on{' '}
                  <a href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(r.chemical)}`} target="_blank" rel="noreferrer">
                    NIH PubChem
                  </a>.
                </p>
              )}

              <div className="chemical-breakdown">
                <span>Air: {fmt(r.air_releases_lbs)} lbs</span>
                <span>Water: {fmt(r.water_releases_lbs)} lbs</span>
                <span>Land: {fmt(r.land_releases_lbs)} lbs</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="detail-footnote">
        Release data from EPA Toxics Release Inventory (TRI), reporting year 2024.
        Concern levels based on <a href="https://www.epa.gov/iris" target="_blank" rel="noreferrer">EPA IRIS</a> carcinogenicity classifications.
        Descriptions from <a href="https://pubchem.ncbi.nlm.nih.gov" target="_blank" rel="noreferrer">NIH PubChem</a>.
        Not medical advice.
      </p>
    </div>
  )
}
