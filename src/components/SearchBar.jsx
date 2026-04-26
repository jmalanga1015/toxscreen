import { useState } from 'react'
import './SearchBar.css'

export default function SearchBar({ onSearch, onRadiusChange, radius, loading }) {
  const [zip, setZip] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = zip.trim()
    if (trimmed.length === 5 && /^\d{5}$/.test(trimmed)) {
      onSearch(trimmed)
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-inputs">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="Enter ZIP code (e.g. 10001)"
          value={zip}
          onChange={e => setZip(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || zip.trim().length !== 5}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      <div className="radius-control">
        <label htmlFor="radius">
          Radius: <strong>{radius} miles</strong>
        </label>
        <input
          id="radius"
          type="range"
          min={5}
          max={50}
          step={5}
          value={radius}
          onChange={e => onRadiusChange(Number(e.target.value))}
          disabled={loading}
        />
        <div className="radius-ticks">
          <span>5</span>
          <span>25</span>
          <span>50</span>
        </div>
      </div>
    </form>
  )
}
