import { useState, useRef, useEffect } from 'react'
import './SearchBar.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function useAddressAutocomplete(query) {
  const [suggestions, setSuggestions] = useState([])
  const debounceRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setSuggestions([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
          `?country=US&autocomplete=true&types=postcode,place,locality,neighborhood,address&limit=5&access_token=${MAPBOX_TOKEN}`
        const res = await fetch(url)
        const json = await res.json()
        setSuggestions(json.features || [])
      } catch {
        setSuggestions([])
      }
    }, 220)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  return suggestions
}

function AddressInput({ value, onChange, onSelect, onSubmit, loading, inputClassName }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef(null)
  const suggestions = useAddressAutocomplete(value)

  useEffect(() => { setHighlighted(0) }, [suggestions])

  function select(feature) {
    onChange(feature.place_name)
    setOpen(false)
    onSelect(feature.place_name)
  }

  function handleKey(e) {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); select(suggestions[highlighted]) }
    if (e.key === 'Escape')    { setOpen(false) }
  }

  return (
    <div className="address-autocomplete">
      <input
        ref={inputRef}
        type="text"
        maxLength={100}
        placeholder="ZIP code, city, or address"
        value={value}
        className={inputClassName}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKey}
        disabled={loading}
      />
      {open && suggestions.length > 0 && (
        <ul className="address-dropdown">
          {suggestions.map((f, i) => (
            <li
              key={f.id}
              className={i === highlighted ? 'highlighted' : ''}
              onMouseDown={() => select(f)}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="address-dropdown-main">{f.text}</span>
              <span className="address-dropdown-sub">{f.place_name.split(`${f.text}, `)[1] || ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SearchBar({ onSearch, onRadiusChange, radius, loading, compact = false }) {
  const [zip, setZip] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = zip.trim()
    if (trimmed.length > 0) onSearch(trimmed)
  }

  if (compact) {
    return (
      <form className="search-bar search-bar--compact" onSubmit={handleSubmit}>
        <AddressInput
          value={zip}
          onChange={setZip}
          onSelect={val => onSearch(val)}
          loading={loading}
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
        <AddressInput
          value={zip}
          onChange={setZip}
          onSelect={val => onSearch(val)}
          loading={loading}
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
