import { useState, useRef, useEffect, useMemo } from 'react'
import { getChemicalInfo } from '../lib/chemicals'
import DualRangeSlider from './DualRangeSlider'
import './FilterPanel.css'

const CONCERN_OPTIONS = [
  { value: 'high',   label: 'High Concern',    color: '#e74c3c' },
  { value: 'medium', label: 'Moderate Concern', color: '#e67e22' },
  { value: 'low',    label: 'Low Concern',       color: '#27ae60' },
]

const MEDIA_OPTIONS = [
  { value: 'air',   label: 'Air' },
  { value: 'water', label: 'Water' },
  { value: 'land',  label: 'Land' },
]

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function ChemicalAutocomplete({ value, onChange, allChemicals }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    const q = value.trim().toLowerCase()
    return allChemicals.filter(c => c.toLowerCase().includes(q)).slice(0, 10)
  }, [value, allChemicals])

  useEffect(() => { setHighlighted(0) }, [suggestions])

  function select(chemical) {
    onChange(chemical)
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleKey(e) {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); select(suggestions[highlighted]) }
    if (e.key === 'Escape')    { setOpen(false) }
  }

  return (
    <div className="chem-autocomplete">
      <input
        ref={inputRef}
        type="text"
        className="filter-text filter-text--sm"
        placeholder="e.g. lead…"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKey}
      />
      {value && (
        <button className="chem-clear" onClick={() => { onChange(''); inputRef.current?.focus() }}>×</button>
      )}
      {open && suggestions.length > 0 && (
        <ul className="chem-dropdown" ref={listRef}>
          {suggestions.map((c, i) => (
            <li
              key={c}
              className={i === highlighted ? 'highlighted' : ''}
              onMouseDown={() => select(c)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function FilterPanel({ filters, onChange, facilities, filteredCount, inline = false }) {
  const totalLbsValues = facilities.map(f =>
    f.releases.reduce((s, r) => s + r.total_releases_lbs, 0)
  )
  const maxLbs = Math.max(...totalLbsValues, 1)
  const maxChemicals = Math.max(...facilities.map(f => f.releases.length), 1)

  const allChemicals = useMemo(() => {
    const set = new Set()
    facilities.forEach(f => f.releases.forEach(r => set.add(r.chemical)))
    return [...set].sort()
  }, [facilities])

  function toggleConcern(level) {
    const next = filters.concernLevels.includes(level)
      ? filters.concernLevels.filter(l => l !== level)
      : [...filters.concernLevels, level]
    onChange({ ...filters, concernLevels: next })
  }

  function toggleMedia(medium) {
    const next = filters.media.includes(medium)
      ? filters.media.filter(m => m !== medium)
      : [...filters.media, medium]
    onChange({ ...filters, media: next })
  }

  const isDefault =
    filters.concernLevels.length === 3 &&
    filters.media.length === 3 &&
    filters.lbsRange[0] === 0 && filters.lbsRange[1] === maxLbs &&
    filters.chemicalsRange[0] === 0 && filters.chemicalsRange[1] === maxChemicals &&
    filters.chemical === ''

  const resetFilters = {
    concernLevels: ['high', 'medium', 'low'],
    media: ['air', 'water', 'land'],
    lbsRange: [0, maxLbs],
    chemicalsRange: [0, maxChemicals],
    chemical: '',
  }

  if (inline) {
    return (
      <div className="filter-panel-inline">

        <div className="filter-inline-group">
          <span className="filter-inline-label">Concern</span>
          {CONCERN_OPTIONS.map(o => (
            <label key={o.value} className="filter-check">
              <input type="checkbox" checked={filters.concernLevels.includes(o.value)} onChange={() => toggleConcern(o.value)} />
              <span className="concern-dot" style={{ background: o.color }} />
              {o.label}
            </label>
          ))}
        </div>

        <div className="filter-inline-group">
          <span className="filter-inline-label">Released To</span>
          {MEDIA_OPTIONS.map(o => (
            <label key={o.value} className="filter-check">
              <input type="checkbox" checked={filters.media.includes(o.value)} onChange={() => toggleMedia(o.value)} />
              {o.label}
            </label>
          ))}
        </div>

        <div className="filter-inline-group filter-inline-slider">
          <span className="filter-inline-label">Released (lbs)</span>
          <DualRangeSlider
            min={0} max={maxLbs}
            step={Math.max(1, Math.floor(maxLbs / 100))}
            values={filters.lbsRange}
            onChange={v => onChange({ ...filters, lbsRange: v })}
            format={n => fmt(n)}
          />
        </div>

        <div className="filter-inline-group filter-inline-slider">
          <span className="filter-inline-label">Chemicals Reported</span>
          <DualRangeSlider
            min={0} max={maxChemicals}
            step={1}
            values={filters.chemicalsRange}
            onChange={v => onChange({ ...filters, chemicalsRange: v })}
            format={n => n}
          />
        </div>

        <div className="filter-inline-group filter-inline-chemical">
          <span className="filter-inline-label">Chemical</span>
          <ChemicalAutocomplete
            value={filters.chemical}
            onChange={val => onChange({ ...filters, chemical: val })}
            allChemicals={allChemicals}
          />
        </div>

        {!isDefault && (
          <button className="filter-reset" onClick={() => onChange(resetFilters)}>Reset</button>
        )}
      </div>
    )
  }

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3>Filter Results</h3>
        {!isDefault && <button className="filter-reset" onClick={() => onChange(resetFilters)}>Reset</button>}
      </div>
      <p className="filter-count">{filteredCount} facilit{filteredCount === 1 ? 'y' : 'ies'} match</p>

      <div className="filter-section">
        <label className="filter-section-label">Concern Level</label>
        {CONCERN_OPTIONS.map(o => (
          <label key={o.value} className="filter-check">
            <input type="checkbox" checked={filters.concernLevels.includes(o.value)} onChange={() => toggleConcern(o.value)} />
            <span className="concern-dot" style={{ background: o.color }} />
            {o.label}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <label className="filter-section-label">Chemical</label>
        <ChemicalAutocomplete
          value={filters.chemical}
          onChange={val => onChange({ ...filters, chemical: val })}
          allChemicals={allChemicals}
        />
      </div>

      <div className="filter-section">
        <label className="filter-section-label">Released (lbs)</label>
        <DualRangeSlider
          min={0} max={maxLbs}
          step={Math.max(1, Math.floor(maxLbs / 100))}
          values={filters.lbsRange}
          onChange={v => onChange({ ...filters, lbsRange: v })}
          format={n => fmt(n)}
        />
      </div>

      <div className="filter-section" style={{ marginTop: '0.5rem' }}>
        <label className="filter-section-label">Chemicals Reported</label>
        <DualRangeSlider
          min={0} max={maxChemicals}
          step={1}
          values={filters.chemicalsRange}
          onChange={v => onChange({ ...filters, chemicalsRange: v })}
          format={n => n}
        />
      </div>

      <div className="filter-section">
        <label className="filter-section-label">Released To</label>
        {MEDIA_OPTIONS.map(o => (
          <label key={o.value} className="filter-check">
            <input type="checkbox" checked={filters.media.includes(o.value)} onChange={() => toggleMedia(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  )
}
