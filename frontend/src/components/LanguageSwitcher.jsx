import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const LANGS = [
  { code:'fr', label:'Français', flag:'🇫🇷', sub:'Langue actuelle' },
  { code:'en', label:'English',  flag:'🇺🇸', sub:'Switch language' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen]   = useState(false)
  const ref               = useRef(null)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const current = LANGS.find(l => l.code === lang) || LANGS[0]
  const other   = LANGS.find(l => l.code !== lang)

  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>

      {/* ── Bouton principal ── */}
      <button onClick={() => setOpen(o => !o)} style={{
        display:'flex', alignItems:'center', gap:7,
        padding:'7px 13px', borderRadius:10, cursor:'pointer',
        background: open ? 'rgba(245,166,35,0.14)' : 'rgba(255,255,255,0.05)',
        border:`1px solid ${open ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color:'var(--text1)', fontSize:13, fontWeight:700,
        transition:'all 0.15s ease', outline:'none',
      }}>
        <span style={{ fontSize:18, lineHeight:1 }}>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span style={{
          fontSize:8, color:'var(--text3)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition:'transform 0.2s ease', display:'inline-block', marginLeft:1,
        }}>▼</span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0,
          background:'var(--surface2)', border:'1px solid var(--border2)',
          borderRadius:14, overflow:'hidden', zIndex:1000,
          boxShadow:'0 12px 40px rgba(0,0,0,0.55)',
          minWidth:170,
          animation:'scaleIn 0.15s ease-out',
        }}>
          {/* Langue active */}
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 16px',
            background:'rgba(245,166,35,0.08)',
            borderBottom:'1px solid var(--border)',
          }}>
            <span style={{ fontSize:26 }}>{current.flag}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text1)' }}>
                {current.label}
              </div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:600, marginTop:1 }}>
                ✓ Active
              </div>
            </div>
          </div>

          {/* Autre langue */}
          <button onClick={() => { setLang(other.code); setOpen(false) }} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 16px', width:'100%', cursor:'pointer',
            background:'transparent', border:'none', textAlign:'left',
            transition:'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <span style={{ fontSize:26 }}>{other.flag}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text1)' }}>
                {other.label}
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>
                {other.sub}
              </div>
            </div>
          </button>

          {/* Indicateur bas */}
          <div style={{
            padding:'6px 16px', fontSize:10, color:'var(--text3)',
            borderTop:'1px solid var(--border)',
            textAlign:'center', background:'rgba(0,0,0,0.15)',
          }}>
            Saved automatically
          </div>
        </div>
      )}
    </div>
  )
}