export const TOURNAMENT = {
  name: "FIFA World Cup 2026",
  hosts: ["USA", "Canada", "Mexico"],
  dates: { start: "Jun 11, 2026", final: "Jul 19, 2026" },
  totalMatches: 104,
}

export const GROUPS = {
  A: { teams: ["Mexico","South Africa","South Korea","Czechia"] },
  B: { teams: ["Canada","Switzerland","Qatar","Bosnia-Herzegovina"] },
  C: { teams: ["Brazil","Morocco","Haiti","Scotland"] },
  D: { teams: ["USA","Paraguay","Australia","Türkiye"] },
  E: { teams: ["Germany","Curaçao","Ivory Coast","Ecuador"] },
  F: { teams: ["Netherlands","Japan","Tunisia","Sweden"] },
  G: { teams: ["Belgium","Egypt","Iran","New Zealand"] },
  H: { teams: ["Spain","Cabo Verde","Saudi Arabia","Uruguay"] },
  I: { teams: ["France","Senegal","Norway","Iraq"] },
  J: { teams: ["Argentina","Algeria","Austria","Jordan"] },
  K: { teams: ["Portugal","Uzbekistan","Colombia","Congo DR"] },
  L: { teams: ["England","Croatia","Ghana","Panama"] },
}

// Codes ISO 3166-1 pour flagcdn.com
export const COUNTRY_CODES = {
  Argentina: 'ar', France: 'fr', Brazil: 'br', England: 'gb-eng',
  Spain: 'es', Portugal: 'pt', Germany: 'de', Belgium: 'be',
  Netherlands: 'nl', Uruguay: 'uy', Colombia: 'co', Morocco: 'ma',
  Senegal: 'sn', Japan: 'jp', Croatia: 'hr', Switzerland: 'ch',
  Mexico: 'mx', Norway: 'no', USA: 'us', 'South Korea': 'kr',
  Austria: 'at', Ecuador: 'ec', Türkiye: 'tr', Sweden: 'se',
  'Ivory Coast': 'ci', Canada: 'ca', Australia: 'au', Czechia: 'cz',
  Algeria: 'dz', Tunisia: 'tn', Egypt: 'eg', 'South Africa': 'za',
  Scotland: 'gb-sct', Ghana: 'gh', Iran: 'ir', 'Congo DR': 'cd',
  Paraguay: 'py', 'Bosnia-Herzegovina': 'ba', 'Saudi Arabia': 'sa',
  Uzbekistan: 'uz', Qatar: 'qa', Iraq: 'iq', Jordan: 'jo',
  'Cabo Verde': 'cv', Panama: 'pa', 'New Zealand': 'nz',
  Haiti: 'ht', 'Curaçao': 'cw',
}

export const getFlagUrl = (team) => {
  const code = COUNTRY_CODES[team]
  return code ? `https://flagcdn.com/w40/${code}.png` : null
}

// Gardé pour compatibilité mais ne plus utiliser directement
export const getFlag = (team) => COUNTRY_CODES[team] ? team : '?'

export const getGroupForTeam = (name) =>
  Object.entries(GROUPS).find(([, g]) => g.teams.includes(name))?.[0] || null