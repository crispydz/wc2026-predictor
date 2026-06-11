import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard    from './pages/Dashboard'
import GroupStage   from './pages/GroupStage'
import Knockout     from './pages/Knockout'
import TeamAnalysis from './pages/TeamAnalysis'
import Simulator    from './pages/Simulator'

const NAV = [
  { to:'/',         label:'Dashboard',  icon:'📊' },
  { to:'/groups',   label:'Groupes',    icon:'🗂️' },
  { to:'/knockout', label:'Tableau',    icon:'🏆' },
  { to:'/simulate', label:'Simuler',    icon:'⚽' },
  { to:'/teams',    label:'Équipes',    icon:'🌍' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

        {/* ─── HEADER ─────────────────────────────────── */}
        <header className="glass sticky top-0 z-50">
          <div style={{ maxWidth:1360, margin:'0 auto', padding:'0 28px',
                        display:'flex', alignItems:'center', gap:20, height:66 }}>

            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
              <div style={{
                width:42, height:42, borderRadius:12, flexShrink:0,
                background:'linear-gradient(135deg,#E8271B,#FF5A50)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, boxShadow:'0 4px 16px rgba(232,39,27,0.4)',
              }}>🏆</div>
              <div>
                <div style={{ fontSize:18, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1 }}>
                  <span style={{ color:'var(--text1)' }}>WC</span>
                  <span className="gold-grad">2026</span>
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600,
                              letterSpacing:'0.06em', marginTop:1 }}>
                  🇺🇸 🇨🇦 🇲🇽 AI PREDICTOR
                </div>
              </div>
            </div>

            {/* Nav — centre */}
            <nav style={{ display:'flex', gap:2, flex:1, justifyContent:'center' }}>
              {NAV.map(n => (
                <NavLink key={n.to} to={n.to} end={n.to==='/'}>
                  {({ isActive }) => (
                    <div style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'8px 18px', borderRadius:10,
                      fontSize:14, fontWeight:600, cursor:'pointer',
                      transition:'all 0.15s ease',
                      background: isActive ? 'rgba(232,39,27,0.15)' : 'transparent',
                      color:      isActive ? '#FF6B62'              : 'var(--text2)',
                      border:     isActive ? '1px solid rgba(232,39,27,0.3)' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize:15 }}>{n.icon}</span>
                      <span>{n.label}</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right badge */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <div className="badge badge-gold">50K Sims</div>
              <div className="badge badge-red">Live 2026</div>
            </div>
          </div>

          {/* Red/Gold accent line */}
          <div style={{ height:2,
            background:'linear-gradient(90deg,var(--red),var(--gold),var(--blue),transparent)' }}/>
        </header>

        {/* ─── PAGES ──────────────────────────────────── */}
        <main style={{ maxWidth:1360, margin:'0 auto', padding:'32px 28px 100px' }}>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/groups"   element={<GroupStage />} />
            <Route path="/knockout" element={<Knockout />} />
            <Route path="/simulate" element={<Simulator />} />
            <Route path="/teams"    element={<TeamAnalysis />} />
          </Routes>
        </main>

        {/* ─── FOOTER ─────────────────────────────────── */}
        <footer style={{
          borderTop:'1px solid var(--border)', padding:'18px 28px',
          textAlign:'center', color:'var(--text3)', fontSize:12,
        }}>
          ⚽ WC 2026 AI Predictor · Dixon-Coles Poisson + ELO Ratings + Monte Carlo
          · <span className="gold">50,000 simulations</span>
          · 🇺🇸 🇨🇦 🇲🇽
        </footer>
      </div>
    </BrowserRouter>
  )
}