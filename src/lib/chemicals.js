// Chemical concern levels and EPA IRIS classifications.
// https://www.epa.gov/iris
// Classifications follow EPA's 2005 Guidelines for Carcinogen Risk Assessment.
// irisClassification: carcinogenicity classification (or basis for concern if non-carcinogen)
//
// concern levels:
//   'high'   — "Carcinogenic to Humans" or "Likely to be Carcinogenic to Humans"
//   'medium' — "Suggestive Evidence of Carcinogenicity" or significant non-cancer health effects
//   'low'    — Minimal carcinogenic evidence; limited health effects at typical exposures

export const CHEMICAL_INFO = {
  'DIOXIN AND DIOXIN-LIKE COMPOUNDS': { concern: 'high', irisClassification: 'Carcinogenic to Humans' },
  'BENZENE':                    { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'ARSENIC':                    { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'ARSENIC COMPOUNDS':          { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'CHROMIUM COMPOUNDS':         { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'VINYL CHLORIDE':             { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'FORMALDEHYDE':               { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'TRICHLOROETHYLENE':          { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'NICKEL COMPOUNDS':           { concern: 'high',   irisClassification: 'Carcinogenic to Humans' },
  'SULFURIC ACID':              { concern: 'high',   irisClassification: 'Carcinogenic to Humans (acid mists only)' },
  'LEAD':                       { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'LEAD COMPOUNDS':             { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'LEAD AND LEAD COMPOUNDS':    { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'CADMIUM':                    { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'CADMIUM COMPOUNDS':          { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'PERCHLOROETHYLENE':          { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'HYDRAZINE':                  { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'STYRENE':                    { concern: 'high',   irisClassification: 'Likely to be Carcinogenic to Humans' },
  'NICKEL':                     { concern: 'medium', irisClassification: 'Suggestive Evidence of Carcinogenicity' },
  'MERCURY':                    { concern: 'medium', irisClassification: 'Documented neurological effects (EPA IRIS)' },
  'MERCURY COMPOUNDS':          { concern: 'medium', irisClassification: 'Documented neurological effects (EPA IRIS)' },
  'AMMONIA':                    { concern: 'medium', irisClassification: 'Documented respiratory effects (EPA IRIS)' },
  'NITRATE COMPOUNDS':          { concern: 'medium', irisClassification: 'Documented risk to infants via drinking water (EPA)' },
  'NITRATE COMPOUNDS (WATER DISSOCIABLE; REPORTABLE ONLY WHEN IN AQUEOUS SOLUTION)':
                                { concern: 'medium', irisClassification: 'Documented risk to infants via drinking water (EPA)' },
  'MANGANESE COMPOUNDS':        { concern: 'medium', irisClassification: 'Documented neurological effects (EPA IRIS)' },
  'TOLUENE':                    { concern: 'medium', irisClassification: 'Documented neurological effects (EPA IRIS)' },
  'HYDROCHLORIC ACID':          { concern: 'medium', irisClassification: 'Documented respiratory effects (EPA IRIS)' },
  'XYLENE':                     { concern: 'medium', irisClassification: 'Documented neurological effects (EPA IRIS)' },
  'XYLENES (MIXED ISOMERS)':    { concern: 'medium', irisClassification: 'Documented neurological effects (EPA IRIS)' },
  'METHANOL':                   { concern: 'low',    irisClassification: 'Limited health effects at typical exposures (EPA IRIS)' },
  'ETHYLENE GLYCOL':            { concern: 'low',    irisClassification: 'Limited health effects at typical exposures (EPA IRIS)' },
  'ZINC COMPOUNDS':             { concern: 'low',    irisClassification: 'Limited health effects at typical exposures (EPA IRIS)' },
  'COPPER':                     { concern: 'low',    irisClassification: 'Limited health effects at typical exposures (EPA IRIS)' },
  'COPPER COMPOUNDS':           { concern: 'low',    irisClassification: 'Limited health effects at typical exposures (EPA IRIS)' },
  'SILVER':                     { concern: 'low',    irisClassification: 'Limited health effects at typical exposures (EPA IRIS)' },
  'SILVER AND SILVER COMPOUNDS':{ concern: 'low',    irisClassification: 'Limited health effects at typical exposures (EPA IRIS)' },
}

const CONCERN_LABEL = {
  high:   'High Concern',
  medium: 'Moderate Concern',
  low:    'Low Concern',
}

export function getChemicalInfo(name) {
  return CHEMICAL_INFO[name.toUpperCase()] ?? null
}

export function getConcernLabel(concern) {
  return CONCERN_LABEL[concern] ?? concern
}
