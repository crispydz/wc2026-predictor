import React from 'react'
import { COUNTRY_CODES } from '../data/tournament'

export default function Flag({ team, size = 28, radius = 4, style = {} }) {
  const code = COUNTRY_CODES[team]
  const w = Math.round(size * 1.5)
  const h = size

  if (!code) {
    return (
      <div style={{
        width: w, height: h, borderRadius: radius,
        background: 'var(--surface4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: 'var(--text3)', flexShrink: 0, ...style,
      }}>?</div>
    )
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={team}
      loading="lazy"
      style={{
        width: w, height: h,
        objectFit: 'cover',
        borderRadius: radius,
        flexShrink: 0,
        display: 'block',
        ...style,
      }}
    />
  )
}