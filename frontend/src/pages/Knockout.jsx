import React, { useMemo } from 'react'
import { predictions } from '../data/predictions_static'
import { GROUPS } from '../data/tournament'
import Flag from '../components/Flag'

// ── Layout ────────────────────────────────────────────────────
const SLOT   = 76    // px : hauteur d'un "slot" R32 (match + espace)
const MH     = 54    // px : hauteur d'un match box
const CW     = 182   // px : largeur d'une colonne
const LW     = 28    // px : largeur du connecteur entre colonnes
const HEADER = 30    // px : hauteur des headers
const CHAMP_W = 118  // px : largeur de la carte champion
const TOTAL_H = SLOT * 16          // = 1216 px
const TOTAL_W = 5*(CW+LW) + CHAMP_W + 20

// Centre Y d'un match dans la grille
function matchCenterY(round, idx) {
  const span = Math.pow(2, round)
  return span * SLOT * idx + span * SLOT / 2
}
// Top Y du match box (centré dans son slot)
function matchTopY(round, idx) {
  return matchCenterY(round, idx) - MH / 2
}
// X de début d'une colonne
function colX(round) { return round * (CW + LW) }

// ── Helpers ───────────────────────────────────────────────────
const cp = predictions.champion_probabilities || {}

function getGroupForTeam(name) {
  return Object.entries(GROUPS).find(([, g]) => g.teams.includes(name))?.[0] || null
}
function winProb(t) { return t ? (cp[t]?.win_tournament || 0) : 0 }
function pickWinner(a, b) {
  if (!a && !b) return null
  if (!a) return b
  if (!b) return a
  return winProb(a) >= winProb(b) ? a : b
}

// ── Bracket officiel FIFA 2026 (M73–M88) ─────────────────────
// Ordre : paires 0-1 → R16[0], paires 2-3 → R16[1] → QF[0]  (côté France)
//         paires 4-5 → R16[2], paires 6-7 → R16[3] → QF[1]  (côté England)
//         QF[0]+QF[1] → SF[0]
//         paires 8-11 → QF[2] (côté Spain), paires 12-15 → QF[3] (côté Argentina)
//         QF[2]+QF[3] → SF[1]   |   SF[0] vs SF[1] → Final
const QUADRANTS = [
    {
      title:'QUADRANT 1', color:'#3b82f6',
      pairs: r32?.slice(0,4) || [],
      r16a: r32W?.[0], r16b: r32W?.[1],
      r16c: r32W?.[2], r16d: r32W?.[3],
      qfWinner: qfW?.[0],
    },
    {
      title:'QUADRANT 2', color:'#8b5cf6',
      pairs: r32?.slice(4,8) || [],
      r16a: r32W?.[4], r16b: r32W?.[5],
      r16c: r32W?.[6], r16d: r32W?.[7],
      qfWinner: qfW?.[1],
    },
    {
      title:'QUADRANT 3', color:'#f97316',
      pairs: r32?.slice(8,12) || [],
      r16a: r32W?.[8],  r16b: r32W?.[9],
      r16c: r32W?.[10], r16d: r32W?.[11],
      qfWinner: qfW?.[2],
    },
    {
      title:'QUADRANT 4', color:'#ef4444',
      pairs: r32?.slice(12,16) || [],
      r16a: r32W?.[12], r16b: r32W?.[13],
      r16c: r32W?.[14], r16d: r32W?.[15],
      qfWinner: qfW?.[3],
    },
  ]

// Groupes éligibles pour chaque slot de 3e place
const THIRD_SLOTS = {
  '3(ABCDF)': ['A','B','C','D','F'],
  '3(CDFGH)': ['C','D','F','G','H'],
  '3(CEFHI)': ['C','E','F','H','I'],
  '3(EHIJK)': ['E','H','I','J','K'],
  '3(BEFIJ)': ['B','E','F','I','J'],
  '3(AEHIJ)': ['A','E','H','I','J'],
  '3(DEIJL)': ['D','E','I','J','L'],
  '3(EFGIJ)': ['E','F','G','I','J'],
}

function assignThirds(bestThirds) {
  const assigned = {}
  const used = new Set()
  const sorted = Object.entries(THIRD_SLOTS).sort((a, b) => a[1].length - b[1].length)
  for (const [key, eligible] of sorted) {
    const pick = bestThirds.find(t => !used.has(t) && eligible.includes(getGroupForTeam(t)))
              || bestThirds.find(t => !used.has(t))
              || null
    if (pick) { assigned[key] = pick; used.add(pick) }
  }
  return assigned
}

