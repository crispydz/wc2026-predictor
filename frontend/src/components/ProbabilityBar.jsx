import React from 'react'

export default function ProbabilityBar({ label, value, color='#f59e0b', showPct=true, height=8 }) {
  const pct = Math.round((value||0) * 100)
  return (
    <div style={{ width:'100%' }}>
      {label && (
        <div style={{ display:'flex', justifyContent:'space-between',
                      fontSize:12, color:'var(--text2)', marginBottom:5 }}>
          <span>{label}</span>
          {showPct && <span style={{ fontWeight:700, color }}>{pct}%</span>}
        </div>
      )}
      <div className="prob-bar-track" style={{ height }}>
        <div className="prob-bar-fill"
          style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color}99,${color})` }} />
      </div>
    </div>
  )
}