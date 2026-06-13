import React, { useState, useMemo } from 'react'
import { predictions, computeMatch } from '../data/predictions_static'
import { GROUPS, getFlag } from '../data/tournament'

const ALL_TEAMS = Object.values(GROUPS).flatMap(g=>g.teams).sort()
const cp = predictions.champion_probabilities
const gp = predictions.group_predictions
const bracket = predictions.predicted_bracket

function getGroupForTeam(team) {
  return Object.entries(GROUPS).find(([,g])=>g.teams.includes(team))?.[0]
}

function getGroupOpponents(team) {
  const gid = getGroupForTeam(team)
  if (!gid) return []
  return GROUPS[gid].teams.filter(t=>t!==team)
}

function getPredictedRank(team) {
  const gid = getGroupForTeam(team)
  if (!gid) return 1
  const standing = gp[gid]?.predicted_standings || []
  const idx = standing.indexOf(team)
  return idx >= 0 ? idx + 1 : 1
}

function getR32Opponent(team) {
  const gid = getGroupForTeam(team)
  const rank = getPredictedRank(team)
  if (!gid) return null
  if (rank === 1) {
    // Find who 1{gid} faces in R32
    const r32Map = {
      A:'2C', B:'2A', C:'2B', D:'2F', E:'2D', F:'2E',
      G:'2I', H:'2G', I:'2H', J:'2L', K:'2J', L:'2K'
    }
    const oppPos = r32Map[gid]
    return bracket[oppPos] || null
  } else if (rank === 2) {
    // Runner-up
    const r32Map = {
      A:'1B', B:'1C', C:'1A', D:'1E', E:'1F', F:'1D',
      G:'1H', H:'1I', I:'1G', J:'1K', K:'1L', L:'1J'
    }
    const oppPos = r32Map[gid]
    return bracket[oppPos] || null
  }
  return null
}

function getWinProb(team) { return cp[team]?.win_tournament || 0 }
function pickWinner(ta, tb) {
  if (!ta || !tb) return ta || tb
  return getWinProb(ta) >= getWinProb(tb) ? ta : tb
}

function getTeamPath(team) {
  const steps = []
  const gid = getGroupForTeam(team)
  const rank = getPredictedRank(team)
  const opponents = getGroupOpponents(team)

  // Group stage
  steps.push({
    round: 'Phase de Groupes',
    icon: '🗂️',
    description: `Groupe ${gid} · Position prédite : ${rank}${rank===1?'er':rank===2?'e':'e'}`,
    opponents,
    matches: opponents.map(opp => ({...computeMatch(team, opp), opp})),
    stageProb: cp[team]?.qualify_r32 || 0,
    color: '#0066CC',
  })

  // R32
  const r32Opp = getR32Opponent(team)
  if (r32Opp) {
    const m = computeMatch(team, r32Opp)
    steps.push({
      round: 'Round of 32',
      icon: '⚡',
      opponent: r32Opp,
      match: m,
      stageProb: cp[team]?.qualify_r16 || 0,
      color: '#7C3AED',
    })
  }

  // From R16 onward, use most likely opponents based on bracket
  const r16Teams = Object.entries(bracket)
    .filter(([k])=>k.startsWith('1')||k.startsWith('2'))
    .map(([,v])=>v).filter(Boolean)

  // Build round by round
  const rounds = [
    {key:'qualify_qf',  name:'Quarts de finale',  icon:'🔥', color:'#F97316'},
    {key:'qualify_sf',  name:'Demi-finales',       icon:'⭐', color:'#E8271B'},
    {key:'qualify_final',name:'Finale',            icon:'🏆', color:'#F5A623'},
  ]

  rounds.forEach(({key,name,icon,color}) => {
    // Find most likely opponent at this stage
    // Use win_tournament as proxy for strength
    const topTeams = Object.entries(cp)
      .sort((a,b)=>b[1].win_tournament-a[1].win_tournament)
      .slice(0,16).map(([t])=>t)
      .filter(t=>t!==team)

    const likelyOpp = topTeams[rounds.indexOf({key,name,icon,color}) * 2] || topTeams[0]
    const m = computeMatch(team, likelyOpp)
    steps.push({
      round: name, icon, opponent: likelyOpp,
      match: m, stageProb: cp[team]?.[key] || 0, color,
    })
  })

  // Final step: champion
  steps.push({
    round: 'Champion 🏆',
    icon: '👑',
    stageProb: cp[team]?.win_tournament || 0,
    color: '#F5A623',
    isChampion: true,
  })

  return steps
}

function ProbBadge({ prob, color }) {
  const pct = Math.round(prob*100)
  return (
    <div style={{
      padding:'6px 14px', borderRadius:99,
      background: `rgba(${color==='#22c55e'?'34,197,94':color==='#f59e0b'?'245,158,11':'232,39,27'},0.15)`,
      border: `1px solid ${color}44`,
      fontSize:13, fontWeight:800, color,
    }}>
      {pct}%
    </div>
  )
}

