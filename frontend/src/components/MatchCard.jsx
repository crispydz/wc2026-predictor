import React, { useState } from 'react'
import Flag from './Flag'

export default function MatchCard({ match }) {
  if (!match) return null
  const {
    team_a, team_b,
    home_win_prob, draw_prob, away_win_prob,
    expected_goals_a, expected_goals_b,
    score_distribution,
  } = match

  const hw = Math.round(home_win_prob * 100)
  const aw = Math.round(away_win_prob * 100)
  const dw = Math.max(0, 100 - hw - aw)

  // ✅ Distribution de scores — top 5
  const dist = score_distribution || []
  const maxDistP = dist.length > 0 ? dist[0].p : 0.15

  return (
    <div style={{
      background: 'var(--surface3)',
      border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>

      {/* ── Teams + xG ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flag team={team_a} size={22} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', lineHeight: 1 }}>
              {team_a}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              xG {expected_goals_a}
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center', padding: '6px 14px',
          background: 'var(--surface4)', borderRadius: 10,
          border: '1px solid var(--border2)', flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600,
                        letterSpacing: '0.05em', marginBottom: 3 }}>BUTS ATTENDUS</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--gold)',
                        fontFamily: 'monospace' }}>
            {expected_goals_a} — {expected_goals_b}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', lineHeight: 1 }}>
              {team_b}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              xG {expected_goals_b}
            </div>
          </div>
          <Flag team={team_b} size={22} />
        </div>
      </div>

      {/* ── Distribution de scores ──────────────────────── */}
      {dist.length > 0 && (
        <div style={{
          background: 'var(--surface2)', borderRadius: 10,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700,
                        letterSpacing: '0.07em', marginBottom: 8 }}>
            SCORES LES PLUS PROBABLES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {dist.slice(0, 5).map((s, i) => {
              const outcome = s.ga > s.gb ? 'home' : s.ga < s.gb ? 'away' : 'draw'
              const col = outcome === 'home' ? '#3b82f6'
                        : outcome === 'away' ? '#ef4444' : '#64748b'
              const label = outcome === 'home' ? team_a
                          : outcome === 'away' ? team_b : 'Nul'
              const barW = Math.round((s.p / maxDistP) * 100)
              const pct  = (s.p * 100).toFixed(1)

              return (
                <div key={s.score} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Score */}
                  <div style={{
                    width: 32, fontSize: 12, fontWeight: 800,
                    color: i === 0 ? 'var(--gold)' : 'var(--text1)',
                    fontFamily: 'monospace', flexShrink: 0,
                  }}>
                    {s.score}
                  </div>
                  {/* Bar */}
                  <div style={{ flex: 1, height: 6, borderRadius: 99,
                                background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${barW}%`, height: '100%', borderRadius: 99,
                      background: i === 0
                        ? `linear-gradient(90deg,${col}99,${col})`
                        : `${col}66`,
                      transition: 'width 0.7s ease',
                    }} />
                  </div>
                  {/* % */}
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: i === 0 ? 'var(--gold)' : col,
                    width: 38, textAlign: 'right', flexShrink: 0,
                  }}>
                    {pct}%
                  </div>
                  {/* Label */}
                  <div style={{
                    fontSize: 10, color: 'var(--text3)', width: 70,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Barre victoire/nul/défaite ──────────────────── */}
      <div>
        <div style={{ display: 'flex', height: 7, borderRadius: 99,
                      overflow: 'hidden', gap: 1.5, marginBottom: 6 }}>
          <div style={{ width: `${hw}%`, background: 'linear-gradient(90deg,#1A56DB,#3B82F6)',
                        borderRadius: '99px 0 0 99px', transition: 'width 0.8s ease' }} />
          <div style={{ width: `${dw}%`, background: '#2D3748',
                        transition: 'width 0.8s ease' }} />
          <div style={{ width: `${aw}%`, background: 'linear-gradient(90deg,#C53030,#E53E3E)',
                        borderRadius: '0 99px 99px 0', transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ fontWeight: 800, color: '#63B3ED' }}>
            {team_a.split(' ')[0]} {hw}%
          </span>
          <span style={{ color: 'var(--text3)' }}>Nul {dw}%</span>
          <span style={{ fontWeight: 800, color: '#FC8181' }}>
            {aw}% {team_b.split(' ')[0]}
          </span>
        </div>
      </div>
    </div>
  )
}