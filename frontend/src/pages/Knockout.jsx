import React, { useMemo } from 'react'
import { predictions } from '../data/predictions_static'
import { GROUPS } from '../data/tournament'
import Flag from '../components/Flag'
import { useIsMobile } from '../hooks/useIsMobile'

const cp = predictions.champion_probabilities || {}

// ── Helpers ───────────────────────────────────────────────────
function getGroupForTeam(name) {
  return Object.entries(GROUPS).find(([, g]) => g.teams.includes(name))?.[0] || null
}
function getWinProb(team) {
  return team ? (cp[team]?.win_tournament || 0) : 0
}
function pickWinner(ta, tb) {
  if (!ta && !tb) return null
  if (!ta) return tb
  if (!tb) return ta
  return getWinProb(ta) >= getWinProb(tb) ? ta : tb
}

// ── Official FIFA 2026 R32 Bracket ───────────────────────────
// Sources: FIFA.com official bracket, ESPN, Fox Sports
// 16 matches confirmed (M73–M88)
const R32_PAIRS = [
  // ═══════════ QF1 QUADRANT (top-left) ═══════════
  { m:'M74', posA:'1E',       posB:'3(ABCDF)' },  // 0 Germany vs best 3rd
  { m:'M77', posA:'1I',       posB:'3(CDFGH)' },  // 1 France vs best 3rd
  { m:'M73', posA:'2A',       posB:'2B'       },  // 2 runner-up A vs B
  { m:'M75', posA:'1F',       posB:'2C'       },  // 3 1F vs runner-up C

  // ═══════════ QF2 QUADRANT (bottom-left) ═══════════
  { m:'M76', posA:'1C',       posB:'2F'       },  // 4 1C vs runner-up F
  { m:'M79', posA:'1A',       posB:'3(CEFHI)' },  // 5 Mexico vs best 3rd
  { m:'M78', posA:'2E',       posB:'2I'       },  // 6 runner-up E vs I
  { m:'M80', posA:'1L',       posB:'3(EHIJK)' },  // 7 England vs best 3rd

  // ═══════════ QF3 QUADRANT (top-right) ═══════════
  { m:'M83', posA:'2K',       posB:'2L'       },  // 8  runner-up K vs L
  { m:'M84', posA:'1H',       posB:'2J'       },  // 9  Spain vs runner-up J
  { m:'M81', posA:'1D',       posB:'3(BEFIJ)' },  // 10 USA vs best 3rd
  { m:'M82', posA:'1G',       posB:'3(AEHIJ)' },  // 11 1G vs best 3rd

  // ═══════════ QF4 QUADRANT (bottom-right) ═══════════
  { m:'M85', posA:'1K',       posB:'3(DEIJL)' },  // 12 1K vs best 3rd
  { m:'M86', posA:'1J',       posB:'2H'       },  // 13 Argentina vs runner-up H
  { m:'M87', posA:'1B',       posB:'3(ABCFG)' },  // 14 1B vs best 3rd
  { m:'M88', posA:'2D',       posB:'2G'       },  // 15 runner-up D vs G
]

// Third-place eligible groups per slot
const THIRD_SLOTS = {
  '3(ABCDF)': ['A','B','C','D','F'],
  '3(CDFGH)': ['C','D','F','G','H'],
  '3(CEFHI)': ['C','E','F','H','I'],
  '3(EHIJK)': ['E','H','I','J','K'],
  '3(BEFIJ)': ['B','E','F','I','J'],
  '3(AEHIJ)': ['A','E','H','I','J'],
  '3(DEIJL)': ['D','E','I','J','L'],
  '3(ABCFG)': ['A','B','C','F','G'],
}

// Assign best 8 thirds to eligible slots (greedy, most constrained first)
function assignThirds(bestThirds) {
  const assigned = {}
  const used = new Set()
  // Sort by most constrained (fewest eligible groups)
  const sorted = Object.entries(THIRD_SLOTS).sort((a, b) => a[1].length - b[1].length)
  for (const [key, eligible] of sorted) {
    const pick = bestThirds.find(t => !used.has(t) && eligible.includes(getGroupForTeam(t)))
            || bestThirds.find(t => !used.has(t))
            || null
    if (pick) { assigned[key] = pick; used.add(pick) }
  }
  return assigned
}

// Resolve position string to actual team
function resolvePos(pos, bracket, thirds) {
  if (!pos) return null
  if (pos.startsWith('1') || pos.startsWith('2')) return bracket[pos] || null
  if (pos.startsWith('3(')) return thirds[pos] || null
  return null
}

