import React, { useState } from 'react'
import Flag from './Flag'
import MatchCard from './MatchCard'
import { useLanguage } from '../context/LanguageContext'

export default function GroupCard({ groupId, data }) {
  const [open, setOpen] = useState(false)
  const { t }           = useLanguage()
  if (!data) return null
  const { predicted_standings:standing, expected_points:pts, matches } = data
  const maxPts = Math.max(...Object.values(pts))

  const upsets = (matches||[]).filter(m=>
    Math.min(m.home_win_prob,m.away_win_prob)>0.33 &&
    Math.abs(m.home_win_prob-m.away_win_prob)<0.20
  ).length

  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div onClick={()=>setOpen(!open)} style={{
        padding:'16px 20px',cursor:'pointer',userSelect:'none',
        background:'linear-gradient(135deg,var(--surface2),var(--surface3))',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{
            width:44,height:44,borderRadius:12,flexShrink:0,
            background:'linear-gradient(135deg,#E8271B,#FF5A50)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:22,fontWeight:900,color:'white',
            boxShadow:'0 4px 12px rgba(232,39,27,0.35)',
          }}>{groupId}</div>
          <div>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,
                         letterSpacing:'0.08em',marginBottom:6}}>{t('grp.label')}</div>
            <div style={{display:'flex',gap:12}}>
              {standing.slice(0,2).map(team=>(
                <div key={team} style={{display:'flex',alignItems:'center',gap:6}}>
                  <Flag team={team} size={18}/>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--text1)'}}>{team}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {upsets>0 && (
            <span className="badge badge-red">
              ⚡ {upsets} {t('grp.tight.badge')}{upsets>1?'s':''}
            </span>
          )}
          <span style={{color:'var(--text3)',fontSize:12}}>{open?'▲':'▼'}</span>
        </div>
      </div>

      <div style={{padding:'6px 0'}}>
        {standing.map((team,i)=>{
          const p = pts[team] || 0
          const qualify = i < 2
          const maybe   = i === 2
          const barW    = Math.round((p/(maxPts*1.05))*100)
          return (
            <div key={team} style={{
              display:'flex',alignItems:'center',gap:12,
              padding:'10px 20px',
              borderBottom:i<3?'1px solid rgba(255,255,255,0.04)':'none',
              background:qualify?'rgba(22,163,74,0.04)':'transparent',
            }}>
              <span style={{fontSize:13,fontWeight:900,width:18,
                            color:qualify?'#4ADE80':maybe?'var(--gold)':'var(--text3)'}}>
                {i+1}
              </span>
              <Flag team={team} size={22}/>
              <span style={{fontSize:14,fontWeight:600,color:'var(--text1)',flex:1}}>{team}</span>
              {qualify && <span className="badge badge-green">{t('grp.qualified')}</span>}
              {maybe   && <span className="badge badge-gold">{t('grp.maybe')}</span>}
              <div style={{width:70}}>
                <div style={{height:5,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
                  <div style={{
                    width:`${barW}%`,height:'100%',borderRadius:99,
                    background:qualify?'var(--green)':maybe?'var(--gold)':'#4A5878',
                  }}/>
                </div>
              </div>
              <span style={{fontSize:13,fontWeight:800,color:'var(--gold)',
                            fontFamily:'monospace',width:30,textAlign:'right'}}>
                {p.toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>

      {open && (
        <div style={{padding:'16px 20px',borderTop:'1px solid var(--border)',
                     background:'var(--surface1)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',
                       letterSpacing:'0.07em',marginBottom:4}}>
            {t('grp.matches')} {groupId}
          </div>
          {matches&&matches.length>0
            ? matches.map((m,i)=><MatchCard key={i} match={m}/>)
            : <div style={{color:'var(--text3)',fontSize:13}}>No data</div>
          }
        </div>
      )}
    </div>
  )
}