export default function PathToGlory() {
  const [team, setTeam] = useState('France')
  const path = useMemo(() => getTeamPath(team), [team])
  const champProb = cp[team]?.win_tournament || 0

  const probColor = (p) => p>0.6?'#22c55e':p>0.35?'#f59e0b':'#ef4444'

  return (
    <div className="fade-up">
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:30,fontWeight:900,color:'var(--text1)',marginBottom:6}}>
          🛤️ Chemin vers la Gloire
        </h1>
        <p style={{fontSize:14,color:'var(--text2)'}}>
          Le parcours prédit de chaque équipe du groupe à la finale
        </p>
      </div>

      {/* Team selector */}
      <div className="card" style={{padding:'24px',marginBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,
                         letterSpacing:'0.07em',marginBottom:8}}>CHOISIR UNE ÉQUIPE</div>
            <select value={team} onChange={e=>setTeam(e.target.value)}
              style={{padding:'12px 20px',borderRadius:12,border:'1px solid var(--border2)',
                     background:'var(--surface3)',color:'var(--text1)',fontSize:15,fontWeight:600,
                     cursor:'pointer',minWidth:220}}>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{getFlag(t)} {t}</option>)}
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontSize:64}}>{getFlag(team)}</div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:'var(--text1)'}}>{team}</div>
              <div style={{fontSize:14,color:'var(--text2)',marginTop:4}}>
                Probabilité de titre :{' '}
                <span style={{fontWeight:900,color:'var(--gold)',fontSize:20}}>
                  {(champProb*100).toFixed(1)}%
                </span>
              </div>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>
                Groupe {getGroupForTeam(team)} · Rang prédit : {getPredictedRank(team)}
                {getPredictedRank(team)===1?'er':getPredictedRank(team)===2?'e':'e'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Path timeline */}
      <div style={{position:'relative'}}>
        {/* Vertical line */}
        <div style={{
          position:'absolute', left:28, top:0, bottom:0, width:2,
          background:'linear-gradient(180deg,var(--red),var(--gold))',
          opacity:0.3,
        }}/>

        <div style={{display:'flex',flexDirection:'column',gap:0}}>
          {path.map((step, idx) => (
            <div key={idx} style={{display:'flex',gap:20,alignItems:'flex-start',
                                    marginBottom: idx<path.length-1?24:0}}>
              {/* Icon bubble */}
              <div style={{
                width:58, height:58, borderRadius:'50%', flexShrink:0,
                background:`linear-gradient(135deg,${step.color}33,${step.color}11)`,
                border:`2px solid ${step.color}55`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:24, zIndex:1, position:'relative',
                boxShadow:`0 0 20px ${step.color}22`,
              }}>
                {step.icon}
              </div>

              {/* Content */}
              <div className="card" style={{
                flex:1, padding:'20px',
                borderLeft:`3px solid ${step.color}`,
                marginBottom:0,
              }}>
                <div style={{display:'flex',alignItems:'center',
                             justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,
                                 letterSpacing:'0.08em',marginBottom:4}}>{step.round}</div>
                    {step.description && (
                      <div style={{fontSize:13,color:'var(--text2)'}}>{step.description}</div>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{fontSize:11,color:'var(--text3)'}}>Prob. d'atteindre ce stade</div>
                    <ProbBadge prob={step.stageProb}
                      color={probColor(step.stageProb)}/>
                  </div>
                </div>

                {/* Group matches */}
                {step.matches && (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {step.matches.map((m,i)=>{
                      const hw = Math.round(m.home_win_prob*100)
                      const aw = Math.round(m.away_win_prob*100)
                      const dw = 100-hw-aw
                      return (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:12,
                                             padding:'10px 14px',background:'var(--surface3)',
                                             borderRadius:10}}>
                          <span style={{fontSize:22}}>{getFlag(team)}</span>
                          <span style={{fontSize:13,fontWeight:700,color:'var(--text1)',width:120}}>{team}</span>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',height:6,borderRadius:99,overflow:'hidden',gap:1}}>
                              <div style={{width:`${hw}%`,background:'#3b82f6'}}/>
                              <div style={{width:`${dw}%`,background:'#374151'}}/>
                              <div style={{width:`${aw}%`,background:'#ef4444'}}/>
                            </div>
                            <div style={{display:'flex',justifyContent:'space-between',
                                         fontSize:11,marginTop:3}}>
                              <span style={{color:'#60a5fa'}}>{hw}%</span>
                              <span style={{color:'var(--gold)',fontFamily:'monospace',fontWeight:700}}>
                                {m.most_likely_score}
                              </span>
                              <span style={{color:'#f87171'}}>{aw}%</span>
                            </div>
                          </div>
                          <span style={{fontSize:13,fontWeight:700,color:'var(--text1)',width:120,textAlign:'right'}}>{m.opp}</span>
                          <span style={{fontSize:22}}>{getFlag(m.opp)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Single knockout match */}
                {step.opponent && step.match && (
                  <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
                      <span style={{fontSize:32}}>{getFlag(team)}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--text1)'}}>{team}</div>
                        <div style={{fontSize:18,fontWeight:900,color:'#60a5fa'}}>
                          {Math.round(step.match.home_win_prob*100)}%
                        </div>
                      </div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:4}}>SCORE PRÉDIT</div>
                      <div style={{fontSize:22,fontWeight:900,color:'var(--gold)',fontFamily:'monospace'}}>
                        {step.match.most_likely_score}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,flex:1,justifyContent:'flex-end'}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--text1)'}}>{step.opponent}</div>
                        <div style={{fontSize:18,fontWeight:900,color:'#f87171'}}>
                          {Math.round(step.match.away_win_prob*100)}%
                        </div>
                      </div>
                      <span style={{fontSize:32}}>{getFlag(step.opponent)}</span>
                    </div>
                  </div>
                )}

                {/* Champion step */}
                {step.isChampion && (
                  <div style={{textAlign:'center',padding:'16px'}}>
                    <div style={{fontSize:48,marginBottom:8}}>🏆</div>
                    <div style={{fontSize:14,color:'var(--text2)',marginBottom:8}}>
                      Probabilité de remporter le tournoi
                    </div>
                    <div style={{fontSize:40,fontWeight:900,color:'var(--gold)'}}>
                      {(champProb*100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}