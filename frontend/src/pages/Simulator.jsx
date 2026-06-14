import React, { useState, useMemo } from 'react'
import { GROUPS, getFlag } from '../data/tournament'
import { getChampionProb, computeMatch } from '../data/predictions_static'
import RadarComparison from '../components/RadarComparison'
import { useIsMobile } from '../hooks/useIsMobile'

const ALL_TEAMS = Object.values(GROUPS).flatMap(g => g.teams).sort()

const KEY_PLAYERS = {
  // ── Europe ──
  France:      ['K. Mbappé', 'O. Dembélé', 'M. Olise', 'D. Doué'],
  England:     ['J. Bellingham', 'H. Kane', 'P. Foden'],
  Spain:       ['L. Yamal', 'Pedri', 'Gavi'],
  Portugal:    ['C. Ronaldo', 'B. Fernandes', 'R. Leão'],
  Germany:     ['J. Musiala', 'F. Wirtz', 'M. Neuer'],
  Belgium:     ['K. De Bruyne', 'R. Lukaku', 'T. Courtois'],
  Netherlands: ['V. van Dijk', 'C. Gakpo', 'F. de Jong'],
  Croatia:     ['L. Modrić', 'I. Gvardiol'],
  Switzerland: ['G. Xhaka', 'N. Elvedi'],
  Norway:      ['E. Haaland', 'M. Ødegaard'],
  Austria:     ['M. Sabitzer', 'C. Baumgartner'],
  Türkiye:     ['A. Güler', 'H. Çalhanoğlu'],
  Sweden:      ['A. Isak', 'D. Kulusevski'],
  Czechia:     ['P. Schick', 'T. Souček'],
  Scotland:    ['A. Robertson', 'S. McTominay'],

  // ── Amérique du Sud ──
  Argentina:   ['L. Messi', 'L. Martínez', 'J. Álvarez', 'A. Mac Allister'],
  Brazil:      ['Vinícius Jr.', 'Neymar', 'Raphinha'],
  Uruguay:     ['D. Núñez', 'F. Valverde'],
  Colombia:    ['L. Díaz', 'J. Rodríguez'],
  Ecuador:     ['M. Caicedo', 'E. Valencia'],

  // ── Amérique du Nord ──
  USA:         ['C. Pulisic', 'W. McKennie', 'G. Reyna'],
  Mexico:      ['H. Lozano', 'E. Álvarez'],
  Canada:      ['A. Davies', 'J. David'],

  // ── Afrique ──
  Morocco:     ['A. Hakimi', 'H. Ziyech'],
  Senegal:     ['S. Mané', 'I. Gueye'],
  Egypt:       ['M. Salah', 'M. Maignan'],
  "Ivory Coast":['S. Haller', 'F. Kessié'],
  Algeria:     ['R. Mahrez', 'M. Amoura'],
  Ghana:       ['M. Kudus', 'T. Partey'],

  // ── Asie ──
  Japan:       ['T. Kubo', 'D. Kamada'],
  'South Korea':['H. Son', 'M. Kim'],
  Iran:        ['M. Taremi', 'S. Azmoun'],
  Australia:   ['M. Ryan', 'M. Duke'],
  "Saudi Arabia":['S. Al-Dawsari'],
}

