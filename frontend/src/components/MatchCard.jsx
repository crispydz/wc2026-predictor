import React from 'react'
import Flag from './Flag'

export default function MatchCard({ match }) {
  if (!match) return null
  const { team_a, team_b, home_win_prob, draw_prob, away_win_prob,
          expected_goals_a, expected_goals_b, most_likely_score } = match

  const hw = Math.round(home_win_prob * 100)
  const aw = Math.round(away_win_prob * 100)
  const dw = Math.max(0, 100 - hw - aw)

  return (
    <div style={{
      background: 'var(--surface3)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      opacity: aw > hw && aw > dw ? 0.5 : 1 }}>
          <Flag team={team_a} size={24} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{team_a}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>xG {expected_goals_a}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '6px 12px',
                      background: 'var(--surface4)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 3 }}>
            SCORE PRÉDIT
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)',
                        fontFamily: 'monospace' }}>
            {most_likely_score}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      justifyContent: 'flex-end',
                      opacity: hw > aw && hw > dw ? 0.5 : 1 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{team_b}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>xG {expected_goals_b}</div>
          </div>
          <Flag team={team_b} size={24} />
        </div>
      </div>

      {/* Tri-color bar */}
      <div style={{ display: 'flex', height: 7, borderRadius: 99, overflow: 'hidden',
                    gap: 1.5, marginBottom: 8 }}>
        <div style={{ width: `${hw}%`, background: 'linear-gradient(90deg,#1A56DB,#3B82F6)',
                      borderRadius: '99px 0 0 99px', transition: 'width 0.8s ease' }} />
        <div style={{ width: `${dw}%`, background: '#2D3748', transition: 'width 0.8s ease' }} />
        <div style={{ width: `${aw}%`, background: 'linear-gradient(90deg,#C53030,#E53E3E)',
                      borderRadius: '0 99px 99px 0', transition: 'width 0.8s ease' }} />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ fontWeight: 800, color: '#63B3ED' }}>{hw}%</span>
        <span style={{ color: 'var(--text3)' }}>Nul {dw}%</span>
        <span style={{ fontWeight: 800, color: '#FC8181' }}>{aw}%</span>
      </div>
    </div>
  )
}