import React, { createContext, useContext, useState } from 'react'

const fr = {
  'nav.dashboard':'Dashboard','nav.groups':'Groupes','nav.bracket':'Tableau',
  'nav.simulate':'Simuler','nav.teams':'Équipes','nav.sims':'50K Sims',
  'dash.champion':'CHAMPION PRÉDIT','dash.finalist':'FINALISTE','dash.third':'3ème PLACE',
  'dash.prob':'prob. de titre','dash.badge':'FIFA WORLD CUP 2026 · 48 ÉQUIPES',
  'dash.subtitle':'Prédictions IA · Dixon-Coles + ELO + Monte Carlo · 50,000 simulations',
  'dash.teams':'Équipes','dash.groups':'Groupes','dash.matches':'Matchs','dash.sims':'Simulations',
  'dash.chart.title':'🎯 Probabilités de titre — Top 10',
  'dash.chart.sub':'Basé sur 50,000 simulations Monte Carlo',
  'dash.dream':'🔥 Match de rêve — Simulation','dash.predicted':'BUTS ATTENDUS','dash.draw':'Nul:',
  'dash.stages':'📊 Probabilités par phase — Top 8',
  'dash.balanced':'💀 Groupes les plus équilibrés',
  'dash.bal.sub':'Plus les 4 équipes sont proches en niveau, plus le groupe est indécis',
  'dash.tight':'🔥 Très serré','dash.balanced2':'⚡ Équilibré','dash.unbal':'Déséquilibré',
  'dash.m1.title':'Dixon-Coles Poisson','dash.m1.desc':'Modèle académique sur buts. Correction des faibles scores. MLE ajusté sur données réelles.',
  'dash.m2.title':'ELO Ratings','dash.m2.desc':"Force relative basée sur l'historique international. Mise à jour via ClubElo.",
  'dash.m3.title':'Monte Carlo 50K','dash.m3.desc':'50,000 simulations complètes. Forme, blessures, meilleurs 3es, tableau officiel.',
  'grp.title':'🗂️ Phase de Groupes','grp.sub':'12 groupes · 72 matchs · Top 2 + 8 meilleurs 3es → R32',
  'grp.tight':'matchs indécis','grp.search':'🔍 Rechercher une équipe...',
  'grp.hint':'💡 Clique sur un groupe pour voir les 6 matchs',
  'grp.thirds.title':'🔢 Meilleurs 3es prédits — 8 qualifiés sur 12',
  'grp.thirds.sub':'Calculé dynamiquement · Pts → Diff. buts → Buts → ELO',
  'grp.leg.q':'✓ Qualifié (Top 2)','grp.leg.m':'~ Qualifiable (3e)','grp.leg.t':'⚡ Match serré',
  'grp.label':'GROUPE','grp.qualified':'✓ Qualif.','grp.maybe':'~3e',
  'grp.matches':'⚽ 6 MATCHS DU GROUPE','grp.tight.badge':'serré',
  'mc.xg':'BUTS ATTENDUS','mc.scores':'SCORES LES PLUS PROBABLES',
  'mc.draw':'Nul','mc.best':'PLUS PROBABLE',
  'ko.title':'🏆 Tableau Knockout',
  'ko.sub':'Structure officielle FIFA 2026 · Matchs M73–M88 · 50,000 simulations',
  'ko.champion':'CHAMPION PRÉDIT','ko.r32':'Round of 32','ko.r16':'Round of 16',
  'ko.qf':'Quarts de finale','ko.sf':'Demi-finales','ko.final':'Finale',
  'ko.prob':'📊 Probabilités complètes','ko.tbd':'TBD',
  'sim.title':'⚽ Simulateur de Match',
  'sim.sub':"Simule n'importe quel match · Gère les blessures · Analyse détaillée",
  'sim.teamA':'🔴 ÉQUIPE A','sim.teamB':'🔵 ÉQUIPE B','sim.predicted':'SCORE PRÉDIT',
  'sim.injuries':'🩹 BLESSURES','sim.inj.active':'⚠️ Blessures actives',
  'sim.inj.impact':'⚠️ Impact des blessures','sim.inj.vs':'vs sans blessures',
  'sim.draw':'Nul —','sim.analysis':'📊 Analyse détaillée',
  'sim.likely':'⚽ Scores les plus probables','sim.best':'PLUS PROBABLE',
  'sim.wins':'gagne','sim.draw2':'Match nul','sim.att':'att.','sim.title_prob':'🏆 de titre',
  'teams.title':'🔍 Analyse & Comparaison','teams.sub':'Compare deux équipes par phase',
  'teams.A':'🔴 ÉQUIPE A','teams.B':'🔵 ÉQUIPE B',
  'teams.h2h':'RAPPORT DE FORCE — CHANCES DE TITRE','teams.all':'📋 Toutes les équipes',
  'teams.r32':'Round of 32','teams.r16':'Round of 16','teams.qf':'Quarts',
  'teams.sf':'Demies','teams.final':'Finale','teams.title2':'🏆 Titre',
  'common.vs':'VS','common.champion':'🏆 Champion','common.group':'Groupe','common.draw':'Nul',
}