function resolvePos(pos, bracket, thirds) {
  if (!pos) return null
  if (pos.startsWith('1') || pos.startsWith('2')) return bracket[pos] || null
  if (pos.startsWith('3(')) return thirds[pos] || null
  return null
}

function buildKnockout(bracket, bestThirds) {
  const thirds = assignThirds(bestThirds)

  // R32 — résoudre les 16 paires
  const r32 = R32_PAIRS.map(p => ({
    ...p,
    teamA: resolvePos(p.posA, bracket, thirds),
    teamB: resolvePos(p.posB, bracket, thirds),
  }))
  const r32W = r32.map(p => pickWinner(p.teamA, p.teamB))

  // R16 — 8 matchs (paires adjacentes de R32)
  const r16 = Array.from({ length:8 }, (_, j) => ({
    teamA: r32W[j*2], teamB: r32W[j*2+1],
  }))
  const r16W = r16.map(p => pickWinner(p.teamA, p.teamB))

  // QF — 4 matchs
  const qf = Array.from({ length:4 }, (_, k) => ({
    teamA: r16W[k*2], teamB: r16W[k*2+1],
  }))
  const qfW = qf.map(p => pickWinner(p.teamA, p.teamB))

  // SF — 2 matchs (QF0+QF1 → SF0, QF2+QF3 → SF1)
  const sf = [
    { teamA: qfW[0], teamB: qfW[1] },   // SF1 : côté France + England
    { teamA: qfW[2], teamB: qfW[3] },   // SF2 : côté Spain + Argentina
  ]
  const sfW = sf.map(p => pickWinner(p.teamA, p.teamB))

  // Finale
  const final = { teamA: sfW[0], teamB: sfW[1] }
  const champion = pickWinner(final.teamA, final.teamB)

  return {
    allRounds: [r32, r16, qf, sf, [final]],
    r32W, r16W, qfW, sfW, champion,
  }
}

