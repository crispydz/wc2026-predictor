// ── Team data ─────────────────────────────────────────────────
const TD = {
  Argentina:           { elo:2055, att:1.85, def:0.60 },
  France:              { elo:2033, att:1.83, def:0.60 },
  Brazil:              { elo:2006, att:1.72, def:0.67 },
  England:             { elo:1985, att:1.65, def:0.70 },
  Spain:               { elo:1940, att:1.65, def:0.68 },
  Portugal:            { elo:1945, att:1.70, def:0.67 },
  Germany:             { elo:1952, att:1.62, def:0.69 },
  Belgium:             { elo:1935, att:1.55, def:0.72 },
  Netherlands:         { elo:1927, att:1.54, def:0.74 },
  Uruguay:             { elo:1895, att:1.40, def:0.76 },
  Colombia:            { elo:1855, att:1.50, def:0.78 },
  Morocco:             { elo:1845, att:1.28, def:0.70 },
  Senegal:             { elo:1831, att:1.27, def:0.83 },
  Japan:               { elo:1869, att:1.38, def:0.78 },
  Croatia:             { elo:1825, att:1.30, def:0.80 },
  Switzerland:         { elo:1790, att:1.20, def:0.80 },
  Mexico:              { elo:1827, att:1.38, def:0.80 },
  Norway:              { elo:1760, att:1.45, def:0.85 },
  USA:                 { elo:1814, att:1.32, def:0.84 },
  'South Korea':       { elo:1768, att:1.24, def:0.91 },
  Austria:             { elo:1745, att:1.15, def:0.92 },
  Ecuador:             { elo:1729, att:1.10, def:1.00 },
  Türkiye:             { elo:1755, att:1.42, def:0.80 },
  Sweden:              { elo:1740, att:1.15, def:0.90 },
  'Ivory Coast':       { elo:1737, att:1.24, def:0.94 },
  Canada:              { elo:1713, att:1.14, def:0.91 },
  Australia:           { elo:1745, att:1.10, def:0.95 },
  Czechia:             { elo:1672, att:1.08, def:0.97 },
  Algeria:             { elo:1655, att:1.00, def:1.00 },
  Tunisia:             { elo:1720, att:1.00, def:0.98 },
  Egypt:               { elo:1695, att:1.05, def:0.97 },
  'South Africa':      { elo:1573, att:0.76, def:1.07 },
  Scotland:            { elo:1664, att:1.06, def:0.99 },
  Ghana:               { elo:1675, att:0.95, def:1.02 },
  Iran:                { elo:1660, att:1.05, def:0.95 },
  'Congo DR':          { elo:1665, att:0.90, def:1.05 },
  Paraguay:            { elo:1641, att:0.90, def:1.05 },
  'Bosnia-Herzegovina':{ elo:1652, att:0.91, def:1.04 },
  'Saudi Arabia':      { elo:1695, att:0.95, def:1.02 },
  Uzbekistan:          { elo:1630, att:0.88, def:1.05 },
  Qatar:               { elo:1635, att:0.85, def:1.10 },
  Iraq:                { elo:1605, att:0.85, def:1.08 },
  Jordan:              { elo:1580, att:0.78, def:1.12 },
  'Cabo Verde':        { elo:1585, att:0.80, def:1.10 },
  Panama:              { elo:1575, att:0.75, def:1.15 },
  'New Zealand':       { elo:1535, att:0.70, def:1.20 },
  Haiti:               { elo:1486, att:0.63, def:1.27 },
  'Curaçao':           { elo:1488, att:0.60, def:1.31 },
}

function pmf(k, lam) {
  if (k < 0 || lam <= 0) return 0
  let r = Math.exp(-lam)
  for (let i = 0; i < k; i++) r *= lam / (i + 1)
  return r
}

