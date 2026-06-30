import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'

const LANGS = [
  { code:'fr', label:'Français', flag:'🇫🇷' },
  { code:'en', label:'English',  flag:'🇺🇸' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top:0, right:0 })
  const btnRef            = useRef(null)

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
  }, [])

  const toggle = () => {
    updatePos()
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!btnRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    window.addEventListener('resize', () => { updatePos() })
    return () => { document.removeEventListener('mousedown', close) }
  }, [open, updatePos])

  const current = LANGS.find(l => l.code === lang) || LANGS[0]
  const other   = LANGS.find(l => l.code !== lang)

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'7px 13px', borderRadius:10, cursor:'pointer',
          background: open ? 'rgba(245,166,35,0.14)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color:'var(--text1)', fontSize:13, fontWeight:700,
          transition:'all 0.15s', outline:'none',
          position:'relative', zIndex:9999,
        }}
      >
        <span style={{ fontSize:18, lineHeight:1 }}>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span style={{
          fontSize:8, color:'var(--text3)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition:'transform 0.2s', display:'inline-block', marginLeft:1,
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position:'fixed',
          top: pos.top,
          right: pos.right,
          zIndex: 99999,
          background:'var(--surface2)',
          border:'1px solid var(--border2)',
          borderRadius:14,
          overflow:'hidden',
          boxShadow:'0 16px 48px rgba(0,0,0,0.7)',
          minWidth:170,
          animation:'scaleIn 0.15s ease-out',
        }}>
          {/* Active */}
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 16px',
            background:'rgba(245,166,35,0.08)',
            borderBottom:'1px solid var(--border)',
          }}>
            <span style={{ fontSize:26 }}>{current.flag}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text1)' }}>{current.label}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:600, marginTop:1 }}>✓ Active</div>
            </div>
          </div>

          {/* Switch */}
          <button
            onClick={() => { setLang(other.code); setOpen(false) }}
            style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 16px', width:'100%', cursor:'pointer',
              background:'transparent', border:'none', textAlign:'left',
              transition:'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <span style={{ fontSize:26 }}>{other.flag}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text1)' }}>{other.label}</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Switch language</div>
            </div>
          </button>
        </div>
      )}
    </>
  )
}