const en = {
  'nav.dashboard':'Dashboard','nav.groups':'Groups','nav.bracket':'Bracket',
  'nav.simulate':'Simulate','nav.teams':'Teams','nav.sims':'50K Sims',
  'dash.champion':'PREDICTED CHAMPION','dash.finalist':'LIKELY FINALIST','dash.third':'3rd PLACE',
  'dash.prob':'title probability','dash.badge':'FIFA WORLD CUP 2026 · 48 TEAMS',
  'dash.subtitle':'AI Predictions · Dixon-Coles + ELO + Monte Carlo · 50,000 simulations',
  'dash.teams':'Teams','dash.groups':'Groups','dash.matches':'Matches','dash.sims':'Simulations',
  'dash.chart.title':'🎯 Title Probabilities — Top 10',
  'dash.chart.sub':'Based on 50,000 complete Monte Carlo simulations',
  'dash.dream':'🔥 Dream Match — Simulation','dash.predicted':'EXPECTED GOALS','dash.draw':'Draw:',
  'dash.stages':'📊 Stage Probabilities — Top 8',
  'dash.balanced':'💀 Most Balanced Groups',
  'dash.bal.sub':'The closer the 4 teams in level, the more unpredictable the group',
  'dash.tight':'🔥 Very tight','dash.balanced2':'⚡ Balanced','dash.unbal':'Unbalanced',
  'dash.m1.title':'Dixon-Coles Poisson','dash.m1.desc':'Academic goals model. Low-score correction. MLE fitted on real data.',
  'dash.m2.title':'ELO Ratings','dash.m2.desc':'Relative strength based on international history. Updated via ClubElo.',
  'dash.m3.title':'Monte Carlo 50K','dash.m3.desc':'50,000 full simulations. Form, injuries, best 3rds, official bracket.',
  'grp.title':'🗂️ Group Stage','grp.sub':'12 groups · 72 matches · Top 2 + 8 best 3rds → R32',
  'grp.tight':'tight matches','grp.search':'🔍 Search a team...',
  'grp.hint':'💡 Click a group to see the 6 matches',
  'grp.thirds.title':'🔢 Best Predicted 3rds — 8 qualified out of 12',
  'grp.thirds.sub':'Dynamically computed · Pts → Goal diff → Goals → ELO',
  'grp.leg.q':'✓ Qualified (Top 2)','grp.leg.m':'~ Qualifiable (3rd)','grp.leg.t':'⚡ Tight match',
  'grp.label':'GROUP','grp.qualified':'✓ Qualified','grp.maybe':'~3rd',
  'grp.matches':'⚽ 6 GROUP MATCHES','grp.tight.badge':'tight',
  'mc.xg':'EXPECTED GOALS','mc.scores':'MOST LIKELY SCORES',
  'mc.draw':'Draw','mc.best':'MOST LIKELY',
  'ko.title':'🏆 Knockout Bracket',
  'ko.sub':'Official FIFA 2026 structure · Matches M73–M88 · 50,000 simulations',
  'ko.champion':'PREDICTED CHAMPION','ko.r32':'Round of 32','ko.r16':'Round of 16',
  'ko.qf':'Quarter-finals','ko.sf':'Semi-finals','ko.final':'Final',
  'ko.prob':'📊 Full Probabilities','ko.tbd':'TBD',
  'sim.title':'⚽ Match Simulator',
  'sim.sub':'Simulate any match · Manage injuries · Detailed analysis',
  'sim.teamA':'🔴 TEAM A','sim.teamB':'🔵 TEAM B','sim.predicted':'PREDICTED SCORE',
  'sim.injuries':'🩹 INJURIES','sim.inj.active':'⚠️ Active injuries',
  'sim.inj.impact':'⚠️ Injury impact','sim.inj.vs':'vs without injuries',
  'sim.draw':'Draw —','sim.analysis':'📊 Detailed analysis',
  'sim.likely':'⚽ Most likely scores','sim.best':'MOST LIKELY',
  'sim.wins':'wins','sim.draw2':'Draw','sim.att':'att.','sim.title_prob':'🏆 title chance',
  'teams.title':'🔍 Analysis & Comparison','teams.sub':'Compare two teams by stage',
  'teams.A':'🔴 TEAM A','teams.B':'🔵 TEAM B',
  'teams.h2h':'HEAD TO HEAD — TITLE CHANCES','teams.all':'📋 All teams',
  'teams.r32':'Round of 32','teams.r16':'Round of 16','teams.qf':'Quarters',
  'teams.sf':'Semis','teams.final':'Final','teams.title2':'🏆 Title',
  'common.vs':'VS','common.champion':'🏆 Champion','common.group':'Group','common.draw':'Draw',
}

const translations = { fr, en }
const Ctx = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('wc2026_lang') || 'fr' }
    catch { return 'fr' }
  })

  const t = (key) => translations[lang]?.[key] ?? translations.fr?.[key] ?? key

  const setLang = (l) => {
    setLangState(l)
    try { localStorage.setItem('wc2026_lang', l) } catch {}
  }

  return <Ctx.Provider value={{ lang, t, setLang }}>{children}</Ctx.Provider>
}

export function useLanguage() {
  const ctx = useContext(Ctx)
  if (!ctx) return { lang:'fr', t:(k)=>k, setLang:()=>{} }
  return ctx
}