const INJURY_IMPACT = {
  // France — sans Griezmann
  'K. Mbappé':   0.22, 'O. Dembélé': 0.16, 'M. Olise': 0.13, 'D. Doué': 0.10,

  // Angleterre
  'J. Bellingham': 0.17, 'H. Kane': 0.14, 'P. Foden': 0.11,

  // Espagne
  'L. Yamal': 0.18, 'Pedri': 0.13, 'Gavi': 0.11,

  // Portugal
  'C. Ronaldo': 0.14, 'B. Fernandes': 0.14, 'R. Leão': 0.12,

  // Allemagne
  'J. Musiala': 0.16, 'F. Wirtz': 0.14, 'M. Neuer': 0.08,

  // Belgique
  'K. De Bruyne': 0.19, 'R. Lukaku': 0.13, 'T. Courtois': 0.09,

  // Pays-Bas
  'V. van Dijk': 0.12, 'C. Gakpo': 0.11, 'F. de Jong': 0.10,

  // Autres Europe
  'L. Modrić': 0.17, 'I. Gvardiol': 0.09,
  'G. Xhaka': 0.13, 'N. Elvedi': 0.08,
  'E. Haaland': 0.30, 'M. Ødegaard': 0.14,
  'A. Güler': 0.15, 'H. Çalhanoğlu': 0.12,
  'A. Isak': 0.16, 'D. Kulusevski': 0.10,
  'P. Schick': 0.14, 'T. Souček': 0.10,
  'A. Robertson': 0.10, 'S. McTominay': 0.12,
  'M. Sabitzer': 0.11, 'C. Baumgartner': 0.09,

  // Argentine
  'L. Messi': 0.24, 'L. Martínez': 0.14,
  'J. Álvarez': 0.12, 'A. Mac Allister': 0.13,

  // Brésil
  'Vinícius Jr.': 0.20, 'Neymar': 0.16, 'Raphinha': 0.11,

  // Autres Amérique du Sud
  'D. Núñez': 0.15, 'F. Valverde': 0.12,
  'L. Díaz': 0.14, 'J. Rodríguez': 0.13,
  'M. Caicedo': 0.13, 'E. Valencia': 0.11,

  // USA / Canada / Mexique
  'C. Pulisic': 0.17, 'W. McKennie': 0.10, 'G. Reyna': 0.11,
  'A. Davies': 0.18, 'J. David': 0.14,
  'H. Lozano': 0.12, 'E. Álvarez': 0.10,

  // Afrique
  'A. Hakimi': 0.13, 'H. Ziyech': 0.11,
  'S. Mané': 0.18, 'I. Gueye': 0.08,
  'M. Salah': 0.30, 'R. Mahrez': 0.16,
  'M. Kudus': 0.15, 'T. Partey': 0.10,
  'S. Haller': 0.13, 'F. Kessié': 0.10,

  // Asie
  'H. Son': 0.22, 'M. Kim': 0.09,
  'T. Kubo': 0.12, 'D. Kamada': 0.09,
  'M. Taremi': 0.15, 'S. Azmoun': 0.10,
  'M. Ryan': 0.07, 'M. Duke': 0.11,
  'S. Al-Dawsari': 0.15,
}

function pmf(k, lam) {
  if (k < 0 || lam <= 0) return 0
  let r = Math.exp(-lam)
  for (let i = 0; i < k; i++) r *= lam / (i + 1)
  return r
}

function computeAdjusted(teamA, teamB, injuredA, injuredB) {
  const base = computeMatch(teamA, teamB)
  const impA = injuredA.reduce((s, p) => s + (INJURY_IMPACT[p] || 0.08), 0)
  const impB = injuredB.reduce((s, p) => s + (INJURY_IMPACT[p] || 0.08), 0)
  const factA = Math.max(0.5, 1 - impA * 0.75)
  const factB = Math.max(0.5, 1 - impB * 0.75)
  const lamA  = Math.max(0.3, base.expected_goals_a * factA)
  const lamB  = Math.max(0.3, base.expected_goals_b * factB)
  const N = 9, rho = -0.12
  const mat = Array.from({length:N},(_,i)=>Array.from({length:N},(__,j)=>{
    let p = pmf(i,lamA)*pmf(j,lamB)
    if(i===0&&j===0) p*=Math.max(1e-10,1-lamA*lamB*rho)
    else if(i===1&&j===0) p*=Math.max(1e-10,1+lamB*rho)
    else if(i===0&&j===1) p*=Math.max(1e-10,1+lamA*rho)
    else if(i===1&&j===1) p*=Math.max(1e-10,1-rho)
    return Math.max(0,p)
  }))
  const tot = mat.flat().reduce((s,v)=>s+v,0)
  mat.forEach(row=>row.forEach((_,j)=>{row[j]/=tot}))
  let hw=0,d=0,aw=0,maxP=0,bI=1,bJ=0
  for(let i=0;i<N;i++) for(let j=0;j<N;j++){
    if(i>j)hw+=mat[i][j]; else if(i===j)d+=mat[i][j]; else aw+=mat[i][j]
    if(mat[i][j]>maxP){maxP=mat[i][j];bI=i;bJ=j}
  }
  const hwR=Math.round(hw*100),awR=Math.round(aw*100),dR=Math.max(0,100-hwR-awR)
  return {
    team_a:teamA, team_b:teamB,
    home_win_prob:hwR/100, draw_prob:dR/100, away_win_prob:awR/100,
    expected_goals_a:Math.round(lamA*100)/100,
    expected_goals_b:Math.round(lamB*100)/100,
    most_likely_score:`${bI}-${bJ}`,
  }
}

const TABS = [
  { id: 'proba',   label: '📊 Probabilités' },
  { id: 'radar',   label: '🕸️ Radar' },
]

