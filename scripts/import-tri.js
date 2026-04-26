// Usage: node scripts/import-tri.js <path-to-csv>
import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service role key bypasses RLS for bulk import
)

const BATCH_SIZE = 500

function num(val) {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
}

function toPounds(val, unit) {
  const n = num(val)
  return unit === 'Grams' ? n / 453.592 : n
}

async function readCSV(filePath) {
  const rows = []
  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  )
  for await (const row of parser) rows.push(row)
  return rows
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: node scripts/import-tri.js <path-to-csv>')
    process.exit(1)
  }

  console.log('Reading CSV file — this may take a minute for the national file...')
  const rows = await readCSV(filePath)
  console.log(`Read ${rows.length} rows`)

  // Collect unique facilities keyed by TRI facility ID
  // 2024 file headers include column numbers: "1. YEAR", "2. TRIFD", etc.
  const facilityMap = new Map()
  for (const row of rows) {
    const triId = row['2. TRIFD']
    if (!facilityMap.has(triId)) {
      facilityMap.set(triId, {
        tri_id: triId,
        name: row['4. FACILITY NAME'],
        address: row['5. STREET ADDRESS'],
        city: row['6. CITY'],
        state: row['8. ST'],
        zip_code: String(row['9. ZIP']).padStart(5, '0'),  // preserve leading zeros
        latitude: num(row['12. LATITUDE']),
        longitude: num(row['13. LONGITUDE']),
      })
    }
  }

  const facilities = [...facilityMap.values()]
  console.log(`Found ${facilities.length} unique facilities — upserting...`)

  // Upsert facilities in batches and collect their database IDs
  const triIdToDbId = new Map()
  for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
    const batch = facilities.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase
      .from('facilities')
      .upsert(batch, { onConflict: 'tri_id' })
      .select('id, tri_id')
    if (error) throw error
    for (const f of data) triIdToDbId.set(f.tri_id, f.id)
    console.log(`  facilities: ${Math.min(i + BATCH_SIZE, facilities.length)}/${facilities.length}`)
  }

  // Build release rows
  console.log('Inserting chemical releases...')
  const releases = []
  for (const row of rows) {
    const facilityId = triIdToDbId.get(row['2. TRIFD'])
    if (!facilityId) continue

    const unit = row['50. UNIT OF MEASURE'] || 'Pounds'
    const air =
      toPounds(row['51. 5.1 - FUGITIVE AIR'], unit) +
      toPounds(row['52. 5.2 - STACK AIR'], unit)
    const water = toPounds(row['53. 5.3 - WATER'], unit)
    const land =
      toPounds(row['57. 5.5.1 - LANDFILLS'], unit) +
      toPounds(row['58. 5.5.1A - RCRA C LANDFILL'], unit) +
      toPounds(row['59. 5.5.1B - OTHER LANDFILLS'], unit) +
      toPounds(row['60. 5.5.2 - LAND TREATMENT'], unit) +
      toPounds(row['62. 5.5.3A - RCRA SURFACE IM'], unit) +
      toPounds(row['63. 5.5.3B - OTHER SURFACE I'], unit) +
      toPounds(row['64. 5.5.4 - OTHER DISPOSAL'], unit)

    releases.push({
      facility_id: facilityId,
      year: parseInt(row['1. YEAR']),
      chemical: row['37. CHEMICAL'],
      air_releases_lbs: air,
      water_releases_lbs: water,
      land_releases_lbs: land,
      total_releases_lbs: air + water + land,
    })
  }

  for (let i = 0; i < releases.length; i += BATCH_SIZE) {
    const batch = releases.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('releases').insert(batch)
    if (error) throw error
    console.log(`  releases: ${Math.min(i + BATCH_SIZE, releases.length)}/${releases.length}`)
  }

  console.log(`\nDone! Imported ${facilities.length} facilities and ${releases.length} releases.`)
}

main().catch(err => { console.error(err); process.exit(1) })
