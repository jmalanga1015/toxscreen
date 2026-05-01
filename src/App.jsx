import { useState, useRef, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import Map from './components/Map'
import FacilityList from './components/FacilityList'
import FacilityDetail from './components/FacilityDetail'
import SavedPanel from './components/SavedPanel'
import ContentPage from './components/ContentPage'
import FilterPanel from './components/FilterPanel'
import { getFacilitiesNearZip, sendMagicLink, signOut, saveSearch } from './lib/supabase'
import { getChemicalInfo } from './lib/chemicals'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  const { user } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchedLocation, setSearchedLocation] = useState(null)
  const [radius, setRadius] = useState(25)
  const [selected, setSelected] = useState(null)
  const [mobileView, setMobileView] = useState('list')
  const [showSaved, setShowSaved] = useState(false)
  const [showFilters, setShowFilters] = useState(() => window.innerWidth > 768)
  const [activePage, setActivePage] = useState(null)
  const [hideZeroReleases, setHideZeroReleases] = useState(true)
  const [filters, setFilters] = useState({
    concernLevels: ['high', 'medium', 'low'],
    media: ['air', 'water', 'land'],
    lbsRange: [0, Infinity],
    chemicalsRange: [0, Infinity],
    chemical: '',
  })

  const [authEmail, setAuthEmail] = useState('')
  const [authSent, setAuthSent] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentSearches') || '[]') } catch { return [] }
  })
  const [showRecent, setShowRecent] = useState(false)
  const [showSavedInline, setShowSavedInline] = useState(false)
  const [savedSearches, setSavedSearches] = useState([])
  const [shareToast, setShareToast] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const debounceRef = useRef(null)

  // Auto-load search from URL params (for shared links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const r = params.get('r')
    if (q) {
      if (r) setRadius(Number(r))
      handleSearch(q)
    }
  }, [])

  function saveRecentSearch(location, miles) {
    const updated = [
      { location, radius: miles },
      ...recentSearches.filter(s => s.location !== location)
    ].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords
        const token = import.meta.env.VITE_MAPBOX_TOKEN
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality&access_token=${token}`)
        const data = await res.json()
        const place = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        handleSearch(place)
      } catch { } finally { setGeoLoading(false) }
    }, () => setGeoLoading(false))
  }

  async function handleShareSearch() {
    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set('q', searchedLocation)
    url.searchParams.set('r', radius)
    await navigator.clipboard.writeText(url.toString())
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2500)
  }

  async function handleShowSaved() {
    if (showSavedInline) { setShowSavedInline(false); return }
    setShowRecent(false)
    setShowSavedInline(true)
    if (!user) return  // show sign-in prompt in dropdown
    try {
      const { getSavedSearches } = await import('./lib/supabase')
      const data = await getSavedSearches()
      setSavedSearches(data)
    } catch (err) { console.error(err) }
  }

  async function runSearch(location, miles) {
    setLoading(true)
    setError(null)
    setSelected(null)
    setMobileView('list')
    try {
      const data = await getFacilitiesNearZip(location, miles)
      setFacilities(data)
      // Reset range filters to match new data's actual max values
      if (data.length > 0) {
        const maxLbs = Math.max(...data.map(f => f.releases.reduce((s, r) => s + r.total_releases_lbs, 0)), 1)
        const maxChemicals = Math.max(...data.map(f => f.releases.length), 1)
        setFilters(prev => ({
          ...prev,
          lbsRange: [0, maxLbs],
          chemicalsRange: [0, maxChemicals],
        }))
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(location) {
    setSearchedLocation(location)
    saveRecentSearch(location, radius)
    runSearch(location, radius)
  }

  function handleRadiusChange(miles) {
    setRadius(miles)
    if (!searchedLocation) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(searchedLocation, miles), 400)
  }

  function handleSelect(facility) {
    setSelected(facility)
    setMobileView('list')
  }

  async function handleSaveSearch() {
    try { await saveSearch(searchedLocation, radius) } catch (err) { console.error(err) }
  }

  async function handleSendMagicLink(e) {
    e.preventDefault()
    setAuthLoading(true)
    try { await sendMagicLink(authEmail); setAuthSent(true) }
    catch (err) { console.error(err) }
    finally { setAuthLoading(false) }
  }

  const hasResults = searchedLocation && !loading

  const maxLbs = facilities.length > 0
    ? Math.max(...facilities.map(f => f.releases.reduce((s, r) => s + r.total_releases_lbs, 0)), 1)
    : 1
  const maxChemicals = facilities.length > 0
    ? Math.max(...facilities.map(f => f.releases.length), 1)
    : 1

  const resetFilters = {
    concernLevels: ['high', 'medium', 'low'],
    media: ['air', 'water', 'land'],
    lbsRange: [0, maxLbs],
    chemicalsRange: [0, maxChemicals],
    chemical: '',
  }

  const activeFilterCount = [
    filters.concernLevels.length < 3,
    filters.media.length < 3,
    filters.chemical.trim() !== '',
    filters.lbsRange[0] > 0 || filters.lbsRange[1] < maxLbs,
    filters.chemicalsRange[0] > 0 || filters.chemicalsRange[1] < maxChemicals,
  ].filter(Boolean).length

  const filteredFacilities = facilities.filter(f => {
    const totalLbs = f.releases.reduce((s, r) => s + r.total_releases_lbs, 0)
    const [lbsMin, lbsMax] = filters.lbsRange
    if (totalLbs < lbsMin || (lbsMax !== Infinity && totalLbs > lbsMax)) return false

    const [chemMin, chemMax] = filters.chemicalsRange
    if (f.releases.length < chemMin || (chemMax !== Infinity && f.releases.length > chemMax)) return false

    if (filters.chemical.trim()) {
      const q = filters.chemical.trim().toLowerCase()
      if (!f.releases.some(r => r.chemical.toLowerCase().includes(q))) return false
    }

    const allConcerns = ['high', 'medium', 'low']
    const filteringConcern = filters.concernLevels.length < 3
    if (filteringConcern) {
      const hasConcern = f.releases.some(r => {
        const info = getChemicalInfo(r.chemical)
        return info && filters.concernLevels.includes(info.concern)
      })
      if (!hasConcern) return false
    }

    const filteringMedia = filters.media.length < 3
    if (filteringMedia) {
      const hasMedia = f.releases.some(r =>
        (filters.media.includes('air')   && r.air_releases_lbs   > 0) ||
        (filters.media.includes('water') && r.water_releases_lbs > 0) ||
        (filters.media.includes('land')  && r.land_releases_lbs  > 0)
      )
      if (!hasMedia) return false
    }

    return true
  })

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="header-left">
            <img
              src="/logo-white.svg"
              alt="ToxScreen"
              className="header-logo"
              onClick={() => setActivePage(null)}
            />
            <nav className="header-nav">
              {['about','sources','faq','contact'].map(page => (
                <button
                  key={page}
                  className={`nav-link${activePage === page ? ' active' : ''}`}
                  onClick={() => setActivePage(activePage === page ? null : page)}
                >
                  {page === 'faq' ? 'FAQ' : page.charAt(0).toUpperCase() + page.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="header-auth">
            {user ? (
              <>
                <span className="auth-email">{user.email}</span>
                <button className="auth-saved-btn" onClick={() => setShowSaved(true)}>Saved</button>
                <button className="auth-signout-btn" onClick={signOut}>Sign out</button>
              </>
            ) : authSent ? (
              <span className="auth-sent">Check your email for a sign-in link.</span>
            ) : (
              <form className="auth-form" onSubmit={handleSendMagicLink}>
                <input type="email" placeholder="your@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
                <button type="submit" disabled={authLoading}>{authLoading ? 'Sending…' : 'Sign in'}</button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main>
        {activePage ? <ContentPage page={activePage} /> : !searchedLocation ? (
          <div className="hero">
            <img src="/logo-hero.svg" alt="ToxScreen — Know what's near you" className="hero-logo" />
            <div className="hero-search">
              <SearchBar onSearch={handleSearch} onRadiusChange={handleRadiusChange} radius={radius} loading={loading} />
            </div>
          </div>
        ) : (
          <div className="results-wrap">
            <div className="results-toolbar">

              {/* Left col: search input + searched location */}
              <div className="toolbar-search-col">
                <SearchBar onSearch={handleSearch} loading={loading} compact />
                {searchedLocation && (
                  <div className="toolbar-location">
                    <span className="toolbar-location-label">Showing results for:</span>
                    <span className="toolbar-location-value">{searchedLocation}</span>
                  </div>
                )}
              </div>

              {/* Right col: radius + meta row, then filters row */}
              <div className="toolbar-right-col">
                <div className="toolbar-meta">
                  <label className="radius-label" htmlFor="toolbar-radius">
                    Radius: <strong>{radius} mi</strong>
                  </label>
                  <input
                    id="toolbar-radius"
                    type="range"
                    min={5} max={50} step={5}
                    value={radius}
                    onChange={e => handleRadiusChange(Number(e.target.value))}
                    disabled={loading}
                    className="toolbar-radius-slider"
                  />
                  {hasResults && facilities.length > 0 && <>
                    <div className="toolbar-divider" />
                    <p className="result-count">
                      {`${filteredFacilities.length} of ${facilities.length} facilit${facilities.length === 1 ? 'y' : 'ies'} within ${radius} mi`}
                    </p>
                    <label className="zero-toggle">
                      <input type="checkbox" checked={hideZeroReleases} onChange={e => setHideZeroReleases(e.target.checked)} />
                      Hide 0-release
                    </label>
                    {user && <button className="save-search-btn" onClick={handleSaveSearch}>Save</button>}
                  </>}
                  {hasResults && facilities.length === 0 && (
                    <p className="result-count">No facilities found within {radius} mi.</p>
                  )}
                  {error && <p className="error">{error}</p>}
                  {facilities.length > 0 && <>
                    <div className="toolbar-divider" />
                    <button className="filter-toggle-btn" onClick={() => setShowFilters(v => !v)}>
                      {showFilters ? '▲ Hide filters' : '▼ Show filters'}
                      {activeFilterCount > 0 && (
                        <span className="filter-active-badge">{activeFilterCount}</span>
                      )}
                    </button>
                    {!showFilters && activeFilterCount > 0 && (
                      <button className="filter-reset-inline" onClick={() => setFilters(resetFilters)}>
                        Reset filters
                      </button>
                    )}
                  </>}
                  {facilities.length > 0 && (
                    <div className="mobile-tabs">
                      <button className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>List</button>
                      <button className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>Map</button>
                    </div>
                  )}
                </div>

                {facilities.length > 0 && showFilters && (
                  <div className="toolbar-filters">
                    <FilterPanel
                      filters={filters}
                      onChange={setFilters}
                      facilities={facilities}
                      filteredCount={filteredFacilities.length}
                      inline
                    />
                  </div>
                )}
              </div>

            </div>

            <div className="results-grid">
              <div className={`results-map${mobileView === 'list' ? ' mobile-hidden' : ''}`}>
                <Map facilities={filteredFacilities} onSelect={handleSelect} selected={selected} hideZeroReleases={hideZeroReleases} mobileView={mobileView} />

                {/* Action bar — sits below the map, fills unused space on mobile */}
                <div className="action-bar">
                  <div className="action-bar-buttons">
                    <button className="action-btn" onClick={handleGeolocate} disabled={geoLoading} title="Use my location">
                      <svg className="action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="8" cy="8" r="2.5"/>
                        <line x1="8" y1="1" x2="8" y2="4.5"/>
                        <line x1="8" y1="11.5" x2="8" y2="15"/>
                        <line x1="1" y1="8" x2="4.5" y2="8"/>
                        <line x1="11.5" y1="8" x2="15" y2="8"/>
                      </svg>
                      <span>{geoLoading ? 'Locating…' : 'My Location'}</span>
                    </button>

                    <button
                      className={`action-btn${showRecent ? ' action-btn--active' : ''}`}
                      onClick={() => { setShowRecent(v => !v); setShowSavedInline(false) }}
                      title="Recent searches"
                    >
                      <svg className="action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="8" r="6.5"/>
                        <polyline points="8,4.5 8,8.5 10.5,10.5"/>
                      </svg>
                      <span>Recent</span>
                    </button>

                    <button
                      className={`action-btn${showSavedInline ? ' action-btn--active' : ''}`}
                      onClick={handleShowSaved}
                      title="Saved searches"
                    >
                      <svg className="action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 2h10v12.5l-5-3-5 3z"/>
                      </svg>
                      <span>Saved</span>
                    </button>

                    {searchedLocation && (
                      <button
                        className={`action-btn${shareToast ? ' action-btn--success' : ''}`}
                        onClick={handleShareSearch}
                        title="Share this search"
                      >
                        <svg className="action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          {shareToast ? (
                            <polyline points="2,8 6,12 14,4"/>
                          ) : (
                            <>
                              <polyline points="8,1 8,10"/>
                              <polyline points="4.5,4.5 8,1 11.5,4.5"/>
                              <path d="M2,9.5v5h12v-5"/>
                            </>
                          )}
                        </svg>
                        <span>{shareToast ? 'Copied!' : 'Share'}</span>
                      </button>
                    )}
                  </div>

                  {/* Recent searches dropdown */}
                  {showRecent && (
                    <div className="action-dropdown">
                      <p className="action-dropdown-label">Recent searches</p>
                      {recentSearches.length === 0
                        ? <p className="action-dropdown-empty">No recent searches yet</p>
                        : recentSearches.map((s, i) => (
                          <button key={i} className="action-dropdown-item" onClick={() => { setRadius(s.radius); handleSearch(s.location); setShowRecent(false) }}>
                            <span className="action-dropdown-item-name">{s.location}</span>
                            <span className="action-dropdown-item-meta">{s.radius} mi</span>
                          </button>
                        ))
                      }
                    </div>
                  )}

                  {/* Saved searches dropdown */}
                  {showSavedInline && (
                    <div className="action-dropdown">
                      <p className="action-dropdown-label">Saved searches</p>
                      {!user
                        ? <p className="action-dropdown-empty">Sign in to access saved searches</p>
                        : savedSearches.length === 0
                          ? <p className="action-dropdown-empty">No saved searches yet</p>
                          : savedSearches.map(s => (
                            <button key={s.id} className="action-dropdown-item" onClick={() => { setRadius(s.radius); handleSearch(s.location); setShowSavedInline(false) }}>
                              <span className="action-dropdown-item-name">{s.location}</span>
                              <span className="action-dropdown-item-meta">{s.radius} mi</span>
                            </button>
                          ))
                      }
                    </div>
                  )}
                </div>
              </div>


              <div className={`results-list${mobileView === 'map' ? ' mobile-hidden' : ''}`}>
                {filteredFacilities.length === 0 && facilities.length > 0 ? (
                  <div className="filter-empty-state">
                    <p>No facilities match your current filters.</p>
                    <button onClick={() => setFilters(resetFilters)}>Reset filters</button>
                  </div>
                ) : (<>
                  {/* Mobile: toggle between list and detail */}
                  <div className="show-mobile">
                    {!selected && <FacilityList facilities={filteredFacilities} onSelect={handleSelect} />}
                    {selected && <FacilityDetail facility={selected} user={user} onBack={() => setSelected(null)} />}
                  </div>
                  {/* Desktop: always show compact list */}
                  <div className="show-desktop">
                    <FacilityList facilities={filteredFacilities} onSelect={handleSelect} compact selectedId={selected?.id} />
                  </div>
                </>)}
              </div>
              {/* Desktop-only detail panel */}
              <div className="results-detail show-desktop">
                {selected
                  ? <FacilityDetail facility={selected} user={user} onBack={() => setSelected(null)} />
                  : <div className="detail-placeholder"><p>← Select a facility to view details</p></div>
                }
              </div>
            </div>
          </div>
        )}
      </main>

      {showSaved && (
        <SavedPanel
          onClose={() => setShowSaved(false)}
          onRunSearch={(location, miles) => { setRadius(miles); handleSearch(location) }}
        />
      )}
    </div>
  )
}

export default App
