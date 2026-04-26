import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

async function geocodeZip(zip) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?country=US&types=postcode&access_token=${token}`
  )
  const json = await res.json()
  if (!json.features?.length) throw new Error(`ZIP code ${zip} not found`)
  const [lng, lat] = json.features[0].center
  return { lat, lng }
}

export async function getFacilitiesNearZip(zip, radiusMiles = 25) {
  const { lat, lng } = await geocodeZip(zip)

  const { data: facilities, error } = await supabase
    .rpc('facilities_within_radius', { lat, lng, radius_miles: radiusMiles })
  if (error) throw error
  if (!facilities.length) return []

  // Fetch non-zero releases for all returned facilities in one query
  const ids = facilities.map(f => f.id)
  const { data: releases, error: relErr } = await supabase
    .from('releases')
    .select('facility_id, chemical, air_releases_lbs, water_releases_lbs, land_releases_lbs, total_releases_lbs, year')
    .in('facility_id', ids)
    .gt('total_releases_lbs', 0)
  if (relErr) throw relErr

  // Group releases by facility id
  const byFacility = {}
  for (const r of releases) {
    if (!byFacility[r.facility_id]) byFacility[r.facility_id] = []
    byFacility[r.facility_id].push(r)
  }

  return facilities.map(f => ({ ...f, releases: byFacility[f.id] || [] }))
}
