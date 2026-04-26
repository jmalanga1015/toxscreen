import { useState, useEffect, useRef } from 'react'
import SearchBar from './components/SearchBar'
import Map from './components/Map'
import FacilityList from './components/FacilityList'
import FacilityDetail from './components/FacilityDetail'
import { getFacilitiesNearZip } from './lib/supabase'
import './App.css'

function App() {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchedZip, setSearchedZip] = useState(null)
  const [radius, setRadius] = useState(25)
  const [selected, setSelected] = useState(null)
  const debounceRef = useRef(null)

  async function runSearch(zip, miles) {
    setLoading(true)
    setError(null)
    setSelected(null)
    try {
      const data = await getFacilitiesNearZip(zip, miles)
      setFacilities(data)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(zip) {
    setSearchedZip(zip)
    runSearch(zip, radius)
  }

  function handleRadiusChange(miles) {
    setRadius(miles)
    if (!searchedZip) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(searchedZip, miles), 400)
  }

  return (
    <div className="app">
      <header>
        <h1>ToxScreen</h1>
        <p>See what industrial facilities are releasing near you</p>
      </header>
      <main>
        <SearchBar onSearch={handleSearch} onRadiusChange={handleRadiusChange} radius={radius} loading={loading} />
        {error && <p className="error">{error}</p>}
        {searchedZip && !loading && (
          <p className="result-count">
            {facilities.length === 0
              ? `No reporting facilities found within ${radius} miles of ZIP code ${searchedZip}.`
              : `${facilities.length} facilit${facilities.length === 1 ? 'y' : 'ies'} found within ${radius} miles of ZIP code ${searchedZip}.`}
          </p>
        )}

        <Map facilities={facilities} onSelect={setSelected} />

        {!selected && <FacilityList facilities={facilities} onSelect={setSelected} />}
        {selected && <FacilityDetail facility={selected} onBack={() => setSelected(null)} />}
      </main>
    </div>
  )
}

export default App
