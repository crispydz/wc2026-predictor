import React, { useMemo } from 'react'
import { getTopContenders, predictions, computeMatch } from '../data/predictions_static'
import { GROUPS } from '../data/tournament'
import Flag from '../components/Flag'
import ProbabilityBar from '../components/ProbabilityBar'
import { useIsMobile } from '../hooks/useIsMobile'
import { useLanguage } from '../context/LanguageContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#E8271B','#FF6B40','#F5A623','#0066CC','#4D9FFF','#7C3AED','#059669','#D97706','#94A3B8','#64748B']

function groupDifficulty() {
  const TD = {
    Argentina:2055,France:2033,Brazil:2006,England:1985,Spain:1940,
    Portugal:1945,Germany:1952,Belgium:1935,Netherlands:1927,Uruguay:1895,
    Colombia:1855,Morocco:1845,Senegal:1831,Japan:1869,Croatia:1825,
    Switzerland:1790,Mexico:1827,Norway:1760,USA:1814,'South Korea':1768,
    Austria:1745,Ecuador:1729,Türkiye:1755,Sweden:1740,'Ivory Coast':1737,
    Canada:1713,Australia:1745,Czechia:1672,Algeria:1655,Tunisia:1720,
    Egypt:1695,'South Africa':1573,Scotland:1664,Ghana:1675,Iran:1660,
    'Congo DR':1665,Paraguay:1641,'Bosnia-Herzegovina':1652,'Saudi Arabia':1695,
    Uzbekistan:1630,Qatar:1635,Iraq:1605,Jordan:1580,'Cabo Verde':1585,
    Panama:1575,'New Zealand':1535,Haiti:1486,'Curaçao':1488,
  }
  return Object.entries(GROUPS).map(([gid, g]) => {
    const elos = g.teams.map(t => TD[t] || 1600)
    const mean = elos.reduce((s,v)=>s+v,0)/elos.length
    const std  = Math.sqrt(elos.reduce((s,v)=>s+(v-mean)**2,0)/elos.length)
    return { gid, teams:g.teams, difficulty:Math.round(1000-std) }
  }).sort((a,b)=>b.difficulty-a.difficulty)
}

