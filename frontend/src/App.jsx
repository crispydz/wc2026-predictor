import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard    from './pages/Dashboard'
import GroupStage   from './pages/GroupStage'
import Knockout     from './pages/Knockout'
import TeamAnalysis from './pages/TeamAnalysis'
import Simulator    from './pages/Simulator'


const NAV = [
  { to: '/',         label: 'Dashboard', icon: '📊' },
  { to: '/groups',   label: 'Groupes',   icon: '🗂️' },
  { to: '/knockout', label: 'Tableau',   icon: '🏆' },
  { to: '/simulate', label: 'Simuler',   icon: '⚽' },
  { to: '/teams',    label: 'Équipes',   icon: '🌍' },
]

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        <header className="glass sticky top-0 z-50">
          <div style={{
            maxWidth: 1360, margin: '0 auto',
            // ← desktop: padding 24px | mobile: padding 12px
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            // ← desktop: 66px | mobile: 56px
            height: isMobile ? 56 : 66,
          }}>

            {/* Logo — identique sur desktop, légèrement réduit sur mobile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
              <div style={{
                width: isMobile ? 34 : 42, height: isMobile ? 34 : 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#E8271B,#FF5A50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? 18 : 22,
                boxShadow: '0 4px 16px rgba(232,39,27,0.4)',
              }}>🏆</div>
              <div>
                <div style={{
                  fontSize: isMobile ? 15 : 18,
                  fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  <span style={{ color: 'var(--text1)' }}>WC</span>
                  <span className="gold-grad">2026</span>
                </div>
                {/* Sous-titre masqué sur mobile */}
                {!isMobile && (
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 1 }}>
                    🇺🇸 🇨🇦 🇲🇽 AI PREDICTOR
                  </div>
                )}
              </div>
            </div>

            {/* Nav — desktop: icône + texte | mobile: icône seule */}
            <nav style={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
              {NAV.map(n => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'}>
                  {({ isActive }) => (
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      // ← desktop: gap 6, padding 7/14 | mobile: pas de gap, padding réduit
                      gap: isMobile ? 0 : 6,
                      padding: isMobile ? '6px 9px' : '7px 14px',
                      borderRadius: 10,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: isActive ? 'rgba(232,39,27,0.15)' : 'transparent',
                      color:      isActive ? '#FF6B62' : 'var(--text2)',
                      border:     isActive ? '1px solid rgba(232,39,27,0.3)' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize: isMobile ? 18 : 14 }}>{n.icon}</span>
                      {/* Texte masqué sur mobile */}
                      {!isMobile && <span>{n.label}</span>}
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Badge — masqué sur mobile */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <div className="badge badge-gold">50K Sims</div>
              </div>
            )}
          </div>
          <div style={{
            height: 2,
            background: 'linear-gradient(90deg,var(--red),var(--gold),var(--blue),transparent)',
          }} />
        </header>

        <main style={{
          maxWidth: 1360, margin: '0 auto',
          // ← desktop: 32px 24px | mobile: 16px 12px
          padding: isMobile ? '16px 12px 80px' : '32px 24px 100px',
        }}>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/groups"   element={<GroupStage />} />
            <Route path="/knockout" element={<Knockout />} />
            <Route path="/simulate" element={<Simulator />} />
            <Route path="/teams"    element={<TeamAnalysis />} />
          </Routes>
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '18px 24px',
          textAlign: 'center', color: 'var(--text3)',
          fontSize: isMobile ? 10 : 12,
        }}>
          ⚽ WC 2026 AI Predictor · Dixon-Coles + ELO + Monte Carlo · 🇺🇸 🇨🇦 🇲🇽
        </footer>
      </div>
    </BrowserRouter>
  )
}