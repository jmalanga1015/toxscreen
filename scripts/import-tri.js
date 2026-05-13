/**
 * TRI Basic Data File importer
 *
 * Usage:
 *   node scripts/import-tri.js <path-to-csv> [--dry-run]
 *
 * Download files from:
 *   https://www.epa.gov/toxics-release-inventory-tri-program/tri-basic-data-files-calendar-years-1987-present
 *   Click a year → download the "1a" national file (all facilities, basic releases).
 *   Filename pattern: US_1a_YYYY.csv  (2000+)  or  US_#_YYYY.csv  (older years)
 *
 * Notes on column names across years:
 *   The numbered-header format ("1. YEAR", "2. TRIFD", …) has been used since 1998.
 *   Pre-1998 files use the same column order but may lack lat/lng — those rows
 *   are imported with lat=0/lng=0 and will not appear in radius searches.
 *   Re-running for the same year is safe: releases for that year are deleted first.
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service role key bypasses RLS
)

const BATCH_SIZE = 500
const DRY_RUN = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Column resolution — handles numbered headers ("1. YEAR") and any plain
// fallbacks for edge-case older files.
// ---------------------------------------------------------------------------
function col(row, ...candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== '') return row[c]
  }
  return ''
}

function num(val) {
  const n = parseFloat(String(val).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

function toPounds(val, unit) {
  const n = num(val)
  if (!n) return 0
  // Some years report in Grams (mostly dioxins/furans)
  return unit === 'Grams' ? n / 453.592 : n
}

// ---------------------------------------------------------------------------
// CSV reader
// ---------------------------------------------------------------------------
async function readCSV(filePath) {
  const rows = []
  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  )
  for await (const row of parser) rows.push(row)
  return rows
}

// ---------------------------------------------------------------------------
// Column name helpers — EPA has used consistent numbered headers since 1998
// but column *numbers* for release fields shifted slightly pre-2000.
// We try the known 1998+ names first, then fall back to plain names.
// ---------------------------------------------------------------------------
function extractFacility(row) {
  return {
    tri_id:    col(row, '2. TRIFD', 'TRIFD', 'TRI_FACILITY_ID'),
    name:      col(row, '4. FACILITY NAME', 'FACILITY NAME', 'FAC_NAME'),
    address:   col(row, '5. STREET ADDRESS', 'STREET ADDRESS', 'FAC_STREET'),
    city:      col(row, '6. CITY', 'CITY', 'FAC_CITY'),
    state:     col(row, '8. ST', 'ST', 'FAC_STATE'),
    zip_code:  String(col(row, '9. ZIP', 'ZIP', 'FAC_ZIP') || '').padStart(5, '0').slice(0, 10),
    latitude:  num(col(row, '12. LATITUDE',  'LATITUDE',  'FAC_LAT')),
    longitude: num(col(row, '13. LONGITUDE', 'LONGITUDE', 'FAC_LONG')),
  }
}

function extractRelease(row, facilityId) {
  const year = parseInt(col(row, '1. YEAR', 'YEAR'))
  const unit = col(row, '50. UNIT OF MEASURE', '47. UNIT OF MEASURE', 'UNIT_OF_MEASURE') || 'Pounds'
  const chemical = col(row, '37. CHEMICAL', '34. CHEMICAL', 'CHEMICAL')

  // Fugitive + stack air
  const air =
    toPounds(col(row, '51. 5.1 - FUGITIVE AIR',   '48. 5.1 - FUGITIVE AIR',  'FUGITIVE_AIR'),  unit) +
    toPounds(col(row, '52. 5.2 - STACK AIR',       '49. 5.2 - STACK AIR',     'STACK_AIR'),     unit)

  // Water
  const water =
    toPounds(col(row, '53. 5.3 - WATER', '50. 5.3 - WATER', 'WATER_DISCHARGE'), unit)

  // Land (all sub-categories)
  const land =
    toPounds(col(row, '57. 5.5.1 - LANDFILLS',        '54. 5.5.1 - LANDFILLS',        'LANDFILLS'),        unit) +
    toPounds(col(row, '58. 5.5.1A - RCRA C LANDFILL',  '55. 5.5.1A - RCRA C LANDFILL', 'RCRA_C_LANDFILL'),  unit) +
    toPounds(col(row, '59. 5.5.1B - OTHER LANDFILLS',  '56. 5.5.1B - OTHER LANDFILLS', 'OTHER_LANDFILLS'),  unit) +
    toPounds(col(row, '60. 5.5.2 - LAND TREATMENT',    '57. 5.5.2 - LAND TREATMENT',   'LAND_TREATMENT'),   unit) +
    toPounds(col(row, '62. 5.5.3A - RCRA SURFACE IM',  '59. 5.5.3A - RCRA SURFACE IM', 'RCRA_SURFACE_IM'),  unit) +
    toPounds(col(row, '63. 5.5.3B - OTHER SURFACE I',  '60. 5.5.3B - OTHER SURFACE I', 'OTHER_SURFACE_I'),  unit) +
    toPounds(col(row, '64. 5.5.4 - OTHER DISPOSAL',    '61. 5.5.4 - OTHER DISPOSAL',   'OTHER_DISPOSAL'),   unit)

  return {
    facility_id: facilityId,
    year,
    chemical,
    air_releases_lbs:   air,
    water_releases_lbs: water,
    land_releases_lbs:  land,
    total_releases_lbs: air + water + land,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const filePath = process.argv.find((a, i) => i > 1 && !a.startsWith('--'))
  if (!filePath) {
    console.error('Usage: node scripts/import-tri.js <path-to-csv> [--dry-run]')
    process.exit(1)
  }

  console.log(`Reading ${filePath}…`)
  const rows = await readCSV(filePath)
  console.log(`  ${rows.length.toLocaleString()} rows read`)

  if (rows.length === 0) { console.error('No rows — check the file path.'); process.exit(1) }

  // Detect reporting year from first data row
  const reportingYear = parseInt(col(rows[0], '1. YEAR', 'YEAR'))
  if (!reportingYear) { console.error('Could not detect year from first row.'); process.exit(1) }
  console.log(`  Reporting year: ${reportingYear}`)

  // ── Facilities ──────────────────────────────────────────────────────────
  const facilityMap = new Map()
  for (const row of rows) {
    const triId = col(row, '2. TRIFD', 'TRIFD', 'TRI_FACILITY_ID')
    if (triId && !facilityMap.has(triId)) {
      facilityMap.set(triId, extractFacility(row))
    }
  }

  const facilities = [...facilityMap.values()]
  console.log(`\n${facilities.length.toLocaleString()} unique facilities`)

  const triIdToDbId = new Map()

  if (!DRY_RUN) {
    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
      const batch = facilities.slice(i, i + BATCH_SIZE)
      const { data, error } = await supabase
        .from('facilities')
        .upsert(batch, { onConflict: 'tri_id' })
        .select('id, tri_id')
      if (error) throw error
      for (const f of data) triIdToDbId.set(f.tri_id, f.id)
      process.stdout.write(`\r  facilities: ${Math.min(i + BATCH_SIZE, facilities.length)}/${facilities.length}`)
    }
    console.log()
  } else {
    console.log('  [dry-run] skipping upsert')
  }

  // ── Releases ─────────────────────────────────────────────────────────────
  // Delete existing releases for this year first — makes re-imports idempotent
  if (!DRY_RUN) {
    console.log(`\nDeleting existing releases for ${reportingYear}…`)
    const { error } = await supabase.from('releases').delete().eq('year', reportingYear)
    if (error) throw error
    console.log('  Done.')
  }

  const releases = []
  let skipped = 0
  for (const row of rows) {
    const triId = col(row, '2. TRIFD', 'TRIFD', 'TRI_FACILITY_ID')
    const facilityId = triIdToDbId.get(triId)
    if (!facilityId) { skipped++; continue }

    const r = extractRelease(row, facilityId)
    if (!r.chemical) { skipped++; continue }
    // Only store rows with at least some release (keeps DB lean)
    if (r.total_releases_lbs > 0) releases.push(r)
  }

  console.log(`\n${releases.toLocaleString ? releases.length.toLocaleString() : releases.length} release rows (${skipped} skipped / zero-release rows excluded)`)

  if (!DRY_RUN) {
    for (let i = 0; i < releases.length; i += BATCH_SIZE) {
      const batch = releases.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('releases').insert(batch)
      if (error) throw error
      process.stdout.write(`\r  releases: ${Math.min(i + BATCH_SIZE, releases.length)}/${releases.length}`)
    }
    console.log()
  } else {
    console.log('  [dry-run] skipping insert')
  }

  console.log(`\n✓ Done — ${reportingYear}: ${facilities.length} facilities, ${releases.length} release rows`)
}

main().catch(err => { console.error('\nError:', err.message || err); process.exit(1) })
