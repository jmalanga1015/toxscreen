// PubChem PUG View API — fetches toxicological information for chemicals.
// Two-step: resolve name → CID, then fetch toxicology section by CID.
// Results cached in localStorage for 7 days.

const CACHE_PREFIX = 'pubchem2_'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function getCached(name) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + name)
    if (!raw) return undefined
    const { value, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL_MS) return undefined
    return value
  } catch {
    return undefined
  }
}

function setCache(name, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + name, JSON.stringify({ value, timestamp: Date.now() }))
  } catch {}
}

async function getCID(name) {
  const res = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`
  )
  if (!res.ok) return null
  const json = await res.json()
  return json.IdentifierList?.CID?.[0] ?? null
}

function firstTwoSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]+/g)
  if (!matches) return text
  return matches.slice(0, 2).join(' ').trim()
}

// Recursively extract the first substantive text from PUG View's nested structure
function extractText(node) {
  if (!node) return null
  if (node.StringWithMarkup) {
    const text = node.StringWithMarkup[0]?.String
    if (text && text.length > 80) return firstTwoSentences(text)
  }
  for (const section of node.Section ?? []) {
    const text = extractText(section)
    if (text) return text
  }
  for (const info of node.Information ?? []) {
    const text = extractText(info.Value)
    if (text) return text
  }
  return null
}

async function fetchToxicology(cid) {
  const res = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Toxicological+Information`
  )
  if (!res.ok) return null
  const json = await res.json()
  return extractText(json.Record)
}

// TRI category names that don't match PubChem directly — map to a searchable compound name
const PUBCHEM_ALIASES = {
  'DIOXIN AND DIOXIN-LIKE COMPOUNDS': '2,3,7,8-Tetrachlorodibenzo-p-dioxin',
  'POLYCYCLIC AROMATIC COMPOUNDS': 'benzo[a]pyrene',
  'POLYBROMINATED BIPHENYLS': 'polybrominated biphenyl',
}

function stripCompounds(name) {
  return name
    .replace(/\s+and\s+\w+\s+compounds/i, '')
    .replace(/\s+compounds/i, '')
    .trim()
}

async function fetchDescription(name) {
  const cached = getCached(name)
  if (cached !== undefined) return cached

  try {
    // Try exact name first, then alias, then stripped fallback
    let cid = await getCID(name)
    let usedFallbackName = false
    if (!cid && PUBCHEM_ALIASES[name.toUpperCase()]) {
      cid = await getCID(PUBCHEM_ALIASES[name.toUpperCase()])
      usedFallbackName = true
    }
    if (!cid) {
      cid = await getCID(stripCompounds(name))
      usedFallbackName = true
    }

    if (!cid) { setCache(name, null); return null }

    const text = await fetchToxicology(cid)
    if (!text) { setCache(name, null); return null }

    // Reject chemistry-only descriptions fetched via stripped fallback
    const chemistryPhrases = ['atomic number', 'chemical element atom', 'group element atom']
    if (usedFallbackName && chemistryPhrases.some(p => text.toLowerCase().includes(p))) {
      setCache(name, null)
      return null
    }

    const result = { description: text, url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}` }
    setCache(name, result)
    return result
  } catch {
    setCache(name, null)
    return null
  }
}

export async function fetchChemicalDescriptions(names) {
  const results = {}
  // Smaller batches — each chemical now makes 2 API calls
  for (let i = 0; i < names.length; i += 2) {
    const batch = names.slice(i, i + 2)
    const settled = await Promise.allSettled(batch.map(fetchDescription))
    settled.forEach((r, j) => {
      results[batch[j]] = r.status === 'fulfilled' ? r.value : null
    })
    if (i + 2 < names.length) await new Promise(res => setTimeout(res, 400))
  }
  return results
}
