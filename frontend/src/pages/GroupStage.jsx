import React, { useState } from 'react'
import { predictions } from '../data/predictions_static'
import { getGroupForTeam } from '../data/tournament'
import GroupCard from '../components/GroupCard'
import Flag from '../components/Flag'
import { useIsMobile } from '../hooks/useIsMobile'

export default function GroupStage() {
  const [search, setSearch] = useState('')
  const isMobile = useIsMobile()
  const groupIds = Object.keys(predictions.group_predictions)

  let totalUpsets = 0
  groupIds.forEach(gid => {
    const m = predictions.group_predictions[gid]?.matches || []
    m.forEach(match => {
      if (Math.min(match.home_win_prob, match.away_win_prob) > 0.33 &&
          Math.abs(match.home_win_prob - match.away_win_prob) < 0.20)
        totalUpsets++
    })
  })

  const filtered = search
    ? groupIds.filter(gid =>
        predictions.group_predictions[gid].teams.some(t =>
          t.toLowerCase().includes(search.toLowerCase())))
    : groupIds

  const bestThirds = predictions.predicted_bracket?.best_thirds || []

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 900,
                     color: 'var(--text1)', marginBottom: 6 }}>
          🗂️ Phase de Groupes
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)',
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          12 groupes · 72 matchs · Top 2 + 8 meilleurs 3es → R32
          {totalUpsets > 0 && (
            <span className="badge badge-red">⚡ {totalUpsets} matchs indécis</span>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center',
                    marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher une équipe..."
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1px solid var(--border2)',
            background: 'var(--surface2)', color: 'var(--text1)',
            fontSize: 13, outline: 'none',
            width: isMobile ? '100%' : 220,
          }}
        />
        {!isMobile && (
          <div style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>
            💡 Clique sur un groupe pour voir les 6 matchs
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 16,
      }}>
        {filtered.map(gid => (
          <GroupCard key={gid} groupId={gid} data={predictions.group_predictions[gid]} />
        ))}
      </div>

      {/* Meilleurs 3es */}
      <div className="card" style={{ padding: '24px', marginTop: 28 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>
            🔢 Meilleurs 3es prédits — 8 qualifiés sur 12
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            Calculé dynamiquement · Pts → Diff. buts → Buts → ELO
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {bestThirds.map((team, i) => {
            const gid = getGroupForTeam(team) || '?'
            return (
              <div key={team} style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(232,39,27,0.06)',
                border: '1px solid rgba(232,39,27,0.2)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--red)', width: 20 }}>
                  {i + 1}
                </span>
                <Flag team={team} size={22} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{team}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Groupe {gid}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}