// ── Match Box ─────────────────────────────────────────────────
function MatchBox({ teamA, teamB, round, idx }) {
  const w    = pickWinner(teamA, teamB)
  const rowH = Math.floor((MH - 1) / 2)
  const top  = matchTopY(round, idx)
  const left = colX(round)

  return (
    <div style={{
      position:'absolute', top, left,
      width:CW, height:MH, zIndex:2,
      background:'var(--surface2)',
      border:'1px solid rgba(255,255,255,0.10)',
      borderRadius:8, overflow:'hidden',
    }}>
      {[teamA, teamB].map((team, i) => {
        const isW = !!team && team === w
        return (
          <React.Fragment key={i}>
            <div style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'0 9px', height:rowH,
              background: isW ? 'rgba(245,166,35,0.09)' : 'transparent',
              opacity: (team && !isW) ? 0.38 : 1,
            }}>
              {team
                ? <Flag team={team} size={13} radius={2} style={{ flexShrink:0 }} />
                : <div style={{ width:19, height:13, borderRadius:2,
                                background:'var(--surface4)', flexShrink:0 }} />
              }
              <span style={{
                fontSize:11, fontWeight: isW ? 700 : 400,
                color: isW ? 'var(--text1)' : 'var(--text2)',
                flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {team || t('ko.tbd')}
              </span>
              {isW && team && (
                <span style={{ fontSize:9, color:'var(--gold)', fontWeight:800, flexShrink:0 }}>
                  {(winProb(team)*100).toFixed(0)}%
                </span>
              )}
            </div>
            {i === 0 && (
              <div style={{ height:1, background:'rgba(255,255,255,0.07)' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Lignes de connexion SVG ────────────────────────────────────
function BracketLines() {
  const segs = []
  const S  = 'rgba(255,255,255,0.13)'
  const SW = 1.5

  // R32→R16, R16→QF, QF→SF, SF→Final
  for (let r = 0; r < 4; r++) {
    const n   = Math.pow(2, 4 - r)   // 16, 8, 4, 2
    const xR  = colX(r) + CW          // bord droit match
    const xM  = xR + LW / 2           // milieu connecteur
    const xNL = colX(r + 1)           // bord gauche colonne suivante

    for (let i = 0; i < n; i++) {
      const cy = matchCenterY(r, i)

      // Horizontale : match → milieu
      segs.push(
        <line key={`h-${r}-${i}`}
              x1={xR} y1={cy} x2={xM} y2={cy}
              stroke={S} strokeWidth={SW} />
      )

      // Paires : verticale + horizontale sortante
      if (i % 2 === 0 && i+1 < n) {
        const cy2  = matchCenterY(r, i+1)
        const cyMid = (cy + cy2) / 2

        segs.push(
          <line key={`v-${r}-${i}`}
                x1={xM} y1={cy} x2={xM} y2={cy2}
                stroke={S} strokeWidth={SW} />
        )
        segs.push(
          <line key={`hn-${r}-${i}`}
                x1={xM} y1={cyMid} x2={xNL} y2={cyMid}
                stroke={S} strokeWidth={SW} />
        )
      }
    }
  }

  // Connecteur Final → Champion
  const finalCy = matchCenterY(4, 0)
  const xFR     = colX(4) + CW
  segs.push(
    <line key="champ"
          x1={xFR} y1={finalCy} x2={xFR + LW} y2={finalCy}
          stroke="rgba(245,166,35,0.5)" strokeWidth={2} />
  )

  return (
    <svg style={{ position:'absolute', top:0, left:0,
                  pointerEvents:'none', overflow:'visible' }}
         width={TOTAL_W} height={TOTAL_H}>
      {segs}
    </svg>
  )
}

// ── Carte Champion (extrémité droite) ─────────────────────────
function ChampionCard({ team }) {
  if (!team) return null
  const cy = matchCenterY(4, 0)
  return (
    <div style={{
      position:'absolute',
      top: cy,
      left: colX(4) + CW + LW,
      transform:'translateY(-50%)',
      width: CHAMP_W - 10, zIndex:2,
      background:'linear-gradient(135deg,rgba(245,166,35,0.22),rgba(245,166,35,0.06))',
      border:'1px solid rgba(245,166,35,0.52)',
      borderRadius:12, padding:'10px 10px 12px',
      textAlign:'center',
    }}>
      <div style={{ fontSize:18, marginBottom:4 }}>🏆</div>
      <div style={{ display:'flex', justifyContent:'center', margin:'4px 0 6px' }}>
        <Flag team={team} size={28} />
      </div>
      <div style={{ fontSize:11, fontWeight:800, color:'var(--text1)',
                    lineHeight:1.2, marginBottom:4 }}>{team}</div>
      <div style={{ fontSize:14, fontWeight:900, color:'var(--gold)' }}>
        {(winProb(team)*100).toFixed(1)}%
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function Knockout() {
  const bracket    = predictions.predicted_bracket || {}
  const bestThirds = bracket.best_thirds || []

  const {
    allRounds, r32, r32W, r16W, qfW, sfW, champion,
  } = useMemo(
    () => buildKnockout(bracket, bestThirds),
    [JSON.stringify(bracket), JSON.stringify(bestThirds)]
  )

  const ROUND_LABELS = [
    { txt:t('ko.r32'),    col:'#3b82f6' },
    { txt:t('ko.r16'),    col:'#8b5cf6' },
    { txt:t('ko.qf'), col:'#f97316' },
    { txt:t('ko.sf'),    col:'#ef4444' },
    { txt:t('ko.final'),          col:'#f59e0b' },
  ]

  const QF_LABELS = [
    { label:'QF1', color:'#3b82f6', note:'🇫🇷 side' },
    { label:'QF2', color:'#8b5cf6', note:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 side' },
    { label:'QF3', color:'#f97316', note:'🇪🇸 side' },
    { label:'QF4', color:'#ef4444', note:'🇦🇷 side' },
  ]

  return (
    <div className="fade-up">

      {/* Titre */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:30, fontWeight:900, color:'var(--text1)', marginBottom:6 }}>
           t('ko.title')
        </h1>
        <p style={{ fontSize:14, color:'var(--text2)' }}>
           t('ko.sub')
        </p>
      </div>

      {/* Carte Champion */}
      {champion && (
        <div style={{
          borderRadius:20, padding:'28px', textAlign:'center', marginBottom:24,
          background:'linear-gradient(135deg,#1a1000,#2d2000,#1a1000)',
          border:'1px solid rgba(245,166,35,0.45)',
          boxShadow:'0 0 60px rgba(245,166,35,0.10)',
        }}>
          <div style={{ fontSize:38, marginBottom:6,
                        filter:'drop-shadow(0 0 18px rgba(245,166,35,0.6))' }}>🏆</div>
          <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700,
                        letterSpacing:'0.12em', marginBottom:12 }}>t('ko.champion')</div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
            <Flag team={champion} size={64} />
          </div>
          <div style={{ fontSize:22, fontWeight:900, color:'var(--text1)', marginBottom:4 }}>
            {champion}
          </div>
          <div style={{ fontSize:30, fontWeight:900, color:'var(--gold)', marginBottom:16 }}>
            {(winProb(champion)*100).toFixed(1)}%
          </div>

          {/* Finalistes */}
          <div style={{ display:'flex', justifyContent:'center', gap:32 }}>
            {sfW.map((finalist, i) => (
              <div key={i} style={{ textAlign:'center', opacity: finalist===champion ? 1 : 0.65 }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:4 }}>
                  <Flag team={finalist} size={24} />
                </div>
                <div style={{ fontSize:11, color:'var(--text2)', fontWeight:600, marginBottom:2 }}>
                  {finalist}
                </div>
                <div style={{ fontSize:11, fontWeight:700,
                              color: finalist===champion ? 'var(--gold)' : 'var(--text3)' }}>
                  {finalist===champion ? '🏆 Champion' : '🥈 Runner-up'}
                </div>
              </div>
            ))}
          </div>

          {/* Semi-finalistes */}
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:16,
                        flexWrap:'wrap' }}>
            {qfW.map((team, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
                borderRadius:99, background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.08)',
              }}>
                <Flag team={team} size={14} />
                <span style={{ fontSize:11, color:'var(--text2)' }}>{team}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bracket principal ── */}
      <div className="card" style={{ padding:'20px 16px', overflowX:'auto' }}>

        {/* Labels QF quadrants (sur la gauche du bracket) */}
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          {QF_LABELS.map((q, i) => (
            <div key={i} style={{
              flex:1, textAlign:'center', fontSize:9, fontWeight:700,
              color:q.color, letterSpacing:'0.07em', padding:'3px 0',
              borderBottom:`1px solid ${q.color}44`,
            }}>
              {q.label} · {q.note}
            </div>
          ))}
        </div>

        {/* Headers des colonnes */}
        <div style={{ position:'relative', height:HEADER, minWidth:TOTAL_W, marginBottom:8 }}>
          {ROUND_LABELS.map((r, i) => (
            <div key={i} style={{
              position:'absolute', left:colX(i), width:CW,
              textAlign:'center', fontSize:10, fontWeight:800,
              color:r.col, letterSpacing:'0.07em', textTransform:'uppercase',
            }}>
              {r.txt}
            </div>
          ))}
          <div style={{
            position:'absolute',
            left: colX(4) + CW + LW,
            width: CHAMP_W,
            textAlign:'center', fontSize:10, fontWeight:800,
            color:'#f59e0b', letterSpacing:'0.07em',
          }}>
            CHAMPION
          </div>
        </div>

        {/* Corps du bracket */}
        <div style={{ position:'relative', height:TOTAL_H, minWidth:TOTAL_W }}>

          {/* Zones colorées des quadrants (background guides) */}
          {[0,1,2,3].map(qi => {
            const top   = qi * SLOT * 4
            const h     = SLOT * 4
            const color = ['#3b82f6','#8b5cf6','#f97316','#ef4444'][qi]
            return (
              <div key={qi} style={{
                position:'absolute', left:0, top, height:h,
                width:4, borderRadius:99,
                background: color, opacity:0.35,
              }} />
            )
          })}

          {/* Lignes SVG connecteurs */}
          <BracketLines />

          {/* Match boxes — toutes les rondes */}
          {allRounds.map((matches, round) =>
            matches.map((match, idx) => (
              <MatchBox
                key={`r${round}-m${idx}`}
                teamA={match.teamA}
                teamB={match.teamB}
                round={round}
                idx={idx}
              />
            ))
          )}

          {/* Carte Champion (droite) */}
          <ChampionCard team={champion} />
        </div>
      </div>

      {/* Tableau des probabilités */}
      <div className="card" style={{ padding:'24px', marginTop:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text1)', marginBottom:16 }}>
           t('ko.prob')
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="wc-table">
            <thead>
              <tr>
                {['#','Team','R32','R16','QF','SF','Final','🏆 Title'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(cp)
                .sort((a, b) => b[1].win_tournament - a[1].win_tournament)
                .slice(0, 24)
                .map(([team, prob], i) => (
                <tr key={team}
                    style={{ background: team===champion ? 'rgba(245,166,35,0.05)' : undefined }}>
                  <td style={{ color:'var(--text3)', fontWeight:600 }}>{i+1}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Flag team={team} size={18} />
                      <span style={{ fontWeight:600, color:'var(--text1)' }}>{team}</span>
                      {team === champion && <span style={{ fontSize:10 }}>🏆</span>}
                    </div>
                  </td>
                  {[prob.qualify_r32, prob.qualify_r16, prob.qualify_qf,
                    prob.qualify_sf,  prob.qualify_final].map((v, j) => (
                    <td key={j} style={{ color:'var(--text2)' }}>
                      {((v||0)*100).toFixed(0)}%
                    </td>
                  ))}
                  <td>
                    <span style={{ fontWeight:800, color:'var(--gold)', fontSize:14 }}>
                      {((prob.win_tournament||0)*100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}