import React, { createContext, useContext, useState } from 'react'
import fr from '../i18n/fr'
import en from '../i18n/en'

const translations = { fr, en }
const Ctx = createContext({ lang:'fr', t:(k)=>k, setLang:()=>{} })

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('wc2026_lang') || 'fr'
  )
  const t = (key, vars = {}) => {
    const str = translations[lang]?.[key] ?? translations.fr?.[key] ?? key
    return Object.entries(vars).reduce((s,[k,v]) => s.replace(`{${k}}`, v), str)
  }
  const setLang = (l) => { setLangState(l); localStorage.setItem('wc2026_lang', l) }
  return <Ctx.Provider value={{ lang, t, setLang }}>{children}</Ctx.Provider>
}

export const useLanguage = () => useContext(Ctx)