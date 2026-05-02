import { useEffect, useState } from 'react'
import {
  getSavedSearches, deleteSavedSearch,
  getSavedFacilities, deleteSavedFacility,
} from '../lib/supabase'
import './SavedPanel.css'

export default function SavedPanel({ onClose, onRunSearch, onViewFacility }) {
  const [searches, setSearches] = useState([])
  const [facilities, setFacilities] = useState([])

  useEffect(() => {
    getSavedSearches().then(setSearches)
    getSavedFacilities().then(setFacilities)
  }, [])

  async function handleDeleteSearch(id) {
    await deleteSavedSearch(id)
    setSearches(s => s.filter(x => x.id !== id))
  }

  async function handleDeleteFacility(id) {
    await deleteSavedFacility(id)
    setFacilities(f => f.filter(x => x.id !== id))
  }

  return (
    <div className="saved-overlay" onClick={onClose}>
      <div className="saved-panel" onClick={e => e.stopPropagation()}>
        <div className="saved-panel-header">
          <h2>Saved</h2>
          <button className="saved-close" onClick={onClose}>×</button>
        </div>

        <div className="saved-section">
          <h3>Searches</h3>
          {searches.length === 0 && <p className="saved-empty">No saved searches yet.</p>}
          {searches.map(s => (
            <div key={s.id} className="saved-item">
              <div className="saved-item-info">
                <span className="saved-item-label">{s.location}</span>
                <span className="saved-item-sub">{s.radius} mile radius</span>
              </div>
              <div className="saved-item-actions">
                <button
                  className="saved-run-btn"
                  onClick={() => { onRunSearch(s.location, s.radius); onClose() }}
                >
                  Search
                </button>
                <button className="saved-delete-btn" onClick={() => handleDeleteSearch(s.id)}>×</button>
              </div>
            </div>
          ))}
        </div>

        <div className="saved-section">
          <h3>Facilities</h3>
          {facilities.length === 0 && <p className="saved-empty">No saved facilities yet.</p>}
          {facilities.map(f => (
            <div key={f.id} className="saved-item">
              <div className="saved-item-info">
                <span className="saved-item-label">{f.facility_name}</span>
              </div>
              <div className="saved-item-actions">
                <button
                  className="saved-run-btn"
                  onClick={() => onViewFacility?.(f.facility_id)}
                >
                  View
                </button>
                <button className="saved-delete-btn" onClick={() => handleDeleteFacility(f.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
