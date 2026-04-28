import { useState, useRef } from 'react'
import SearchBar from './components/SearchBar'
import Map from './components/Map'
import FacilityList from './components/FacilityList'
import FacilityDetail from './components/FacilityDetail'
import SavedPanel from './components/SavedPanel'
import ContentPage from './components/ContentPage'
import { getFacilitiesNearZip, sendMagicLink, signOut, saveSearch } from './lib/supabase'
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
  const [activePage, setActivePage] = useState(null)

  const [authEmail, setAuthEmail] = useState('')
  const [authSent, setAuthSent] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const debounceRef = useRef(null)

  async function runSearch(location, miles) {
    setLoading(true)
    setError(null)
    setSelected(null)
    setMobileView('list')
    try {
      const data = await getFacilitiesNearZip(location, miles)
      setFacilities(data)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(location) {
    setSearchedLocation(location)
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

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="header-left">
            <span className="header-logo" onClick={() => setActivePage(null)} style={{cursor:'pointer'}}>ToxScreen</span>
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
            <div className="hero-text">
              <h2>Know what's being released near you</h2>
              <p>Search by ZIP code, city, or address to see EPA toxic release data for industrial facilities in your area.</p>
            </div>
            <div className="hero-search">
              <SearchBar onSearch={handleSearch} onRadiusChange={handleRadiusChange} radius={radius} loading={loading} />
            </div>
          </div>
        ) : (
          <div className="results-wrap">
            <div className="results-toolbar">
              <SearchBar onSearch={handleSearch} onRadiusChange={handleRadiusChange} radius={radius} loading={loading} />
              {hasResults && (
                <div className="result-row">
                  <p className="result-count">
                    {facilities.length === 0
                      ? `No reporting facilities found within ${radius} miles of ${searchedLocation}.`
                      : `${facilities.length} facilit${facilities.length === 1 ? 'y' : 'ies'} found within ${radius} miles of ${searchedLocation}.`}
                  </p>
                  {user && facilities.length > 0 && (
                    <button className="save-search-btn" onClick={handleSaveSearch}>Save search</button>
                  )}
                </div>
              )}
              {error && <p className="error">{error}</p>}
              {facilities.length > 0 && (
                <div className="mobile-tabs">
                  <button className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>List</button>
                  <button className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>Map</button>
                </div>
              )}
            </div>

            <div className="results-grid">
              <div className={`results-map${mobileView === 'list' ? ' mobile-hidden' : ''}`}>
                <Map facilities={facilities} onSelect={handleSelect} />
              </div>
              <div className={`results-list${mobileView === 'map' ? ' mobile-hidden' : ''}`}>
                {!selected && <FacilityList facilities={facilities} onSelect={handleSelect} />}
                {selected && <FacilityDetail facility={selected} user={user} onBack={() => setSelected(null)} />}
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
