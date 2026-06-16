import React, { useState, useMemo } from 'react'
import { predictions, computeMatch } from '../data/predictions_static'
import { GROUPS } from '../data/tournament'
import Flag from '../components/Flag'
import { useIsMobile } from '../hooks/useIsMobile'

const ALL_TEAMS = Object.values(GROUPS).flatMap(g=>g.teams).sort()
const cp = predictions.champion_probabilities
const b  = predictions.predicted_bracket || {}

function getGroupForTeam(team){
  return Object.entries(GROUPS).find(([,g])=>g.teams.includes(team))?.[0]||null
}
function getPredictedRank(team){
  const gid=getGroupForTeam(team)
  if(!gid)return 1
  const s=predictions.group_predictions[gid]?.predicted_standings||[]
  const idx=s.indexOf(team)
  return idx>=0?idx+1:1
}
function getGroupOpponents(team){
  const gid=getGroupForTeam(team)
  if(!gid)return[]
  return GROUPS[gid].teams.filter(t=>t!==team)
}
function getWinProb(team){return cp[team]?.win_tournament||0}
function pickWinner(ta,tb){
  if(!ta||!tb)return ta||tb
  return getWinProb(ta)>=getWinProb(tb)?ta:tb
}

function getTeamPath(team){
  const steps=[]
  const gid=getGroupForTeam(team)
  const rank=getPredictedRank(team)
  const opponents=getGroupOpponents(team)

  steps.push({
    round:'Phase de Groupes',icon:'🗂️',
    description:`Groupe ${gid} · Position prédite : ${rank}${rank===1?'er':'e'}`,
    matches:opponents.map(opp=>({...computeMatch(team,opp),opp})),
    stageProb:cp[team]?.qualify_r32||0,color:'#0066CC',
  })

  const r32Map={'A':'2C','B':'2A','C':'2B','D':'2F','E':'2D','F':'2E',
                'G':'2I','H':'2G','I':'2H','J':'2L','K':'2J','L':'2K'}
  const r32Opp=gid&&rank<=2?b[rank===1?r32Map[gid]:`1${gid}`]:null
  if(r32Opp){
    steps.push({round:'Round of 32',icon:'⚡',opponent:r32Opp,
      match:computeMatch(team,r32Opp),stageProb:cp[team]?.qualify_r16||0,color:'#7C3AED'})
  }

  const rounds=[
    {key:'qualify_qf',  name:'Quarts de finale',icon:'🔥',color:'#F97316'},
    {key:'qualify_sf',  name:'Demi-finales',    icon:'⭐',color:'#E8271B'},
    {key:'qualify_final',name:'Finale',         icon:'🏆',color:'#F5A623'},
  ]
  rounds.forEach(({key,name,icon,color})=>{
    const topTeams=Object.entries(cp)
      .sort((a,bk)=>bk[1].win_tournament-a[1].win_tournament)
      .map(([t])=>t).filter(t=>t!==team)
    const likelyOpp=topTeams[rounds.findIndex(r=>r.key===key)*2]||topTeams[0]
    steps.push({round:name,icon,opponent:likelyOpp,
      match:computeMatch(team,likelyOpp),stageProb:cp[team]?.[key]||0,color})
  })

  steps.push({round:'Champion 🏆',icon:'👑',
    stageProb:cp[team]?.win_tournament||0,color:'#F5A623',isChampion:true})
  return steps
}

function ProbBadge({prob,color}){
  const pct=Math.round(prob*100)
  return(
    <div style={{padding:'5px 12px',borderRadius:99,fontSize:13,fontWeight:800,color,
                 background:`${color}18`,border:`1px solid ${color}44`}}>
      {pct}%
    </div>
  )
}

function probColor(p){return p>0.6?'#22c55e':p>0.35?'#f59e0b':'#ef4444'}

