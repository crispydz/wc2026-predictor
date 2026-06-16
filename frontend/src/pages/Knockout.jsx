import React, { useState } from 'react'
import { predictions } from '../data/predictions_static'
import Flag from '../components/Flag'
import ProbabilityBar from '../components/ProbabilityBar'
import { useIsMobile } from '../hooks/useIsMobile'

const cp = predictions.champion_probabilities || {}
const b  = predictions.predicted_bracket     || {}

function getWinProb(team) { return cp[team]?.win_tournament || 0 }
function pickWinner(ta, tb) {
  if (!ta || !tb) return ta || tb
  return getWinProb(ta) >= getWinProb(tb) ? ta : tb
}

const r32Pairs = [
  ['1A','2C'],['1C','2B'],['1E','2D'],['1G','2I'],
  ['1I','2H'],['1K','2J'],['1B','2A'],['1D','2F'],
  ['1F','2E'],['1H','2G'],['1J','2L'],['1L','2K'],
]
const thirds = b.best_thirds || []
const thirdPairs = []
for (let i=0;i<thirds.length-1;i+=2) thirdPairs.push([thirds[i],thirds[i+1]])

const allR32 = [
  ...r32Pairs.map(([a,bk]) => [b[a],b[bk]]),
  ...thirdPairs,
].slice(0,16)

const r16  = allR32.map(([a,bk])   => pickWinner(a,bk))
const r16p = []; for(let i=0;i<r16.length-1;i+=2) r16p.push([r16[i],r16[i+1]])
const qf   = r16p.map(([a,bk])     => pickWinner(a,bk))
const qfp  = []; for(let i=0;i<qf.length-1;i+=2) qfp.push([qf[i],qf[i+1]])
const sf   = qfp.map(([a,bk])      => pickWinner(a,bk))
const sfp  = []; for(let i=0;i<sf.length-1;i+=2) sfp.push([sf[i],sf[i+1]])
const finalists = sfp[0] || []
const champion  = pickWinner(finalists[0], finalists[1])

