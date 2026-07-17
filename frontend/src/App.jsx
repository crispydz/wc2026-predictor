import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useLanguage } from './context/LanguageContext'
import LanguageSwitcher from './components/LanguageSwitcher'
import Dashboard    from './pages/Dashboard'
import GroupStage   from './pages/GroupStage'
import Knockout     from './pages/Knockout'
import TeamAnalysis from './pages/TeamAnalysis'
import Simulator    from './pages/Simulator'

<button onClick={() => alert('lang: ' + lang)} style={{color:'white',padding:'4px 8px',background:'red'}}>
  TEST
</button>

export default function App() {
  const { t } = useLanguage()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const NAV = [
    { to:'/',         label: t('nav.dashboard'), icon:'📊' },
    { to:'/groups',   label: t('nav.groups'),    icon:'🗂️' },
    { to:'/knockout', label: t('nav.bracket'),   icon:'🏆' },
    { to:'/simulate', label: t('nav.simulate'),  icon:'⚽' },
    { to:'/teams',    label: t('nav.teams'),     icon:'🌍' },
  ]

  return (
    <BrowserRouter>
      <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

        {/* ── HEADER ─────────────────────────────────────── */}
        <header className="glass sticky top-0 z-50">
          <div style={{
            maxWidth:1360, margin:'0 auto',
            padding: isMobile ? '0 12px' : '0 24px',
            display:'flex', alignItems:'center',
            justifyContent:'space-between',
            height: isMobile ? 56 : 66,
            gap:12,
          }}>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap: isMobile?8:12, flexShrink:0 }}>
              <div style={{
                width: isMobile?34:42, height: isMobile?34:42, borderRadius:10,
                background:'linear-gradient(135deg,#E8271B,#FF5A50)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: isMobile?18:22, boxShadow:'0 4px 16px rgba(232,39,27,0.4)',
              }}>🏆</div>
              <div>
                <div style={{ fontSize: isMobile?15:18, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1 }}>
                  <span style={{ color:'var(--text1)' }}>WC</span>
                  <span className="gold-grad">2026</span>
                </div>
                {!isMobile && (
                  <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600, marginTop:1 }}>
                    🇺🇸 🇨🇦 🇲🇽 AI PREDICTOR
                  </div>
                )}
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display:'flex', gap: isMobile?1:2, flex:1, justifyContent:'center' }}>
              {NAV.map(n => (
                <NavLink key={n.to} to={n.to} end={n.to==='/'}>
                  {({ isActive }) => (
                    <div style={{
                      display:'flex', alignItems:'center',
                      gap: isMobile ? 0 : 6,
                      padding: isMobile ? '6px 9px' : '7px 14px',
                      borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
                      transition:'all 0.15s ease',
                      background: isActive ? 'rgba(232,39,27,0.15)' : 'transparent',
                      color:      isActive ? '#FF6B62' : 'var(--text2)',
                      border:     isActive ? '1px solid rgba(232,39,27,0.3)' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize: isMobile?18:14 }}>{n.icon}</span>
                      {!isMobile && <span>{n.label}</span>}
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right : badge + switcher */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {!isMobile && <div className="badge badge-gold">{t('nav.sims')}</div>}
              <LanguageSwitcher />
            </div>
          </div>

          {/* Accent line */}
          <div style={{ height:2, background:'linear-gradient(90deg,var(--red),var(--gold),var(--blue),transparent)' }}/>
        </header>

        {/* ── PAGES ──────────────────────────────────────── */}
        <main style={{
          maxWidth:1360, margin:'0 auto',
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

        {/* ── FOOTER ─────────────────────────────────────── */}
        <footer style={{
          borderTop:'1px solid var(--border)',
          padding: isMobile ? '12px' : '18px 24px',
          textAlign:'center', color:'var(--text3)',
          fontSize: isMobile ? 10 : 12,
        }}>
          ⚽ WC 2026 AI Predictor · Dixon-Coles + ELO + Monte Carlo · 🇺🇸 🇨🇦 🇲🇽
        </footer>
      </div>
    </BrowserRouter>
  )
}