export default function Dashboard() {
  const isMobile   = useIsMobile()
  const { t }      = useLanguage()
  const contenders = getTopContenders(10)
  const chartData  = contenders.map(c => ({
    ...c,
    pct:  parseFloat((c.win_tournament*100).toFixed(1)),
    name: c.team.length>10 ? c.team.slice(0,10) : c.team,
  }))
  const top3         = contenders.slice(0,3)
  const groupDiff    = useMemo(()=>groupDifficulty(),[])
  const featuredMatch = useMemo(()=>computeMatch('Argentina','France'),[])

  const CustomTooltip = ({active,payload}) => {
    if(!active||!payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="card" style={{padding:'12px 16px',border:'1px solid rgba(232,39,27,0.3)'}}>
        <div style={{fontSize:14,fontWeight:700,color:'var(--text1)',marginBottom:4}}>{d.team}</div>
        <div style={{fontSize:13,color:'var(--gold)'}}>🏆 {d.pct}%</div>
        <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>
          Final: {((d.qualify_final||0)*100).toFixed(0)}% · SF: {((d.qualify_sf||0)*100).toFixed(0)}%
        </div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:28}} className="fade-up">

      {/* ── HERO ── */}
      <div className="wc-bg" style={{
        borderRadius:24,padding:isMobile?'36px 20px':'56px 40px',
        textAlign:'center',background:'var(--surface2)',
        border:'1px solid var(--border)',position:'relative',overflow:'hidden',
      }}>
        <div style={{position:'relative'}}>
          <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:14}}>
            {['USA','Canada','Mexico'].map(t2=><Flag key={t2} team={t2} size={22}/>)}
          </div>
          <div style={{
            display:'inline-block',fontSize:11,fontWeight:700,color:'#E8271B',
            letterSpacing:'0.12em',marginBottom:14,
            background:'rgba(232,39,27,0.1)',border:'1px solid rgba(232,39,27,0.25)',
            padding:'4px 14px',borderRadius:99,
          }}>{t('dash.badge')}</div>
          <h1 style={{fontSize:isMobile?28:46,fontWeight:900,letterSpacing:'-0.03em',marginBottom:10,lineHeight:1.1}}>
            <span className="red-grad">World Cup</span>{' '}
            <span className="gold-grad">2026</span>
          </h1>
          <p style={{fontSize:isMobile?13:15,color:'var(--text2)',marginBottom:28}}>
            {t('dash.subtitle')}
          </p>
          <div style={{display:'flex',justifyContent:'center',gap:isMobile?20:36}}>
            {[['48',t('dash.teams')],['12',t('dash.groups')],['104',t('dash.matches')],['50K',t('dash.sims')]].map(([n,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:isMobile?20:28,fontWeight:900,color:'var(--gold)'}}>{n}</div>
                <div style={{fontSize:11,color:'var(--text3)',fontWeight:600,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PODIUM ── */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr',gap:16}}>
        {top3.map((c,i)=>{
          const medals=['🥇','🥈','🥉']
          const labels=[t('dash.champion'),t('dash.finalist'),t('dash.third')]
          const borders=['rgba(245,166,35,0.35)','rgba(192,192,192,0.25)','rgba(180,83,9,0.25)']
          const bgs=['rgba(245,166,35,0.08)','rgba(192,192,192,0.05)','rgba(180,83,9,0.05)']
          return (
            <div key={c.team} className="card-hover" style={{
              padding:isMobile?'16px 20px':'28px 20px',borderRadius:20,
              background:bgs[i],border:`1px solid ${borders[i]}`,
              display:'flex',flexDirection:isMobile?'row':'column',
              alignItems:'center',gap:isMobile?16:0,textAlign:isMobile?'left':'center',
            }}>
              <div style={{fontSize:isMobile?32:36}}>{medals[i]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,
                             letterSpacing:'0.1em',marginBottom:isMobile?4:12}}>
                  {labels[i]}
                </div>
                <div style={{display:'flex',justifyContent:isMobile?'flex-start':'center',
                             marginBottom:isMobile?4:10}}>
                  <Flag team={c.team} size={isMobile?40:60}/>
                </div>
                <div style={{fontSize:isMobile?14:17,fontWeight:900,color:'var(--text1)'}}>
                  {c.team}
                </div>
              </div>
              <div style={{textAlign:isMobile?'right':'center'}}>
                <div style={{fontSize:isMobile?22:30,fontWeight:900,color:'var(--gold)'}}>
                  {(c.win_tournament*100).toFixed(1)}%
                </div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{t('dash.prob')}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── CHART ── */}
      <div className="card" style={{padding:isMobile?'16px':'28px'}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:isMobile?15:18,fontWeight:800,color:'var(--text1)',marginBottom:4}}>
            {t('dash.chart.title')}
          </div>
          <div style={{fontSize:13,color:'var(--text2)'}}>{t('dash.chart.sub')}</div>
        </div>
        <ResponsiveContainer width="100%" height={isMobile?200:240}>
          <BarChart data={chartData} margin={{top:5,right:10,left:0,bottom:28}}>
            <XAxis dataKey="name" tick={{fill:'#4A5878',fontSize:11}} axisLine={false}
                   tickLine={false} angle={-20} textAnchor="end"/>
            <YAxis tick={{fill:'#4A5878',fontSize:10}} axisLine={false}
                   tickLine={false} tickFormatter={v=>`${v}%`}/>
            <Tooltip content={<CustomTooltip/>} cursor={{fill:'rgba(255,255,255,0.02)'}}/>
            <Bar dataKey="pct" radius={[8,8,0,0]} maxBarSize={56}>
              {chartData.map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── FEATURED MATCH ── */}
      <div className="card" style={{padding:isMobile?'16px':'28px'}}>
        <div style={{fontSize:isMobile?15:16,fontWeight:800,color:'var(--text1)',marginBottom:18}}>
          {t('dash.dream')}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?12:20,flexWrap:'wrap'}}>
          <div style={{flex:1,textAlign:'center',minWidth:80}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:6}}>
              <Flag team="Argentina" size={isMobile?36:52}/>
            </div>
            <div style={{fontSize:isMobile?13:16,fontWeight:900,color:'var(--text1)'}}>Argentina</div>
            <div style={{fontSize:isMobile?18:24,fontWeight:900,color:'#63B3ED',marginTop:4}}>
              {Math.round(featuredMatch.home_win_prob*100)}%
            </div>
          </div>
          <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,
                         letterSpacing:'0.08em',marginBottom:8}}>{t('dash.predicted')}</div>
            <div style={{fontSize:isMobile?28:38,fontWeight:900,color:'var(--gold)',
                         fontFamily:'monospace'}}>{featuredMatch.most_likely_score}</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>
              {t('dash.draw')} {Math.round(featuredMatch.draw_prob*100)}%
            </div>
            <div style={{display:'flex',height:6,borderRadius:99,overflow:'hidden',
                         gap:1,marginTop:10,width:140,margin:'10px auto 0'}}>
              <div style={{width:`${Math.round(featuredMatch.home_win_prob*100)}%`,
                           background:'linear-gradient(90deg,#1A56DB,#3B82F6)'}}/>
              <div style={{width:`${Math.round(featuredMatch.draw_prob*100)}%`,background:'#2D3748'}}/>
              <div style={{width:`${Math.round(featuredMatch.away_win_prob*100)}%`,
                           background:'linear-gradient(90deg,#C53030,#E53E3E)'}}/>
            </div>
          </div>
          <div style={{flex:1,textAlign:'center',minWidth:80}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:6}}>
              <Flag team="France" size={isMobile?36:52}/>
            </div>
            <div style={{fontSize:isMobile?13:16,fontWeight:900,color:'var(--text1)'}}>France</div>
            <div style={{fontSize:isMobile?18:24,fontWeight:900,color:'#FC8181',marginTop:4}}>
              {Math.round(featuredMatch.away_win_prob*100)}%
            </div>
          </div>
        </div>
      </div>

      {/* ── STAGE PROBABILITIES ── */}
      <div className="card" style={{padding:isMobile?'16px':'28px'}}>
        <div style={{fontSize:isMobile?15:18,fontWeight:800,color:'var(--text1)',marginBottom:20}}>
          {t('dash.stages')}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:isMobile?14:20}}>
          {contenders.slice(0,8).map((c,i)=>{
            const stages = isMobile
              ? [['SF',c.qualify_sf,'#F97316'],['🏆',c.win_tournament,'#F5A623']]
              : [['R16',c.qualify_r16,'#4D9FFF'],['QF',c.qualify_qf,'#7C3AED'],
                 ['SF',c.qualify_sf,'#F97316'],['🏆',c.win_tournament,'#F5A623']]
            return (
              <div key={c.team} style={{display:'flex',alignItems:'center',gap:isMobile?8:14}}>
                <span style={{color:'var(--text3)',fontSize:11,fontWeight:700,width:18}}>{i+1}</span>
                <Flag team={c.team} size={isMobile?20:26}/>
                <span style={{fontSize:isMobile?11:14,fontWeight:700,color:'var(--text1)',
                              width:isMobile?70:130,flexShrink:0,
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {c.team}
                </span>
                <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${stages.length},1fr)`,
                             gap:isMobile?8:14}}>
                  {stages.map(([label,val,color])=>{
                    const pct=Math.min(100,Math.max(0,Math.round((val||0)*100)))
                    return (
                      <div key={label}>
                        <div style={{display:'flex',justifyContent:'space-between',
                                     fontSize:10,color:'var(--text3)',marginBottom:3}}>
                          <span style={{fontWeight:600}}>{label}</span>
                          <span style={{fontWeight:700,color}}>{pct}%</span>
                        </div>
                        <div style={{height:5,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
                          <div style={{width:`${pct}%`,height:'100%',borderRadius:99,
                                       background:`linear-gradient(90deg,${color}88,${color})`,
                                       transition:'width 1s ease'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BALANCED GROUPS ── */}
      <div className="card" style={{padding:isMobile?'16px':'28px'}}>
        <div style={{fontSize:isMobile?15:18,fontWeight:800,color:'var(--text1)',marginBottom:6}}>
          {t('dash.balanced')}
        </div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>
          {t('dash.bal.sub')}
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12}}>
          {groupDiff.slice(0,6).map(({gid,teams,difficulty},i)=>(
            <div key={gid} className="card-sm" style={{
              padding:'14px 16px',display:'flex',alignItems:'center',gap:14,
              borderLeft:`3px solid ${i<2?'var(--red)':i<4?'var(--gold)':'var(--text3)'}`,
            }}>
              <div style={{
                width:36,height:36,borderRadius:10,flexShrink:0,
                background:i<2?'rgba(232,39,27,0.2)':i<4?'rgba(245,166,35,0.15)':'rgba(74,88,120,0.2)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:16,fontWeight:900,
                color:i<2?'var(--red)':i<4?'var(--gold)':'var(--text2)',
              }}>{gid}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',gap:4,marginBottom:6,flexWrap:'wrap'}}>
                  {teams.map(t2=><Flag key={t2} team={t2} size={16} radius={2}/>)}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,height:4,borderRadius:99,
                               background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                    <div style={{width:`${(difficulty/1000)*100}%`,height:'100%',
                                 background:i<2?'var(--red)':i<4?'var(--gold)':'#4A5878',
                                 borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,flexShrink:0,whiteSpace:'nowrap',
                                color:i<2?'var(--red)':i<4?'var(--gold)':'var(--text3)'}}>
                    {i<2 ? t('dash.tight') : i<4 ? t('dash.balanced2') : t('dash.unbal')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODEL CARDS ── */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr',gap:16}}>
        {[
          {icon:'🧮',tKey:'m1',color:'#0066CC'},
          {icon:'📈',tKey:'m2',color:'#F5A623'},
          {icon:'🎲',tKey:'m3',color:'#E8271B'},
        ].map(m=>(
          <div key={m.tKey} className="card card-hover" style={{padding:'22px'}}>
            <div style={{fontSize:32,marginBottom:12}}>{m.icon}</div>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text1)',marginBottom:8,
                         borderLeft:`3px solid ${m.color}`,paddingLeft:10}}>
              {t(`dash.${m.tKey}.title`)}
            </div>
            <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.65}}>
              {t(`dash.${m.tKey}.desc`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}