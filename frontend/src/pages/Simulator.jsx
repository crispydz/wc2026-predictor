import React, { useState } from 'react'
import { GROUPS, getFlag } from '../data/tournament'
import { getChampionProb } from '../data/predictions_static'
import ProbabilityBar from '../components/ProbabilityBar'

const ALL_TEAMS = Object.values(GROUPS).flatMap(g=>g.teams).sort()

// Simple client-side Poisson simulation
function poissonRandom(lambda) {
  let L=Math.exp(-lambda), k=0, p=1
  do { k++; p*=Math.random() } while(p>L)
  return k-1
}
function simMatch(eloA, eloB, attA, defA, attB, defB) {
  const eloAdj = 1/(1+Math.pow(10,(eloB-eloA)/400))
  const lamA = Math.max(0.3, attA*defB*(0.6+eloAdj*0.8))
  const lamB = Math.max(0.3, attB*defA*(0.6+(1-eloAdj)*0.8))
  return { ga:poissonRandom(lamA), gb:poissonRandom(lamB), lamA, lamB }
}

const TEAM_STATS = {
  Argentina:{elo:2055,att:1.85,def:0.60}, France:{elo:2025,att:1.80,def:0.62},
  Brazil:{elo:2010,att:1.75,def:0.65},    England:{elo:1985,att:1.65,def:0.70},
  Spain:{elo:1940,att:1.65,def:0.68},     Portugal:{elo:1945,att:1.70,def:0.67},
  Germany:{elo:1950,att:1.60,def:0.70},   Belgium:{elo:1935,att:1.55,def:0.72},
  Netherlands:{elo:1930,att:1.55,def:0.72},Uruguay:{elo:1895,att:1.40,def:0.76},
  Colombia:{elo:1855,att:1.50,def:0.78},  Morocco:{elo:1840,att:1.25,def:0.72},
  Senegal:{elo:1840,att:1.30,def:0.80},   Japan:{elo:1865,att:1.35,def:0.80},
  Croatia:{elo:1825,att:1.30,def:0.80},   Switzerland:{elo:1790,att:1.20,def:0.80},
  Mexico:{elo:1820,att:1.35,def:0.82},    Norway:{elo:1760,att:1.45,def:0.85},
  USA:{elo:1805,att:1.30,def:0.85},       Türkiye:{elo:1755,att:1.42,def:0.80},
  Austria:{elo:1745,att:1.15,def:0.92},   Ecuador:{elo:1745,att:1.12,def:0.98},
  "South Korea":{elo:1755,att:1.20,def:0.93}, Australia:{elo:1745,att:1.10,def:0.95},
  Sweden:{elo:1740,att:1.15,def:0.90},    "Ivory Coast":{elo:1720,att:1.18,def:0.97},
  Canada:{elo:1715,att:1.15,def:0.90},    Czechia:{elo:1685,att:1.10,def:0.95},
  Algeria:{elo:1655,att:1.00,def:1.00},   Tunisia:{elo:1720,att:1.00,def:0.98},
  Egypt:{elo:1695,att:1.05,def:0.97},     "South Africa":{elo:1580,att:0.78,def:1.05},
  Scotland:{elo:1660,att:1.05,def:1.00},  Ghana:{elo:1675,att:0.95,def:1.02},
  Iran:{elo:1660,att:1.05,def:0.95},      "Congo DR":{elo:1665,att:0.90,def:1.05},
  Paraguay:{elo:1650,att:0.92,def:1.02},  "Bosnia-Herzegovina":{elo:1650,att:0.90,def:1.05},
  "Saudi Arabia":{elo:1695,att:0.95,def:1.02}, Uzbekistan:{elo:1630,att:0.88,def:1.05},
  Qatar:{elo:1635,att:0.85,def:1.10},     Iraq:{elo:1605,att:0.85,def:1.08},
  Jordan:{elo:1580,att:0.78,def:1.12},    "Cabo Verde":{elo:1585,att:0.80,def:1.10},
  Panama:{elo:1575,att:0.75,def:1.15},    "New Zealand":{elo:1535,att:0.70,def:1.20},
  Haiti:{elo:1490,att:0.65,def:1.25},     "Curaçao":{elo:1490,att:0.62,def:1.28},
}

function getStats(team) {
  return TEAM_STATS[team] || {elo:1600,att:0.90,def:1.05}
}