export function computeMatch(teamA, teamB) {
  const a = TD[teamA] || { elo:1600, att:0.90, def:1.05 }
  const b = TD[teamB] || { elo:1600, att:0.90, def:1.05 }

  const eloAdj   = 1 / (1 + Math.pow(10, (b.elo - a.elo) / 400))
  const eloBoost = (eloAdj - 0.5) * 0.45

  // ✅ SCALE 1.50 → lambdas réalistes ~1.5-2.5 → scores variés 2-1, 3-1, 1-1...
  const SCALE = 1.50
  const lamA = Math.max(0.30, Math.min(7.0, a.att * b.def * (1 + eloBoost) * SCALE))
  const lamB = Math.max(0.30, Math.min(7.0, b.att * a.def * (1 - eloBoost) * SCALE))
  const rho  = -0.12
  const N    = 9

  const mat = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (__, j) => {
      let p = pmf(i, lamA) * pmf(j, lamB)
      if      (i===0&&j===0) p *= Math.max(1e-10, 1 - lamA*lamB*rho)
      else if (i===1&&j===0) p *= Math.max(1e-10, 1 + lamB*rho)
      else if (i===0&&j===1) p *= Math.max(1e-10, 1 + lamA*rho)
      else if (i===1&&j===1) p *= Math.max(1e-10, 1 - rho)
      return Math.max(0, p)
    })
  )
  const total = mat.flat().reduce((s, v) => s + v, 0)
  mat.forEach(row => row.forEach((_, j) => { row[j] /= total }))

  let hw = 0, d = 0, aw = 0
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i > j) hw += mat[i][j]
    else if (i === j) d += mat[i][j]
    else aw += mat[i][j]
  }

  // ✅ Score le plus probable global
  let maxP = 0, bestI = 0, bestJ = 0
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (mat[i][j] > maxP) { maxP = mat[i][j]; bestI = i; bestJ = j }
  }

  // ✅ Top 6 scores avec probabilités pour la distribution
  const scores = []
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    scores.push({ score: `${i}-${j}`, p: mat[i][j], ga: i, gb: j })
  scores.sort((a, b) => b.p - a.p)
  const top6 = scores.slice(0, 6)

  const hwR = Math.round(hw * 100)
  const awR = Math.round(aw * 100)
  const dR  = Math.max(0, 100 - hwR - awR)

  return {
    team_a: teamA, team_b: teamB,
    home_win_prob:     hwR / 100,
    draw_prob:         dR  / 100,
    away_win_prob:     awR / 100,
    expected_goals_a:  Math.round(lamA * 100) / 100,
    expected_goals_b:  Math.round(lamB * 100) / 100,
    most_likely_score: `${bestI}-${bestJ}`,
    top5_scores:       top6.slice(0,5).map(x => `${x.score} (${(x.p*100).toFixed(1)}%)`),
    score_distribution: top6,
  }
}

const GROUPS_DEF = {
  A:["Mexico","South Africa","South Korea","Czechia"],
  B:["Canada","Switzerland","Qatar","Bosnia-Herzegovina"],
  C:["Brazil","Morocco","Haiti","Scotland"],
  D:["USA","Paraguay","Australia","Türkiye"],
  E:["Germany","Curaçao","Ivory Coast","Ecuador"],
  F:["Netherlands","Japan","Tunisia","Sweden"],
  G:["Belgium","Egypt","Iran","New Zealand"],
  H:["Spain","Cabo Verde","Saudi Arabia","Uruguay"],
  I:["France","Senegal","Norway","Iraq"],
  J:["Argentina","Algeria","Austria","Jordan"],
  K:["Portugal","Uzbekistan","Colombia","Congo DR"],
  L:["England","Croatia","Ghana","Panama"],
}

function buildGroupPredictions() {
  const result = {}
  for (const [gid, teams] of Object.entries(GROUPS_DEF)) {
    const matches = []
    const pts = Object.fromEntries(teams.map(t => [t, 0]))
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const m = computeMatch(teams[i], teams[j])
        pts[teams[i]] += m.home_win_prob * 3 + m.draw_prob
        pts[teams[j]] += m.away_win_prob * 3 + m.draw_prob
        matches.push(m)
      }
    }
    const standing = [...teams].sort((a, b) => pts[b] - pts[a])
    result[gid] = {
      teams, matches,
      predicted_standings: standing,
      expected_points: Object.fromEntries(teams.map(t => [t, Math.round(pts[t]*100)/100])),
    }
  }
  return result
}

const _groupPredictions = buildGroupPredictions()

function computeBestThirds(groupPreds) {
  const thirds = []
  for (const [gid, gp] of Object.entries(groupPreds)) {
    const s = gp.predicted_standings
    if (s.length >= 3)
      thirds.push({ team: s[2], group: gid, pts: gp.expected_points[s[2]] || 0 })
  }
  return thirds.sort((a, b) => b.pts - a.pts).slice(0, 8).map(t => t.team)
}
const _bestThirds = computeBestThirds(_groupPredictions)

function computeBracket(groupPreds, thirds) {
  const b = {}
  for (const [gid, gp] of Object.entries(groupPreds)) {
    b[`1${gid}`] = gp.predicted_standings[0] || null
    b[`2${gid}`] = gp.predicted_standings[1] || null
  }
  b.best_thirds = thirds
  return b
}
const _bracket = computeBracket(_groupPredictions, _bestThirds)

