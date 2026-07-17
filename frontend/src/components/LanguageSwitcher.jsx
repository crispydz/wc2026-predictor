import React from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const isFr = lang === 'fr'

  return (
    <div style={{ display:'flex', gap:4 }}>
      <button
        onClick={() => setLang('fr')}
        style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'6px 11px', borderRadius:8, cursor:'pointer',
          background: isFr ? 'rgba(245,166,35,0.18)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isFr ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: isFr ? 'var(--gold)' : 'var(--text2)',
          fontSize:12, fontWeight:700, outline:'none',
          transition:'all 0.15s', pointerEvents:'all',
        }}
      >
        🇫🇷 <span>FR</span>
      </button>
      <button
        onClick={() => setLang('en')}
        style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'6px 11px', borderRadius:8, cursor:'pointer',
          background: !isFr ? 'rgba(245,166,35,0.18)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${!isFr ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: !isFr ? 'var(--gold)' : 'var(--text2)',
          fontSize:12, fontWeight:700, outline:'none',
          transition:'all 0.15s', pointerEvents:'all',
        }}
      >
        🇺🇸 <span>EN</span>
      </button>
    </div>
  )
}