export default function Simulator() {
  const [teamA, setTeamA] = useState('France')
  const [teamB, setTeamB] = useState('Argentina')
  const [result, setResult] = useState(null)
  const [simResults, setSimResults] = useState(null)
  const [running, setRunning] = useState(false)

  function computeProbabilities(ta, tb) {
    const sa = getStats(ta), sb = getStats(tb)
    const eloAdj = 1/(1+Math.pow(10,(sb.elo-sa.elo)/400))
    const lamA = Math.max(0.3, sa.att*sb.def*(0.6+eloAdj*0.8))
    const lamB = Math.max(0.3, sb.att*sa.def*(0.6+(1-eloAdj)*0.8))

    // Approximate win probs from ELO + lambda
    const hw = eloAdj * (1 + (lamA-lamB)*0.08)
    const aw = (1-eloAdj) * (1 + (lamB-lamA)*0.08)
    const drawBase = 0.25*(1-Math.abs(eloAdj-0.5)*1.5)
    const total = hw+aw+drawBase
    return {
      hw: Math.min(0.90,Math.max(0.05,hw/total)),
      d:  Math.min(0.40,Math.max(0.05,drawBase/total)),
      aw: Math.min(0.90,Math.max(0.05,aw/total)),
      lamA, lamB,
    }
  }

  function handleSimulate() {
    const sa = getStats(teamA), sb = getStats(teamB)
    const p  = computeProbabilities(teamA, teamB)

    // Score distribution: run 1000 quick sims
    const scores = {}
    let wA=0,wB=0,draws=0
    for(let i=0;i<1000;i++){
      const {ga,gb} = simMatch(sa.elo,sb.elo,sa.att,sa.def,sb.att,sb.def)
      const key=`${ga}-${gb}`
      scores[key]=(scores[key]||0)+1
      if(ga>gb)wA++; else if(gb>ga)wB++; else draws++
    }
    const topScores = Object.entries(scores).sort((a,bk)=>bk[1]-a[1]).slice(0,8)

    setResult({...p, wA:wA/10, wB:wB/10, draws:draws/10})
    setSimResults(topScores)
  }

  const probA = getChampionProb(teamA)
  const probB = getChampionProb(teamB)
  const stats = result ? [
    {label:'Victoire '+teamA, value:result.hw, color:'#3b82f6'},
    {label:'Match nul',       value:result.d,  color:'#64748b'},
    {label:'Victoire '+teamB, value:result.aw, color:'#f97316'},
  ] : []

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:30, fontWeight:900, color:'var(--text1)', marginBottom:6 }}>
          ⚽ Simulateur de Match
        </h1>
        <p style={{ fontSize:14, color:'var(--text2)' }}>
          Choisis deux équipes et simule leur confrontation
        </p>
      </div>

      {/* Team selectors */}
      <div className="card" style={{ padding:'28px', marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:20, alignItems:'center' }}>

          {/* Team A */}
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700,
                          letterSpacing:'0.07em', marginBottom:10 }}>🔵 ÉQUIPE A</div>
            <select value={teamA} onChange={e=>{setTeamA(e.target.value);setResult(null)}}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, fontSize:15, fontWeight:600,
                       color:'var(--text1)', background:'var(--surface3)',
                       border:'1px solid var(--border)', cursor:'pointer' }}>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{getFlag(t)} {t}</option>)}
            </select>
            <div style={{ textAlign:'center', marginTop:16 }}>
              <div style={{ fontSize:72 }}>{getFlag(teamA)}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--text1)', marginTop:8 }}>{teamA}</div>
              {probA && (
                <div style={{ fontSize:13, color:'var(--gold)', marginTop:4 }}>
                  🏆 {(probA.win_tournament*100).toFixed(1)}% de titre
                </div>
              )}
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                {[['ELO',getStats(teamA).elo,'#3b82f6'],
                  ['Attaque',(getStats(teamA).att*100).toFixed(0)+'%','#22c55e'],
                  ['Défense',(getStats(teamA).def*100).toFixed(0)+'%','#f59e0b']].map(([l,v,c])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between',
                                        fontSize:12, color:'var(--text2)' }}>
                    <span>{l}</span>
                    <span style={{ fontWeight:700, color:c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VS */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:900, color:'var(--text3)', marginBottom:16 }}>VS</div>
            <button onClick={handleSimulate} style={{
              padding:'14px 24px', borderRadius:14, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#f59e0b,#d97706)',
              color:'#0a0e1a', fontWeight:800, fontSize:15,
              boxShadow:'0 4px 20px rgba(245,158,11,0.4)',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e=>{e.target.style.transform='scale(1.05)';e.target.style.boxShadow='0 6px 28px rgba(245,158,11,0.5)'}}
              onMouseLeave={e=>{e.target.style.transform='scale(1)';e.target.style.boxShadow='0 4px 20px rgba(245,158,11,0.4)'}}>
              ⚽ SIMULER
            </button>
          </div>

          {/* Team B */}
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700,
                          letterSpacing:'0.07em', marginBottom:10 }}>🔴 ÉQUIPE B</div>
            <select value={teamB} onChange={e=>{setTeamB(e.target.value);setResult(null)}}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, fontSize:15, fontWeight:600,
                       color:'var(--text1)', background:'var(--surface3)',
                       border:'1px solid var(--border)', cursor:'pointer' }}>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{getFlag(t)} {t}</option>)}
            </select>
            <div style={{ textAlign:'center', marginTop:16 }}>
              <div style={{ fontSize:72 }}>{getFlag(teamB)}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--text1)', marginTop:8 }}>{teamB}</div>
              {probB && (
                <div style={{ fontSize:13, color:'var(--gold)', marginTop:4 }}>
                  🏆 {(probB.win_tournament*100).toFixed(1)}% de titre
                </div>
              )}
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                {[['ELO',getStats(teamB).elo,'#f97316'],
                  ['Attaque',(getStats(teamB).att*100).toFixed(0)+'%','#22c55e'],
                  ['Défense',(getStats(teamB).def*100).toFixed(0)+'%','#f59e0b']].map(([l,v,c])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between',
                                        fontSize:12, color:'var(--text2)' }}>
                    <span>{l}</span>
                    <span style={{ fontWeight:700, color:c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="fade-up">

          {/* Win probabilities */}
          <div className="card" style={{ padding:'24px' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--text1)', marginBottom:18 }}>
              📊 Probabilités (1,000 simulations)
            </div>

            {/* Big 3-way bar */}
            <div style={{ display:'flex', height:20, borderRadius:99, overflow:'hidden', gap:2, marginBottom:16 }}>
              <div style={{ width:`${result.hw}%`, background:'linear-gradient(90deg,#1d4ed8,#3b82f6)',
                            transition:'width 0.8s ease', display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:11, fontWeight:700, color:'white',
                            minWidth: result.hw>8?'auto':0 }}>
                {result.hw>8?`${result.hw.toFixed(0)}%`:''}
              </div>
              <div style={{ width:`${result.draws}%`, background:'#334155',
                            transition:'width 0.8s ease', display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--text2)',
                            minWidth: result.draws>8?'auto':0 }}>
                {result.draws>8?`${result.draws.toFixed(0)}%`:''}
              </div>
              <div style={{ width:`${result.wB}%`, background:'linear-gradient(90deg,#ea580c,#f97316)',
                            transition:'width 0.8s ease', display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:11, fontWeight:700, color:'white',
                            minWidth: result.wB>8?'auto':0 }}>
                {result.wB>8?`${result.wB.toFixed(0)}%`:''}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              {[
                {l:`✅ ${teamA} gagne`, v:result.hw, c:'#3b82f6'},
                {l:'🤝 Match nul',      v:result.draws, c:'#64748b'},
                {l:`✅ ${teamB} gagne`, v:result.wB, c:'#f97316'},
              ].map(({l,v,c})=>(
                <div key={l} style={{ textAlign:'center', padding:'16px', borderRadius:12,
                                      background:'var(--surface3)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:6, fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:26, fontWeight:900, color:c }}>{v.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Score distribution */}
          {simResults && (
            <div className="card" style={{ padding:'24px' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--text1)', marginBottom:16 }}>
                ⚽ Scores les plus probables
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {simResults.map(([score,count],i)=>{
                  const pct = count/10
                  const [ga,gb] = score.split('-').map(Number)
                  const winner = ga>gb?teamA:gb>ga?teamB:'Nul'
                  const col = ga>gb?'#3b82f6':gb>ga?'#f97316':'#64748b'
                  return (
                    <div key={score} style={{
                      padding:'14px', borderRadius:12, textAlign:'center',
                      background: i===0?'rgba(245,158,11,0.1)':'var(--surface3)',
                      border:`1px solid ${i===0?'rgba(245,158,11,0.3)':'var(--border)'}`,
                    }}>
                      {i===0 && <div style={{fontSize:10,color:'var(--gold)',fontWeight:700,marginBottom:4}}>+ PROBABLE</div>}
                      <div style={{ fontSize:22, fontWeight:900, color:'var(--text1)', fontFamily:'monospace' }}>
                        {score}
                      </div>
                      <div style={{ fontSize:11, color:col, fontWeight:600, marginTop:4 }}>{winner}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)', marginTop:4 }}>
                        {pct.toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--text3)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⚽</div>
          <div style={{ fontSize:16, fontWeight:600 }}>
            Sélectionne deux équipes et clique sur <strong style={{color:'var(--gold)'}}>SIMULER</strong>
          </div>
        </div>
      )}
    </div>
  )
}