function MatchSlot({ ta, tb }) {
  const winner = pickWinner(ta, tb)
  return (
    <div style={{
      background:'var(--surface2)',border:'1px solid var(--border)',
      borderRadius:10,padding:'8px 10px',minWidth:170,marginBottom:6,
    }}>
      {[ta,tb].map((team,i)=>{
        const isW = team===winner
        return (
          <div key={i} style={{
            display:'flex',alignItems:'center',gap:7,
            padding:'4px 0',opacity:team&&!isW?0.45:1,
            borderBottom:i===0?'1px solid var(--border)':'none',
          }}>
            {team ? <Flag team={team} size={16} /> : <div style={{width:24,height:16}}/>}
            <span style={{fontSize:11,fontWeight:isW?700:500,
                          color:isW?'var(--text1)':'var(--text2)',
                          flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {team||'—'}
            </span>
            {team&&isW&&(
              <span style={{fontSize:10,color:'var(--gold)',fontWeight:700}}>
                {((getWinProb(team))*100).toFixed(0)}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RoundCol({ title, pairs, color='#3b82f6' }) {
  return (
    <div style={{minWidth:186}}>
      <div style={{fontSize:11,fontWeight:700,color,letterSpacing:'0.07em',
                   marginBottom:12,textTransform:'uppercase',
                   borderBottom:`2px solid ${color}`,paddingBottom:6}}>
        {title}
      </div>
      {pairs.map((pair,i)=>(
        <MatchSlot key={i} ta={pair[0]} tb={pair[1]} />
      ))}
    </div>
  )
}

export default function Knockout() {
  const isMobile = useIsMobile()

  return (
    <div className="fade-up">
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize: isMobile?22:30,fontWeight:900,color:'var(--text1)',marginBottom:6}}>
          🏆 Tableau Knockout
        </h1>
        <p style={{fontSize:14,color:'var(--text2)'}}>
          Parcours prédit — 50,000 simulations Monte Carlo
        </p>
      </div>

      {/* Champion */}
      {champion && (
        <div style={{
          borderRadius:20,padding: isMobile?'24px':'36px',
          textAlign:'center',marginBottom:28,
          background:'linear-gradient(135deg,#1a1000,#2d2000,#1a1000)',
          border:'1px solid rgba(245,166,35,0.4)',
          boxShadow:'0 0 60px rgba(245,166,35,0.1)',
        }}>
          <div style={{fontSize:40,marginBottom:8,filter:'drop-shadow(0 0 20px rgba(245,166,35,0.6))'}}>
            🏆
          </div>
          <div style={{fontSize:12,color:'var(--text3)',fontWeight:700,
                       letterSpacing:'0.1em',marginBottom:10}}>CHAMPION PRÉDIT</div>
          <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
            <Flag team={champion} size={isMobile?56:72} />
          </div>
          <div style={{fontSize: isMobile?20:26,fontWeight:900,color:'var(--text1)',marginBottom:6}}>
            {champion}
          </div>
          <div style={{fontSize: isMobile?28:36,fontWeight:900,color:'var(--gold)'}}>
            {(getWinProb(champion)*100).toFixed(1)}%
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:14}}>
            {[['Finale',cp[champion]?.qualify_final],
              ['SF',cp[champion]?.qualify_sf],
              ['QF',cp[champion]?.qualify_qf]].map(([l,v])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:14,fontWeight:700,color:'var(--gold)'}}>
                  {((v||0)*100).toFixed(0)}%
                </div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finalists */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:28}}>
        {finalists.map((team,i)=>(
          <div key={i} className="card" style={{padding:'20px',textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,
                         letterSpacing:'0.08em',marginBottom:10}}>
              {i===0?'🥇 FINALISTE 1':'🥈 FINALISTE 2'}
            </div>
            <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
              <Flag team={team} size={isMobile?36:48} />
            </div>
            <div style={{fontSize: isMobile?14:16,fontWeight:800,color:'var(--text1)',marginBottom:4}}>
              {team}
            </div>
            <div style={{fontSize: isMobile?16:20,fontWeight:900,color:'var(--gold)'}}>
              {(getWinProb(team)*100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Full bracket */}
      <div className="card" style={{padding:'24px',overflowX:'auto'}}>
        <div style={{fontSize:16,fontWeight:800,color:'var(--text1)',marginBottom:20}}>
          📋 Tableau complet
        </div>
        <div style={{display:'flex',gap:16,minWidth:'max-content'}}>
          <RoundCol title="Round of 32" color="#3b82f6" pairs={allR32} />
          <RoundCol title="Round of 16" color="#8b5cf6" pairs={r16p} />
          <RoundCol title="Quarts"      color="#f97316" pairs={qfp} />
          <RoundCol title="Demies"      color="#ef4444"
            pairs={sfp.length ? sfp : (sf.length>=2?[[sf[0],sf[1]]]:[])} />
          <div style={{minWidth:186}}>
            <div style={{fontSize:11,fontWeight:700,color:'#f59e0b',letterSpacing:'0.07em',
                         marginBottom:12,borderBottom:'2px solid #f59e0b',paddingBottom:6}}>
              FINALE & CHAMPION
            </div>
            {champion && (
              <div style={{
                background:'linear-gradient(135deg,rgba(245,166,35,0.15),rgba(245,166,35,0.05))',
                border:'1px solid rgba(245,166,35,0.35)',borderRadius:12,
                padding:'16px',textAlign:'center',
              }}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:6}}>
                  <Flag team={champion} size={40} />
                </div>
                <div style={{fontSize:13,fontWeight:800,color:'var(--text1)',marginTop:6}}>
                  {champion}
                </div>
                <div style={{fontSize:16,fontWeight:900,color:'var(--gold)'}}>
                  {(getWinProb(champion)*100).toFixed(1)}%
                </div>
                <div style={{fontSize:24,marginTop:6}}>🏆</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Probabilities table */}
      <div className="card" style={{padding:'24px',marginTop:24}}>
        <div style={{fontSize:16,fontWeight:800,color:'var(--text1)',marginBottom:16}}>
          📊 Probabilités complètes
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="wc-table">
            <thead>
              <tr>
                {['#','Équipe','R32','R16','QF','SF','Finale','🏆 Titre'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(cp)
                .sort((a,bk)=>bk[1].win_tournament-a[1].win_tournament)
                .slice(0,20)
                .map(([team,prob],i)=>(
                <tr key={team}>
                  <td style={{color:'var(--text3)',fontWeight:600}}>{i+1}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <Flag team={team} size={18} />
                      <span style={{fontWeight:600,color:'var(--text1)'}}>{team}</span>
                    </div>
                  </td>
                  {[prob.qualify_r32,prob.qualify_r16,prob.qualify_qf,
                    prob.qualify_sf,prob.qualify_final].map((v,j)=>(
                    <td key={j} style={{color:'var(--text2)'}}>
                      {((v||0)*100).toFixed(0)}%
                    </td>
                  ))}
                  <td>
                    <span style={{fontWeight:800,color:'var(--gold)',fontSize:14}}>
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