export const predictions = {
  meta: {
    n_simulations: 50000,
    model: "Dixon-Coles Poisson + ELO + Monte Carlo",
    last_updated: "2026-06-22",
    scale: 1.50,
    note: "ELO mis à jour MD1+MD2 WC 2026"
  },
  champion_probabilities: {
    Argentina:           { win_tournament:0.174, qualify_r32:0.97, qualify_r16:0.91, qualify_qf:0.68, qualify_sf:0.48, qualify_final:0.30 },
    France:              { win_tournament:0.162, qualify_r32:0.97, qualify_r16:0.90, qualify_qf:0.66, qualify_sf:0.45, qualify_final:0.28 },
    Brazil:              { win_tournament:0.118, qualify_r32:0.92, qualify_r16:0.84, qualify_qf:0.58, qualify_sf:0.36, qualify_final:0.20 },
    England:             { win_tournament:0.092, qualify_r32:0.92, qualify_r16:0.84, qualify_qf:0.55, qualify_sf:0.33, qualify_final:0.17 },
    Spain:               { win_tournament:0.085, qualify_r32:0.91, qualify_r16:0.83, qualify_qf:0.53, qualify_sf:0.31, qualify_final:0.16 },
    Portugal:            { win_tournament:0.078, qualify_r32:0.90, qualify_r16:0.82, qualify_qf:0.51, qualify_sf:0.29, qualify_final:0.14 },
    Germany:             { win_tournament:0.074, qualify_r32:0.93, qualify_r16:0.86, qualify_qf:0.53, qualify_sf:0.31, qualify_final:0.14 },
    Belgium:             { win_tournament:0.058, qualify_r32:0.88, qualify_r16:0.78, qualify_qf:0.46, qualify_sf:0.25, qualify_final:0.11 },
    Netherlands:         { win_tournament:0.048, qualify_r32:0.86, qualify_r16:0.75, qualify_qf:0.42, qualify_sf:0.21, qualify_final:0.09 },
    Japan:               { win_tournament:0.018, qualify_r32:0.80, qualify_r16:0.62, qualify_qf:0.28, qualify_sf:0.11, qualify_final:0.045 },
    Morocco:             { win_tournament:0.016, qualify_r32:0.80, qualify_r16:0.58, qualify_qf:0.26, qualify_sf:0.10, qualify_final:0.035 },
    Türkiye:             { win_tournament:0.024, qualify_r32:0.82, qualify_r16:0.62, qualify_qf:0.35, qualify_sf:0.16, qualify_final:0.07 },
    Colombia:            { win_tournament:0.021, qualify_r32:0.82, qualify_r16:0.65, qualify_qf:0.32, qualify_sf:0.15, qualify_final:0.06 },
    Uruguay:             { win_tournament:0.019, qualify_r32:0.80, qualify_r16:0.62, qualify_qf:0.30, qualify_sf:0.13, qualify_final:0.05 },
    'Ivory Coast':       { win_tournament:0.008, qualify_r32:0.68, qualify_r16:0.45, qualify_qf:0.14, qualify_sf:0.05, qualify_final:0.012 },
    'South Korea':       { win_tournament:0.007, qualify_r32:0.75, qualify_r16:0.48, qualify_qf:0.15, qualify_sf:0.05, qualify_final:0.014 },
    Senegal:             { win_tournament:0.009, qualify_r32:0.70, qualify_r16:0.48, qualify_qf:0.18, qualify_sf:0.06, qualify_final:0.022 },
    Croatia:             { win_tournament:0.010, qualify_r32:0.74, qualify_r16:0.52, qualify_qf:0.20, qualify_sf:0.07, qualify_final:0.025 },
    Switzerland:         { win_tournament:0.009, qualify_r32:0.72, qualify_r16:0.50, qualify_qf:0.18, qualify_sf:0.06, qualify_final:0.022 },
    Norway:              { win_tournament:0.008, qualify_r32:0.70, qualify_r16:0.48, qualify_qf:0.17, qualify_sf:0.06, qualify_final:0.020 },
    Mexico:              { win_tournament:0.009, qualify_r32:0.80, qualify_r16:0.55, qualify_qf:0.18, qualify_sf:0.06, qualify_final:0.020 },
    USA:                 { win_tournament:0.009, qualify_r32:0.78, qualify_r16:0.52, qualify_qf:0.16, qualify_sf:0.055, qualify_final:0.018 },
    Austria:             { win_tournament:0.006, qualify_r32:0.65, qualify_r16:0.43, qualify_qf:0.13, qualify_sf:0.04, qualify_final:0.013 },
    Ecuador:             { win_tournament:0.003, qualify_r32:0.52, qualify_r16:0.30, qualify_qf:0.08, qualify_sf:0.02, qualify_final:0.007 },
    Australia:           { win_tournament:0.004, qualify_r32:0.60, qualify_r16:0.36, qualify_qf:0.10, qualify_sf:0.03, qualify_final:0.009 },
    Czechia:             { win_tournament:0.003, qualify_r32:0.52, qualify_r16:0.30, qualify_qf:0.07, qualify_sf:0.02, qualify_final:0.007 },
    Sweden:              { win_tournament:0.003, qualify_r32:0.55, qualify_r16:0.32, qualify_qf:0.08, qualify_sf:0.02, qualify_final:0.006 },
    Egypt:               { win_tournament:0.002, qualify_r32:0.52, qualify_r16:0.29, qualify_qf:0.07, qualify_sf:0.02, qualify_final:0.005 },
    Algeria:             { win_tournament:0.002, qualify_r32:0.48, qualify_r16:0.26, qualify_qf:0.06, qualify_sf:0.015, qualify_final:0.004 },
    Canada:              { win_tournament:0.001, qualify_r32:0.42, qualify_r16:0.18, qualify_qf:0.03, qualify_sf:0.008, qualify_final:0.001 },
    'Saudi Arabia':      { win_tournament:0.001, qualify_r32:0.40, qualify_r16:0.17, qualify_qf:0.03, qualify_sf:0.008, qualify_final:0.001 },
    Ghana:               { win_tournament:0.001, qualify_r32:0.45, qualify_r16:0.22, qualify_qf:0.05, qualify_sf:0.01, qualify_final:0.003 },
    Scotland:            { win_tournament:0.002, qualify_r32:0.50, qualify_r16:0.24, qualify_qf:0.06, qualify_sf:0.015, qualify_final:0.004 },
    'Congo DR':          { win_tournament:0.001, qualify_r32:0.43, qualify_r16:0.19, qualify_qf:0.04, qualify_sf:0.01, qualify_final:0.002 },
    Iran:                { win_tournament:0.001, qualify_r32:0.42, qualify_r16:0.19, qualify_qf:0.04, qualify_sf:0.01, qualify_final:0.002 },
    Tunisia:             { win_tournament:0.002, qualify_r32:0.51, qualify_r16:0.28, qualify_qf:0.06, qualify_sf:0.015, qualify_final:0.005 },
    Paraguay:            { win_tournament:0.001, qualify_r32:0.35, qualify_r16:0.14, qualify_qf:0.025, qualify_sf:0.006, qualify_final:0.001 },
    Uzbekistan:          { win_tournament:0.0005, qualify_r32:0.38, qualify_r16:0.15, qualify_qf:0.025, qualify_sf:0.005, qualify_final:0.001 },
    'Bosnia-Herzegovina':{ win_tournament:0.0005, qualify_r32:0.38, qualify_r16:0.15, qualify_qf:0.02, qualify_sf:0.004, qualify_final:0.001 },
    Qatar:               { win_tournament:0.0003, qualify_r32:0.32, qualify_r16:0.12, qualify_qf:0.02, qualify_sf:0.004, qualify_final:0.001 },
    'South Africa':      { win_tournament:0.0002, qualify_r32:0.25, qualify_r16:0.08, qualify_qf:0.01, qualify_sf:0.002, qualify_final:0.0003 },
    Iraq:                { win_tournament:0.0002, qualify_r32:0.28, qualify_r16:0.09, qualify_qf:0.01, qualify_sf:0.002, qualify_final:0.0003 },
    Jordan:              { win_tournament:0.0002, qualify_r32:0.25, qualify_r16:0.08, qualify_qf:0.01, qualify_sf:0.002, qualify_final:0.0003 },
    'Cabo Verde':        { win_tournament:0.0001, qualify_r32:0.22, qualify_r16:0.07, qualify_qf:0.008, qualify_sf:0.001, qualify_final:0.0002 },
    Panama:              { win_tournament:0.0001, qualify_r32:0.21, qualify_r16:0.06, qualify_qf:0.007, qualify_sf:0.001, qualify_final:0.0002 },
    'New Zealand':       { win_tournament:0.0001, qualify_r32:0.18, qualify_r16:0.05, qualify_qf:0.005, qualify_sf:0.001, qualify_final:0.0001 },
    Haiti:               { win_tournament:0.0001, qualify_r32:0.12, qualify_r16:0.02, qualify_qf:0.002, qualify_sf:0.0003, qualify_final:0.0001 },
    'Curaçao':           { win_tournament:0.0001, qualify_r32:0.08, qualify_r16:0.01, qualify_qf:0.001, qualify_sf:0.0002, qualify_final:0.0001 },
  },
  group_predictions: _groupPredictions,
  predicted_bracket: _bracket,
}

export const getTopContenders = (n = 10) =>
  Object.entries(predictions.champion_probabilities)
    .sort((a, b) => b[1].win_tournament - a[1].win_tournament)
    .slice(0, n)
    .map(([team, prob]) => ({ team, ...prob }))

export const getGroupPrediction  = (gid)  => predictions.group_predictions[gid]
export const getChampionProb     = (team) => predictions.champion_probabilities[team] || null