export default function Simulator() {
  const isMobile = useIsMobile()
  const [teamA,    setTeamA]    = useState('France')
  const [teamB,    setTeamB]    = useState('Argentina')
  const [injuredA, setInjuredA] = useState([])
  const [injuredB, setInjuredB] = useState([])
  const [tab,      setTab]      = useState('proba')

  const base     = useMemo(() => computeMatch(teamA, teamB), [teamA, teamB])
  const adjusted = useMemo(() => computeAdjusted(teamA, teamB, injuredA, injuredB), [teamA, teamB, injuredA, injuredB])
  const hasInj   = injuredA.length > 0 || injuredB.length > 0
  const result   = hasInj ? adjusted : base

  const hw = Math.round(result.home_win_prob * 100)
  const aw = Math.round(result.away_win_prob * 100)
  const dw = Math.max(0, 100 - hw - aw)

  const probA = getChampionProb(teamA)
  const probB = getChampionProb(teamB)

  function toggleInj(player, side) {
    if (side === 'A') setInjuredA(p => p.includes(player) ? p.filter(x => x !== player) : [...p, player])
    else              setInjuredB(p => p.includes(player) ? p.filter(x => x !== player) : [...p, player])
  }

  const TeamSelector = ({ team, setTeam, injured, side, color }) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700,
                    letterSpacing: '0.07em', marginBottom: 8 }}>
        {side === 'A' ? '🔴' : '🔵'} ÉQUIPE {side}
      </div>
      <select value={team} onChange={e => { setTeam(e.target.value); side==='A'?setInjuredA([]):setInjuredB([]) }}
        style={{ width: '100%', padding: '11px 16px', borderRadius: 12,
                 border: `1px solid ${color}44`, background: 'var(--surface3)',
                 color: 'var(--text1)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        {ALL_TEAMS.map(t => <option key={t} value={t}>{getFlag(t)} {t}</option>)}
      </select>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 64 }}>{getFlag(team)}</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text1)', marginTop: 6 }}>{team}</div>
        {(side === 'A' ? probA : probB) && (
          <div style={{ fontSize: 13, color: 'var(--gold)', marginTop: 4 }}>
            🏆 {(((side==='A'?probA:probB).win_tournament)*100).toFixed(1)}% de titre
          </div>
        )}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[['xG moy.', result.expected_goals_a?.toFixed(2)||'—'],
            ['ELO', (side==='A'?result.elo_a:result.elo_b)||'—'],
            ['Rank', (side==='A'?probA:probB)?`Top ${Math.ceil(((side==='A'?probA:probB).win_tournament||0.001)*1000)}`:'—']
          ].map(([l,v]) => (
            <div key={l} style={{ padding: '6px 4px', background: 'var(--surface4)',
                                   borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Injuries */}
      {KEY_PLAYERS[team] && (
        <div style={{ marginTop: 16, padding: '12px', background: 'var(--surface3)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700,
                        letterSpacing: '0.06em', marginBottom: 8 }}>🩹 BLESSURES</div>
          {KEY_PLAYERS[team].map(p => (
            <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8,
                                     cursor: 'pointer', marginBottom: 6, fontSize: 12 }}>
              <input type="checkbox" checked={injured.includes(p)}
                onChange={() => toggleInj(p, side)}
                style={{ accentColor: color, width: 14, height: 14 }} />
              <span style={{ color: injured.includes(p) ? color : 'var(--text2)',
                             fontWeight: injured.includes(p) ? 700 : 400 }}>
                {p}
              </span>
              {INJURY_IMPACT[p] && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)' }}>
                  -{Math.round(INJURY_IMPACT[p]*100)}% att.
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text1)', marginBottom: 6 }}>
          ⚽ Simulateur de Match
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          Simule n'importe quel match · Gère les blessures · Radar
        </p>
      </div>

      {/* Team selectors */}
      <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{
  display:'flex', gap:20, alignItems:'flex-start',
  flexDirection: isMobile ? 'column' : 'row',
}}>
  <TeamSelector team={teamA} setTeam={setTeamA} injured={injuredA}
                side="A" color="var(--red)" />
  {/* Center */}
  <div style={{
    display:'flex', flexDirection: isMobile?'row':'column',
    alignItems:'center', justifyContent:'center',
    gap:12, paddingTop: isMobile?0:48, flexShrink:0,
    width: isMobile?'100%':'auto',
  }}>
    <div style={{ fontSize:18, fontWeight:900, color:'var(--text3)' }}>VS</div>
    <div style={{
      padding:'10px 18px', background:'var(--surface3)',
      borderRadius:12, border:'1px solid var(--border2)', textAlign:'center',
      flex: isMobile?1:undefined,
    }}>
      <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700,
                    letterSpacing:'0.06em', marginBottom:4 }}>SCORE PRÉDIT</div>
      <div style={{ fontSize:26, fontWeight:900, color:'var(--gold)', fontFamily:'monospace' }}>
        {result.most_likely_score}
      </div>
    </div>
    {hasInj && (
      <div className="badge badge-red" style={{ fontSize:10 }}>⚠️ Blessures</div>
    )}
  </div>
  <TeamSelector team={teamB} setTeam={setTeamB} injured={injuredB}
                side="B" color="var(--blue-light)" />
</div>

      {/* Blessures impact */}
      {hasInj && (
        <div className="card" style={{ padding: '20px', marginBottom: 20,
                                        border: '1px solid rgba(232,39,27,0.3)',
                                        background: 'rgba(232,39,27,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 12 }}>
            ⚠️ Impact des blessures
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              [`✓ ${teamA}`, base.home_win_prob, adjusted.home_win_prob, '#3b82f6'],
              ['Match nul',   base.draw_prob,     adjusted.draw_prob,     '#64748b'],
              [`✓ ${teamB}`, base.away_win_prob, adjusted.away_win_prob, '#ef4444'],
            ].map(([label, before, after, color]) => {
              const diff = Math.round((after - before) * 100)
              return (
                <div key={label} style={{ padding: '12px', background: 'var(--surface3)',
                                          borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color }}>
                    {Math.round(after * 100)}%
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700,
                                color: diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : 'var(--text3)' }}>
                    {diff > 0 ? `+${diff}` : diff}% vs sans blessures
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Résultat bar */}
      <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>{getFlag(teamA)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', height: 14, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
              <div style={{ width: `${hw}%`, background: 'linear-gradient(90deg,#1A56DB,#3B82F6)',
                            borderRadius: '99px 0 0 99px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white',
                            transition: 'width 0.8s ease', minWidth: hw > 10 ? 'auto' : 0 }}>
                {hw > 10 ? `${hw}%` : ''}
              </div>
              <div style={{ width: `${dw}%`, background: '#2D3748', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: 'var(--text2)',
                            transition: 'width 0.8s ease', minWidth: dw > 10 ? 'auto' : 0 }}>
                {dw > 10 ? `Nul ${dw}%` : ''}
              </div>
              <div style={{ width: `${aw}%`, background: 'linear-gradient(90deg,#C53030,#E53E3E)',
                            borderRadius: '0 99px 99px 0', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white',
                            transition: 'width 0.8s ease', minWidth: aw > 10 ? 'auto' : 0 }}>
                {aw > 10 ? `${aw}%` : ''}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 22 }}>{getFlag(teamB)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ fontWeight: 800, color: '#63B3ED' }}>
            {getFlag(teamA)} {teamA} — {hw}%
          </span>
          <span style={{ color: 'var(--text3)' }}>Nul — {dw}%</span>
          <span style={{ fontWeight: 800, color: '#FC8181' }}>
            {teamB} {getFlag(teamB)} — {aw}%
          </span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
          xG: {result.expected_goals_a} — {result.expected_goals_b}
          {result.top5_scores && ` · Top scores: ${result.top5_scores.slice(0,3).join(', ')}`}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: tab === t.id ? 'rgba(232,39,27,0.15)' : 'var(--surface2)',
            color:      tab === t.id ? 'var(--red)' : 'var(--text2)',
            outline:    tab === t.id ? '1px solid rgba(232,39,27,0.3)' : '1px solid var(--border)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card" style={{ padding: '28px' }}>
        {tab === 'proba' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)', marginBottom: 20 }}>
              📊 Analyse détaillée
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { l: `✅ ${teamA} gagne`, v: hw, c: '#3b82f6' },
                { l: '🤝 Match nul',       v: dw, c: '#64748b' },
                { l: `✅ ${teamB} gagne`, v: aw, c: '#ef4444' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ textAlign: 'center', padding: '20px', borderRadius: 14,
                                       background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: c }}>{v}%</div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)',
                                overflow: 'hidden', marginTop: 10 }}>
                    <div style={{ width: `${v}%`, height: '100%', background: c,
                                   borderRadius: 99, transition: 'width 0.9s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Top 5 scores */}
            {result.top5_scores && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 12 }}>
                  ⚽ Scores les plus probables
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                  {result.top5_scores.map((s, i) => {
                    const [score, prob] = s.split(' ')
                    const [ga, gb] = score.split('-').map(Number)
                    const col = ga > gb ? '#3b82f6' : ga < gb ? '#ef4444' : '#64748b'
                    return (
                      <div key={i} style={{
                        padding: '14px 8px', borderRadius: 12, textAlign: 'center',
                        background: i === 0 ? 'rgba(245,166,35,0.12)' : 'var(--surface3)',
                        border: `1px solid ${i === 0 ? 'rgba(245,166,35,0.35)' : 'var(--border)'}`,
                      }}>
                        {i === 0 && (
                          <div style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>
                            + PROBABLE
                          </div>
                        )}
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text1)',
                                       fontFamily: 'monospace' }}>{score}</div>
                        <div style={{ fontSize: 11, color: col, fontWeight: 600, marginTop: 4 }}>
                          {ga > gb ? teamA : ga < gb ? teamB : 'Nul'}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>
                          {prob}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'radar' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)', marginBottom: 20 }}>
              🕸️ Comparaison Radar — 5 dimensions
            </div>
            <RadarComparison teamA={teamA} teamB={teamB} />
          </div>
        )}
      </div>
    </div>
  )
}