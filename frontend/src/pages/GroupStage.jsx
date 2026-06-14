import React, { useState } from 'react'
import { predictions } from '../data/predictions_static'
import GroupCard from '../components/GroupCard'

export default function GroupStage() {
  const [search, setSearch] = useState('')
  const groupIds = Object.keys(predictions.group_predictions)

  // Count upsets globally
  let totalUpsets = 0
  groupIds.forEach(gid => {
    const m = predictions.group_predictions[gid]?.matches || []
    m.forEach(match => {
      if (Math.min(match.home_win_prob,match.away_win_prob)>0.33 &&
          Math.abs(match.home_win_prob-match.away_win_prob)<0.20)
        totalUpsets++
    })
  })

  const filtered = search
    ? groupIds.filter(gid =>
        predictions.group_predictions[gid].teams.some(t =>
          t.toLowerCase().includes(search.toLowerCase())
        )
      )
    : groupIds

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:30,fontWeight:900,color:'var(--text1)',marginBottom:6}}>
          🗂️ Phase de Groupes
        </h1>
        <p style={{fontSize:14,color:'var(--text2)'}}>
          12 groupes · 72 matchs · Top 2 + 8 meilleurs 3es → Round of 32
          {totalUpsets>0 && (
            <span className="badge badge-red" style={{marginLeft:10}}>
              ⚡ {totalUpsets} matchs indécis
            </span>
          )}
        </p>
      </div>

      {/* Search + Legend */}
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:24,flexWrap:'wrap'}}>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Rechercher une équipe..."
          style={{
            padding:'10px 16px',borderRadius:10,border:'1px solid var(--border2)',
            background:'var(--surface2)',color:'var(--text1)',fontSize:13,fontWeight:500,
            outline:'none',width:220,
          }}
        />
        <div style={{display:'flex',gap:16,padding:'10px 16px',
                     background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)'}}>
          {[['var(--green)','✓ Qualifié (Top 2)'],
            ['var(--gold)', '~ Qualifiable (3e)'],
            ['var(--red)',  '⚡ Match serré']].map(([col,label])=>(
            <div key={label} style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:col}}/>
              <span style={{fontSize:12,color:'var(--text2)',fontWeight:500}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{marginLeft:'auto',fontSize:12,color:'var(--text3)'}}>
          💡 Clique sur un groupe pour voir les 6 matchs
        </div>
      </div>

      {/* Groups grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16}}>
        {filtered.map(gid => (
          <GroupCard key={gid} groupId={gid} data={predictions.group_predictions[gid]} />
        ))}
      </div>

      {/* Best thirds */}
      <div className="card" style={{padding:'24px',marginTop:28}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:18,fontWeight:800,color:'var(--text1)',marginBottom:4}}>
            🔢 Meilleurs 3es prédits — 8 qualifiés sur 12
          </div>
          <div style={{fontSize:13,color:'var(--text2)'}}>
            Seulement les 8 meilleures équipes de 3e place se qualifient · Pts → Diff. buts → Buts → ELO
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {(predictions.predicted_bracket?.best_thirds || []).map((team,i)=>(
            <div key={team} style={{
              padding:'14px 16px',borderRadius:12,
              background:'rgba(232,39,27,0.06)',border:'1px solid rgba(232,39,27,0.2)',
              display:'flex',alignItems:'center',gap:10,
            }}>
              <span style={{fontSize:18,fontWeight:900,color:'var(--red)',width:24}}>{i+1}</span>
              <span style={{fontSize:22}}>{getFlag(team)}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text1)'}}>{team}</div>
                <div className="badge badge-red" style={{marginTop:4,fontSize:10}}>✓ Qualifié</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}