// Build entire knockout bracket from group stage results
function buildKnockout(bracket, bestThirds) {
  const thirds = assignThirds(bestThirds)

  // Resolve all 32 R32 participants
  const r32 = R32_PAIRS.map(p => ({
    ...p,
    teamA: resolvePos(p.posA, bracket, thirds),
    teamB: resolvePos(p.posB, bracket, thirds),
  }))

  // R32 → 16 winners
  const r32W = r32.map(p => pickWinner(p.teamA, p.teamB))

  // R16: adjacent pairs within each quadrant
  // Pairs [0,1] → R16 M0, [2,3] → R16 M1, [4,5] → R16 M2 ... [14,15] → R16 M7
  const r16W = []
  for (let i = 0; i < 8; i++)
    r16W.push(pickWinner(r32W[i*2], r32W[i*2+1]))

  // QF: pairs [0,1]→QF1, [2,3]→QF2, [4,5]→QF3, [6,7]→QF4
  const qfW = []
  for (let i = 0; i < 4; i++)
    qfW.push(pickWinner(r16W[i*2], r16W[i*2+1]))

  // SF: QF1+QF2 → SF1, QF3+QF4 → SF2
  const sf1 = pickWinner(qfW[0], qfW[1])
  const sf2 = pickWinner(qfW[2], qfW[3])

  // Final & Champion — TOUJOURS cohérents
  const champion = pickWinner(sf1, sf2)

  return { r32, r32W, r16W, qfW, sf1, sf2, champion }
}

// ── UI Components ─────────────────────────────────────────────
function TeamRow({ team, isWinner, showProb = true }) {
  if (!team) return (
    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 0',
                  opacity:0.35, borderBottom:'1px solid var(--border)' }}>
      <div style={{ width:24, height:16, borderRadius:3, background:'var(--surface4)' }}/>
      <span style={{ fontSize:11, color:'var(--text3)' }}>TBD</span>
    </div>
  )
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:7, padding:'5px 0',
      opacity: isWinner === false ? 0.40 : 1,
    }}>
      <Flag team={team} size={16} radius={2} />
      <span style={{ fontSize:11, fontWeight: isWinner ? 700 : 500,
                     color: isWinner ? 'var(--text1)' : 'var(--text2)',
                     flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {team}
      </span>
      {showProb && isWinner && (
        <span style={{ fontSize:10, color:'var(--gold)', fontWeight:700, flexShrink:0 }}>
          {(getWinProb(team)*100).toFixed(0)}%
        </span>
      )}
    </div>
  )
}

function MatchBox({ teamA, teamB, match = '' }) {
  const winner = pickWinner(teamA, teamB)
  return (
    <div style={{
      background:'var(--surface2)', border:'1px solid var(--border)',
      borderRadius:10, padding:'8px 12px', marginBottom:6, minWidth:180,
    }}>
      {match && (
        <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700,
                      letterSpacing:'0.07em', marginBottom:4 }}>{match}</div>
      )}
      <TeamRow team={teamA} isWinner={winner === teamA} />
      <div style={{ borderBottom:'1px solid var(--border)', margin:'1px 0' }}/>
      <TeamRow team={teamB} isWinner={winner === teamB} />
    </div>
  )
}

