import React from 'react'

export default function ProbabilityBar({ label, value, color = '#f59e0b', showPct = true, height = 8 }) {
  const pct = Math.min(100, Math.max(0, Math.round((value || 0) * 100)))

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--text2)', marginBottom: 5,
        }}>
          <span>{label}</span>
          {showPct && <span style={{ fontWeight: 700, color }}>{pct}%</span>}
        </div>
      )}
      <div style={{
        height, borderRadius: 99,
        background: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: 'width 0.9s ease',
        }} />
      </div>
    </div>
  )
}