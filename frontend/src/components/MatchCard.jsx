import React from 'react'
import { getFlag } from '../data/tournament'

export default function MatchCard({ match }) {
  if (!match) return null
  const { team_a, team_b, home_win_prob:hw, draw_prob:d, away_win_prob:aw,
          expected_goals_a:xgA, expected_goals_b:xgB, most_likely_score:score } = match

  // Guaranteed sum = 100%
  const hwP = Math.round(hw * 100)
  const awP = Math.round(aw * 100)
  const dP  = Math.max(0, 100 - hwP - awP)

  const maxP = Math.max(hwP, dP, awP)
  const winner = hwP===maxP?'a' : awP===maxP?'b' : 'draw'
  const upsetThreshold = 0.35
  const isUpset = (hw<upsetThreshold && hw<aw) || (aw<upsetThreshold && aw<hw)

  const [ga, gb] = score.split('-').map(Number)

  return (
    <div style={{
      background:'var(--surface3)', border:'1px solid var(--border)',
      borderRadius:12, padding:'14px 16px', position:'relative', overflow:'hidden',
    }}>
      {/* Upset badge */}
      {isUpset && (
        <div className="badge badge-red" style={{ position:'absolute', top:10, right:10, fontSize:10 }}>
          ⚡ Surprise possible
        </div>
      )}

      {/* Teams row */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        {/* Team A */}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8,
                      opacity: winner==='b'?0.5:1, transition:'opacity 0.2s' }}>
          <span style={{ fontSize:26 }}>{getFlag(team_a)}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text1)', lineHeight:1 }}>{team_a}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>xG {xgA}</div>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign:'center', padding:'6px 12px',
                      background:'var(--surface4)', borderRadius:10,
                      border:'1px solid var(--border2)' }}>
          <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600,
                        letterSpacing:'0.05em', marginBottom:3 }}>SCORE PRÉDIT</div>
          <div style={{ fontSize:18, fontWeight:900, color:'var(--gold)',
                        fontFamily:'monospace', letterSpacing:'0.05em' }}>
            {ga} — {gb}
          </div>
        </div>

        {/* Team B */}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8,
                      justifyContent:'flex-end', opacity: winner==='a'?0.5:1 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text1)', lineHeight:1 }}>{team_b}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>xG {xgB}</div>
          </div>
          <span style={{ fontSize:26 }}>{getFlag(team_b)}</span>
        </div>
      </div>

      {/* Tri-color bar */}
      <div style={{ display:'flex', height:7, borderRadius:99, overflow:'hidden',
                    gap:1.5, marginBottom:8 }}>
        <div style={{ width:`${hwP}%`, borderRadius:'99px 0 0 99px', transition:'width 0.8s ease',
                      background:'linear-gradient(90deg,#1A56DB,#3B82F6)',
                      minWidth: hwP>5?undefined:0 }}/>
        <div style={{ width:`${dP}%`, transition:'width 0.8s ease', background:'#2D3748',
                      minWidth: dP>5?undefined:0 }}/>
        <div style={{ width:`${awP}%`, borderRadius:'0 99px 99px 0', transition:'width 0.8s ease',
                      background:'linear-gradient(90deg,#C53030,#E53E3E)',
                      minWidth: awP>5?undefined:0 }}/>
      </div>

      {/* Percentage labels */}
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
          <span style={{ fontWeight:800, color:'#63B3ED' }}>{hwP}%</span>
          <span style={{ fontSize:10, color:'var(--text3)' }}>{team_a}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span style={{ fontWeight:600, color:'var(--text3)' }}>{dP}%</span>
          <span style={{ fontSize:10, color:'var(--text3)' }}>Nul</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
          <span style={{ fontWeight:800, color:'#FC8181' }}>{awP}%</span>
          <span style={{ fontSize:10, color:'var(--text3)' }}>{team_b}</span>
        </div>
      </div>
    </div>
  )
}