import { useState, useEffect } from 'react'
import './DualRangeSlider.css'

export default function DualRangeSlider({ min, max, step = 1, values, onChange, format }) {
  const [lo, hi] = values
  const pctLo = max > min ? ((lo - min) / (max - min)) * 100 : 0
  const pctHi = max > min ? ((hi - min) / (max - min)) * 100 : 100

  function fmt(n) { return Math.round(n).toLocaleString() }

  // Local string state so the user can type freely before committing
  const [loText, setLoText] = useState(fmt(lo))
  const [hiText, setHiText] = useState(fmt(hi))

  // Keep text in sync when slider or external values change
  useEffect(() => { setLoText(fmt(lo)) }, [lo])
  useEffect(() => { setHiText(fmt(hi)) }, [hi])

  function handleLo(e) {
    const v = Number(e.target.value)
    onChange([Math.min(v, hi - step), hi])
  }

  function handleHi(e) {
    const v = Number(e.target.value)
    onChange([lo, Math.max(v, lo + step)])
  }

  function parse(text) { return Number(text.replace(/,/g, '')) }

  function commitLo() {
    const v = parse(loText)
    if (!isNaN(v)) {
      const clamped = Math.round(Math.max(min, Math.min(v, hi - step)))
      onChange([clamped, hi])
      setLoText(fmt(clamped))
    } else {
      setLoText(fmt(lo))
    }
  }

  function commitHi() {
    const v = parse(hiText)
    if (!isNaN(v)) {
      const clamped = Math.round(Math.min(max, Math.max(v, lo + step)))
      onChange([lo, clamped])
      setHiText(fmt(clamped))
    } else {
      setHiText(fmt(hi))
    }
  }

  return (
    <div className="dual-range-wrap">
      <div className="dual-range">
        <div className="dual-range-track">
          <div
            className="dual-range-fill"
            style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
          />
        </div>
        <input
          type="range" min={min} max={max} step={step}
          value={lo}
          onChange={handleLo}
          className="dual-range-input dual-range-lo"
        />
        <input
          type="range" min={min} max={max} step={step}
          value={hi}
          onChange={handleHi}
          className="dual-range-input dual-range-hi"
        />
      </div>
      <div className="dual-range-inputs">
        <input
          className="dual-range-text"
          type="text"
          inputMode="numeric"
          value={loText}
          onChange={e => setLoText(e.target.value)}
          onBlur={commitLo}
          onKeyDown={e => e.key === 'Enter' && commitLo()}
        />
        <span className="dual-range-dash">–</span>
        <input
          className="dual-range-text"
          type="text"
          inputMode="numeric"
          value={hiText}
          onChange={e => setHiText(e.target.value)}
          onBlur={commitHi}
          onKeyDown={e => e.key === 'Enter' && commitHi()}
        />
      </div>
    </div>
  )
}
