import React, { useState } from 'react'
import Flag from '../components/Flag'
import { getChampionProb } from '../data/predictions_static'
import ProbabilityBar from '../components/ProbabilityBar'

const ALL_TEAMS = Object.values(GROUPS).flatMap(g=>g.teams).sort()

export default function TeamAnalysis() {
  const [teamA, setTeamA] = useState('Argentina')
  const [teamB, setTeamB] = useState('France')
  const probA = getChampionProb(teamA)
  const probB = getChampionProb(teamB)

  const stages = [
    {key:'qualify_r32',  label:'Round of 32', color:'#3b82f6'},
    {key:'qualify_r16',  label:'Round of 16', color:'#60a5fa'},
    {key:'qualify_qf',   label:'Quarts',      color:'#8b5cf6'},
    {key:'qualify_sf',   label:'Demies',      color:'#f97316'},
    {key:'qualify_final',label:'Finale',      color:'#ef4444'},
    {key:'win_tournament',label:'🏆 Titre',   color:'#f59e0b'},
  ]

  const TeamCard = ({ team, prob }) => {
    const grp = Object.entries(GROUPS).find(([,g])=>g.teams.includes(team))?.[0]
    return (
      <div className="card" style={{ padding:'24px', flex:1 }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:64, marginBottom:10 }}>{getFlag(team)}</div>
          <div style={{ fontSize:20, fontWeight:900, color:'var(--text1)', marginBottom:6 }}>{team}</div>
          <span className="badge badge-gold">Groupe {grp}</span>
        </div>
        {prob && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {stages.map(s=>(
              <ProbabilityBar key={s.key} label={s.label}
                value={prob[s.key]||0} color={s.color} showPct/>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:30, fontWeight:900, color:'var(--text1)', marginBottom:6 }}>
          🔍 Analyse & Comparaison
        </h1>
        <p style={{ fontSize:14, color:'var(--text2)' }}>Compare deux équipes par phase</p>
      </div>

      {/* Selectors */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {[[teamA,setTeamA,'🔵 ÉQUIPE A'],[teamB,setTeamB,'🔴 ÉQUIPE B']].map(([t,set,label])=>(
          <div key={label}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700,
                          letterSpacing:'0.07em', marginBottom:8 }}>{label}</div>
            <select value={t} onChange={e=>set(e.target.value)}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, fontSize:14,
                       fontWeight:600, color:'var(--text1)', background:'var(--surface2)',
                       border:'1px solid var(--border)', cursor:'pointer' }}>
              {ALL_TEAMS.map(tm=><option key={tm} value={tm}>{getFlag(tm)} {tm}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Comparison */}
      <div style={{ display:'flex', gap:16, marginBottom:20, alignItems:'stretch' }}>
        <TeamCard team={teamA} prob={probA}/>
        <div style={{ display:'flex', alignItems:'center', padding:'0 8px' }}>
          <div style={{ fontSize:20, fontWeight:900, color:'var(--text3)' }}>VS</div>
        </div>
        <TeamCard team={teamB} prob={probB}/>
      </div>

      {/* Head2head bar */}
      {probA && probB && (() => {
        const total=(probA.win_tournament||0)+(probB.win_tournament||0)||1
        const pA=((probA.win_tournament||0)/total*100)
        return (
          <div className="card" style={{ padding:'20px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)',
                          letterSpacing:'0.06em', marginBottom:12 }}>
              RAPPORT DE FORCE — CHANCES DE TITRE
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#60a5fa', width:80, textAlign:'right' }}>{teamA}</span>
              <div style={{ flex:1, height:20, borderRadius:99, overflow:'hidden', display:'flex' }}>
                <div style={{ width:`${pA}%`, background:'linear-gradient(90deg,#1d4ed8,#3b82f6)',
                              display:'flex',alignItems:'center',justifyContent:'flex-end',
                              paddingRight:8, fontSize:11, fontWeight:700, color:'white',
                              transition:'width 0.8s ease' }}>
                  {pA.toFixed(0)}%
                </div>
                <div style={{ flex:1, background:'linear-gradient(90deg,#ea580c,#f97316)',
                              display:'flex',alignItems:'center',paddingLeft:8,
                              fontSize:11, fontWeight:700, color:'white' }}>
                  {(100-pA).toFixed(0)}%
                </div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:'#fb923c', width:80 }}>{teamB}</span>
            </div>
          </div>
        )
      })()}

      {/* All teams */}
      <div className="card" style={{ padding:'24px' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text1)', marginBottom:16 }}>
          📋 Toutes les équipes
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          {ALL_TEAMS.map(team=>{
            const prob=getChampionProb(team)
            const grp=Object.entries(GROUPS).find(([,g])=>g.teams.includes(team))?.[0]
            const pct=prob?(prob.win_tournament*100).toFixed(2):'0.00'
            return (
              <div key={team} onClick={()=>setTeamA(team)}
                style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
                         borderRadius:10,cursor:'pointer',transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:22 }}>{getFlag(team)}</span>
                <span style={{ fontSize:13,fontWeight:600,color:'var(--text1)',flex:1 }}>{team}</span>
                <span style={{ fontSize:11,color:'var(--text3)' }}>Gr.{grp}</span>
                <span style={{ fontSize:12,fontWeight:800,color:'var(--gold)',width:44,textAlign:'right' }}>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}