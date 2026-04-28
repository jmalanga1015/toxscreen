import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSavedSearches() {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveSearch(location, radius) {
  const { error } = await supabase
    .from('saved_searches')
    .insert({ location, radius })
  if (error) throw error
}

export async function deleteSavedSearch(id) {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getSavedFacilities() {
  const { data, error } = await supabase
    .from('saved_facilities')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveFacility(facilityId, facilityName) {
  const { error } = await supabase
    .from('saved_facilities')
    .insert({ facility_id: facilityId, facility_name: facilityName })
  if (error) throw error
}

export async function deleteSavedFacility(id) {
  const { error } = await supabase
    .from('saved_facilities')
    .delete()
    .eq('id', id)
  if (error) throw error
}

async function geocodeLocation(query) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const encoded = encodeURIComponent(query)
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=US&access_token=${token}`
  )
  const json = await res.json()
  if (!json.features?.length) throw new Error(`Location "${query}" not found`)
  const [lng, lat] = json.features[0].center
  return { lat, lng }
}

export async function getFacilitiesNearZip(zip, radiusMiles = 25) {
  const { lat, lng } = await geocodeLocation(zip)

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