export default function PathToGlory(){
  const [team,setTeam]=useState('France')
  const isMobile=useIsMobile()
  const path=useMemo(()=>getTeamPath(team),[team])
  const champProb=cp[team]?.win_tournament||0

  return(
    <div className="fade-up">
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:isMobile?22:30,fontWeight:900,color:'var(--text1)',marginBottom:6}}>
          🛤️ Chemin vers la Gloire
        </h1>
        <p style={{fontSize:14,color:'var(--text2)'}}>
          Le parcours prédit de chaque équipe du groupe à la finale
        </p>
      </div>

      {/* Team selector */}
      <div className="card" style={{padding:'24px',marginBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,
                         letterSpacing:'0.07em',marginBottom:8}}>CHOISIR UNE ÉQUIPE</div>
            <select value={team} onChange={e=>setTeam(e.target.value)}
              style={{width:'100%',padding:'12px 20px',borderRadius:12,
                     border:'1px solid var(--border2)',background:'var(--surface3)',
                     color:'var(--text1)',fontSize:15,fontWeight:600,cursor:'pointer'}}>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <Flag team={team} size={isMobile?48:64} />
            <div>
              <div style={{fontSize:isMobile?18:22,fontWeight:900,color:'var(--text1)'}}>{team}</div>
              <div style={{fontSize:14,color:'var(--text2)',marginTop:4}}>
                Prob. de titre :{' '}
                <span style={{fontWeight:900,color:'var(--gold)',fontSize:20}}>
                  {(champProb*100).toFixed(1)}%
                </span>
              </div>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>
                Groupe {getGroupForTeam(team)} · Rang prédit : {getPredictedRank(team)}
                {getPredictedRank(team)===1?'er':'e'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Path timeline */}
      <div style={{position:'relative'}}>
        <div style={{position:'absolute',left:28,top:0,bottom:0,width:2,
                     background:'linear-gradient(180deg,var(--red),var(--gold))',opacity:0.3}}/>
        <div style={{display:'flex',flexDirection:'column',gap:0}}>
          {path.map((step,idx)=>(
            <div key={idx} style={{display:'flex',gap:20,alignItems:'flex-start',
                                   marginBottom:idx<path.length-1?24:0}}>
              <div style={{width:58,height:58,borderRadius:'50%',flexShrink:0,
                           background:`${step.color}22`,border:`2px solid ${step.color}44`,
                           display:'flex',alignItems:'center',justifyContent:'center',
                           fontSize:24,zIndex:1,position:'relative',
                           boxShadow:`0 0 20px ${step.color}22`}}>
                {step.icon}
              </div>
              <div className="card" style={{flex:1,padding: isMobile?'16px':'20px',
                                            borderLeft:`3px solid ${step.color}`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                             marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,
                                 letterSpacing:'0.08em',marginBottom:4}}>
                      {step.round.toUpperCase()}
                    </div>
                    {step.description&&(
                      <div style={{fontSize:13,color:'var(--text2)'}}>{step.description}</div>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{fontSize:11,color:'var(--text3)'}}>Prob. d'atteindre</div>
                    <ProbBadge prob={step.stageProb} color={probColor(step.stageProb)}/>
                  </div>
                </div>

                {/* Group matches */}
                {step.matches&&(
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {step.matches.map((m,i)=>{
                      const hw=Math.round(m.home_win_prob*100)
                      const aw=Math.round(m.away_win_prob*100)
                      const dw=Math.max(0,100-hw-aw)
                      return(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:10,
                                             padding:'10px 14px',background:'var(--surface3)',
                                             borderRadius:10,flexWrap:'wrap'}}>
                          <Flag team={team} size={20}/>
                          <span style={{fontSize:12,fontWeight:700,color:'var(--text1)',width:90,
                                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {team}
                          </span>
                          <div style={{flex:1,minWidth:100}}>
                            <div style={{display:'flex',height:5,borderRadius:99,
                                         overflow:'hidden',gap:1}}>
                              <div style={{width:`${hw}%`,background:'#3b82f6'}}/>
                              <div style={{width:`${dw}%`,background:'#374151'}}/>
                              <div style={{width:`${aw}%`,background:'#ef4444'}}/>
                            </div>
                            <div style={{display:'flex',justifyContent:'space-between',
                                         fontSize:10,marginTop:3}}>
                              <span style={{color:'#60a5fa'}}>{hw}%</span>
                              <span style={{color:'var(--gold)',fontFamily:'monospace',fontWeight:700}}>
                                {m.most_likely_score}
                              </span>
                              <span style={{color:'#f87171'}}>{aw}%</span>
                            </div>
                          </div>
                          <span style={{fontSize:12,fontWeight:700,color:'var(--text1)',width:90,
                                        textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',
                                        whiteSpace:'nowrap'}}>
                            {m.opp}
                          </span>
                          <Flag team={m.opp} size={20}/>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Knockout match */}
                {step.opponent&&step.match&&(
                  <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:100}}>
                      <Flag team={team} size={28}/>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--text1)'}}>{team}</div>
                        <div style={{fontSize:16,fontWeight:900,color:'#60a5fa'}}>
                          {Math.round(step.match.home_win_prob*100)}%
                        </div>
                      </div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:4}}>SCORE PRÉDIT</div>
                      <div style={{fontSize:20,fontWeight:900,color:'var(--gold)',fontFamily:'monospace'}}>
                        {step.match.most_likely_score}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,flex:1,
                                 justifyContent:'flex-end',minWidth:100}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--text1)'}}>
                          {step.opponent}
                        </div>
                        <div style={{fontSize:16,fontWeight:900,color:'#f87171'}}>
                          {Math.round(step.match.away_win_prob*100)}%
                        </div>
                      </div>
                      <Flag team={step.opponent} size={28}/>
                    </div>
                  </div>
                )}

                {/* Champion */}
                {step.isChampion&&(
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