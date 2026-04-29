import { useState } from 'react'
import './SearchBar.css'

export default function SearchBar({ onSearch, onRadiusChange, radius, loading, compact = false }) {
  const [zip, setZip] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = zip.trim()
    if (trimmed.length > 0) onSearch(trimmed)
  }

  if (compact) {
    // Compact: just the input + button, no radius (radius lives in toolbar)
    return (
      <form className="search-bar search-bar--compact" onSubmit={handleSubmit}>
        <input
          type="text"
          maxLength={100}
          placeholder="ZIP code, city, or address"
          value={zip}
          onChange={e => setZip(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || zip.trim().length === 0}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
    )
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-inputs">
        <input
          type="text"
          maxLength={100}
          placeholder="ZIP code, city, or address"
          value={zip}
          onChange={e => setZip(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || zip.trim().length === 0}>
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
          min={5} max={50} step={5}
          value={radius}
          onChange={e => onRadiusChange(Number(e.target.value))}
          disabled={loading}
        />
        <div className="radius-ticks">
          <span>5</span><span>25</span><span>50</span>
        </div>
      </div>
    </form>
  )
}