function QuadrantSection({ title, color, pairs, r16Match1, r16Match2, qfWinner }) {
  return (
    <div style={{ minWidth:210 }}>
      <div style={{ fontSize:11, fontWeight:800, color, letterSpacing:'0.08em',
                    marginBottom:10, paddingBottom:6,
                    borderBottom:`2px solid ${color}` }}>
        {title}
      </div>
      {/* R32 */}
      <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700,
                    letterSpacing:'0.06em', marginBottom:6 }}>ROUND OF 32</div>
      {pairs.map((p, i) => (
        <MatchBox key={i} teamA={p.teamA} teamB={p.teamB} match={p.m} />
      ))}
      {/* R16 */}
      <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700,
                    letterSpacing:'0.06em', marginBottom:6, marginTop:12 }}>ROUND OF 16</div>
      <MatchBox teamA={r16Match1} teamB={r16Match2} />
      {/* QF winner */}
      <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700,
                    letterSpacing:'0.06em', marginBottom:6, marginTop:12 }}>QUARTER-FINAL</div>
      {qfWinner ? (
        <div style={{
          padding:'10px 14px', borderRadius:10,
          background:`${color}18`, border:`1px solid ${color}44`,
          display:'flex', alignItems:'center', gap:8,
        }}>
          <Flag team={qfWinner} size={20} />
          <span style={{ fontSize:12, fontWeight:800, color:'var(--text1)', flex:1 }}>
            {qfWinner}
          </span>
          <span style={{ fontSize:11, color:'var(--gold)', fontWeight:700 }}>
            {(getWinProb(qfWinner)*100).toFixed(1)}%
          </span>
        </div>
      ) : (
        <div style={{ padding:'10px 14px', borderRadius:10,
                      background:'var(--surface3)', border:'1px solid var(--border)',
                      fontSize:11, color:'var(--text3)' }}>TBD</div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function Knockout() {
  const isMobile = useIsMobile()
  const bracket  = predictions.predicted_bracket || {}
  const bestThirds = bracket.best_thirds || []

  // ✅ TOUT calculé depuis une seule source → cohérence garantie
  const { r32, r32W, r16W, qfW, sf1, sf2, champion } = useMemo(
    () => buildKnockout(bracket, bestThirds),
    [bracket, bestThirds]
  )

  const QUADRANTS = [
    {
      title: 'QUADRANT 1', color: '#3b82f6',
      pairs:    r32.slice(0, 4),
      r16a:     r32W[0], r16b: r32W[1],
      r16c:     r32W[2], r16d: r32W[3],
      qfWinner: qfW[0],
    },
    {
      title: 'QUADRANT 2', color: '#8b5cf6',
      pairs:    r32.slice(4, 8),
      r16a:     r32W[4], r16b: r32W[5],
      r16c:     r32W[6], r16d: r32W[7],
      qfWinner: qfW[1],
    },
    {
      title: 'QUADRANT 3', color: '#f97316',
      pairs:    r32.slice(8, 12),
      r16a:     r32W[8], r16b: r32W[9],
      r16c:     r32W[10], r16d: r32W[11],
      qfWinner: qfW[2],
    },
    {
      title: 'QUADRANT 4', color: '#ef4444',
      pairs:    r32.slice(12, 16),
      r16a:     r32W[12], r16b: r32W[13],
      r16c:     r32W[14], r16d: r32W[15],
      qfWinner: qfW[3],
    },
  ]

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize: isMobile?22:30, fontWeight:900,
                     color:'var(--text1)', marginBottom:6 }}>
          🏆 Knockout Bracket
        </h1>
        <p style={{ fontSize:14, color:'var(--text2)' }}>
          Official FIFA 2026 bracket · Matches M73–M88 · 50,000 simulations
        </p>
      </div>

      {/* ── CHAMPION ── */}
      {champion && (
        <div style={{
          borderRadius:20, padding: isMobile?'24px':'36px',
          textAlign:'center', marginBottom:24,
          background:'linear-gradient(135deg,#1a1000,#2d2000,#1a1000)',
          border:'1px solid rgba(245,166,35,0.45)',
          boxShadow:'0 0 60px rgba(245,166,35,0.12)',
        }} className="fade-up">
          <div style={{ fontSize:40, marginBottom:8,
                        filter:'drop-shadow(0 0 20px rgba(245,166,35,0.6))' }}>🏆</div>
          <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700,
                        letterSpacing:'0.12em', marginBottom:12 }}>PREDICTED CHAMPION</div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
            <Flag team={champion} size={isMobile?56:72} />
          </div>
          <div style={{ fontSize: isMobile?20:26, fontWeight:900,
                        color:'var(--text1)', marginBottom:6 }}>{champion}</div>
          <div style={{ fontSize: isMobile?28:36, fontWeight:900, color:'var(--gold)' }}>
            {(getWinProb(champion)*100).toFixed(1)}%
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:24, marginTop:14 }}>
            {[['Final', cp[champion]?.qualify_final],
              ['SF',    cp[champion]?.qualify_sf],
              ['QF',    cp[champion]?.qualify_qf]].map(([l,v])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--gold)' }}>
                  {((v||0)*100).toFixed(0)}%
                </div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FINAL ── */}
      <div className="card" style={{ padding:'20px', marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)',
                      letterSpacing:'0.07em', marginBottom:14 }}>🏆 PREDICTED FINAL</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center' }}>
          {/* Finalist 1 */}
          <div style={{
            padding:'14px', borderRadius:12, textAlign:'center',
            background:'rgba(245,166,35,0.08)',
            border:`1px solid rgba(245,166,35,${sf1===champion?0.4:0.15})`,
          }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
              <Flag team={sf1} size={36} />
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--text1)' }}>{sf1 || 'TBD'}</div>
            <div style={{ fontSize:16, fontWeight:900,
                          color: sf1===champion ? 'var(--gold)' : 'var(--text2)', marginTop:4 }}>
              {sf1 ? `${(getWinProb(sf1)*100).toFixed(1)}%` : ''}
            </div>
            {sf1===champion && (
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700, marginTop:4 }}>
                🏆 CHAMPION
              </div>
            )}
          </div>

          <div style={{ textAlign:'center', fontSize:18, fontWeight:900,
                        color:'var(--text3)', flexShrink:0 }}>VS</div>

          {/* Finalist 2 */}
          <div style={{
            padding:'14px', borderRadius:12, textAlign:'center',
            background:'rgba(245,166,35,0.08)',
            border:`1px solid rgba(245,166,35,${sf2===champion?0.4:0.15})`,
          }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
              <Flag team={sf2} size={36} />
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--text1)' }}>{sf2 || 'TBD'}</div>
            <div style={{ fontSize:16, fontWeight:900,
                          color: sf2===champion ? 'var(--gold)' : 'var(--text2)', marginTop:4 }}>
              {sf2 ? `${(getWinProb(sf2)*100).toFixed(1)}%` : ''}
            </div>
            {sf2===champion && (
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700, marginTop:4 }}>
                🏆 CHAMPION
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SEMI-FINALS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {[[sf1, qfW[0], qfW[1], 'SEMI-FINAL 1'], [sf2, qfW[2], qfW[3], 'SEMI-FINAL 2']].map(
          ([winner, ta, tb, label], idx) => (
          <div key={label} className="card" style={{ padding:'16px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)',
                          letterSpacing:'0.07em', marginBottom:10 }}>{label}</div>
            {[[ta, winner===ta], [tb, winner===tb]].map(([team, isW], i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:8, padding:'6px 0',
                borderBottom: i===0?'1px solid var(--border)':'none',
                opacity: team&&!isW ? 0.45 : 1,
              }}>
                <Flag team={team} size={18} />
                <span style={{ fontSize:12, fontWeight: isW?800:500,
                               color: isW?'var(--text1)':'var(--text2)', flex:1 }}>
                  {team || 'TBD'}
                </span>
                {isW && (
                  <span style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>
                    → Final
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── FULL BRACKET by Quadrant ── */}
      <div className="card" style={{ padding:'24px', marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text1)', marginBottom:6 }}>
          📋 Full Bracket — Official FIFA Structure
        </div>
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:20 }}>
          Official match numbers M73–M88 · QF1+QF2 → SF1 · QF3+QF4 → SF2
        </div>
        <div style={{ overflowX:'auto', paddingBottom:8 }}>
          <div style={{ display:'flex', gap:20, minWidth:'max-content' }}>
            {QUADRANTS.map(q => (
              <QuadrantSection
                key={q.title}
                title={q.title}
                color={q.color}
                pairs={q.pairs}
                r16Match1={pickWinner(q.r16a, q.r16b)}
                r16Match2={pickWinner(q.r16c, q.r16d)}
                qfWinner={q.qfWinner}
              />
            ))}

            {/* Semi-finals + Final column */}
            <div style={{ minWidth:200, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--gold)',
                            letterSpacing:'0.08em', marginBottom:10,
                            paddingBottom:6, borderBottom:'2px solid var(--gold)' }}>
                SF → FINAL → 🏆
              </div>

              {/* SF1 */}
              <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700,
                            letterSpacing:'0.06em', marginBottom:6 }}>SEMI-FINAL 1</div>
              <MatchBox teamA={qfW[0]} teamB={qfW[1]} />

              {/* SF2 */}
              <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700,
                            letterSpacing:'0.06em', marginBottom:6, marginTop:12 }}>SEMI-FINAL 2</div>
              <MatchBox teamA={qfW[2]} teamB={qfW[3]} />

              {/* Final */}
              <div style={{ fontSize:9, color:'var(--gold)', fontWeight:700,
                            letterSpacing:'0.06em', marginBottom:6, marginTop:12 }}>FINAL</div>
              <MatchBox teamA={sf1} teamB={sf2} />

              {/* Champion */}
              {champion && (
                <div style={{
                  marginTop:12, padding:'12px', borderRadius:12, textAlign:'center',
                  background:'linear-gradient(135deg,rgba(245,166,35,0.2),rgba(245,166,35,0.05))',
                  border:'1px solid rgba(245,166,35,0.4)',
                }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>🏆</div>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>
                    <Flag team={champion} size={28} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:900, color:'var(--text1)' }}>
                    {champion}
                  </div>
                  <div style={{ fontSize:14, fontWeight:900, color:'var(--gold)', marginTop:4 }}>
                    {(getWinProb(champion)*100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Probability Table ── */}
      <div className="card" style={{ padding:'24px' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text1)', marginBottom:16 }}>
          📊 Full Probabilities — All Stages
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="wc-table">
            <thead>
              <tr>
                {['#','Team','R32','R16','QF','SF','Final','🏆 Title'].map(h=>(
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
                      {team===champion && <span style={{ fontSize:10 }}>🏆</span>}
                    </div>
                  </td>
                  {[prob.qualify_r32, prob.qualify_r16, prob.qualify_qf,
                    prob.qualify_sf, prob.qualify_final].map((v, j) => (
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