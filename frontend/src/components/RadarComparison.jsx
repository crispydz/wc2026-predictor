import React from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend,
} from 'recharts'
import Flag from './Flag'

const TEAM_STATS = {
  Argentina:{att:1.85,def:0.60,elo:2055,wc:18,titles:3},
  France:{att:1.83,def:0.60,elo:2033,wc:16,titles:2},
  Brazil:{att:1.72,def:0.67,elo:2006,wc:22,titles:5},
  England:{att:1.65,def:0.70,elo:1985,wc:16,titles:1},
  Spain:{att:1.65,def:0.68,elo:1940,wc:16,titles:1},
  Portugal:{att:1.70,def:0.67,elo:1945,wc:9,titles:0},
  Germany:{att:1.62,def:0.69,elo:1952,wc:20,titles:4},
  Belgium:{att:1.55,def:0.72,elo:1935,wc:14,titles:0},
  Netherlands:{att:1.54,def:0.74,elo:1927,wc:11,titles:0},
  Uruguay:{att:1.40,def:0.76,elo:1895,wc:14,titles:2},
  Colombia:{att:1.50,def:0.78,elo:1855,wc:6,titles:0},
  Morocco:{att:1.28,def:0.70,elo:1845,wc:6,titles:0},
  Senegal:{att:1.27,def:0.83,elo:1831,wc:4,titles:0},
  Japan:{att:1.38,def:0.78,elo:1869,wc:8,titles:0},
  Croatia:{att:1.30,def:0.80,elo:1825,wc:8,titles:0},
  Switzerland:{att:1.20,def:0.80,elo:1790,wc:11,titles:0},
  Mexico:{att:1.38,def:0.80,elo:1827,wc:17,titles:0},
  Norway:{att:1.45,def:0.85,elo:1760,wc:3,titles:0},
  USA:{att:1.32,def:0.84,elo:1814,wc:11,titles:0},
  Türkiye:{att:1.42,def:0.80,elo:1755,wc:3,titles:0},
  'South Korea':{att:1.24,def:0.91,elo:1768,wc:11,titles:0},
  Austria:{att:1.15,def:0.92,elo:1745,wc:7,titles:0},
  Ecuador:{att:1.10,def:1.00,elo:1729,wc:4,titles:0},
  Sweden:{att:1.15,def:0.90,elo:1740,wc:12,titles:0},
  'Ivory Coast':{att:1.24,def:0.94,elo:1737,wc:4,titles:0},
  Canada:{att:1.14,def:0.91,elo:1713,wc:2,titles:0},
  Australia:{att:1.10,def:0.95,elo:1745,wc:6,titles:0},
  Czechia:{att:1.08,def:0.97,elo:1672,wc:9,titles:0},
  Algeria:{att:1.00,def:1.00,elo:1655,wc:4,titles:0},
  Tunisia:{att:1.00,def:0.98,elo:1720,wc:6,titles:0},
  Egypt:{att:1.05,def:0.97,elo:1695,wc:3,titles:0},
  Scotland:{att:1.06,def:0.99,elo:1664,wc:8,titles:0},
  Ghana:{att:0.95,def:1.02,elo:1675,wc:4,titles:0},
  Iran:{att:1.05,def:0.95,elo:1660,wc:6,titles:0},
  'Congo DR':{att:0.90,def:1.05,elo:1665,wc:1,titles:0},
  Paraguay:{att:0.90,def:1.05,elo:1641,wc:9,titles:0},
  'Bosnia-Herzegovina':{att:0.91,def:1.04,elo:1652,wc:1,titles:0},
  'Saudi Arabia':{att:0.95,def:1.02,elo:1695,wc:6,titles:0},
  Uzbekistan:{att:0.88,def:1.05,elo:1630,wc:0,titles:0},
  Qatar:{att:0.85,def:1.10,elo:1635,wc:1,titles:0},
  Iraq:{att:0.85,def:1.08,elo:1605,wc:1,titles:0},
  Jordan:{att:0.78,def:1.12,elo:1580,wc:0,titles:0},
  'Cabo Verde':{att:0.80,def:1.10,elo:1585,wc:0,titles:0},
  Panama:{att:0.75,def:1.15,elo:1575,wc:2,titles:0},
  'New Zealand':{att:0.70,def:1.20,elo:1535,wc:2,titles:0},
  'South Africa':{att:0.76,def:1.07,elo:1573,wc:3,titles:0},
  Haiti:{att:0.63,def:1.27,elo:1486,wc:1,titles:0},
  'Curaçao':{att:0.60,def:1.31,elo:1488,wc:0,titles:0},
}

function norm(v, min, max) {
  return Math.round(Math.min(100, Math.max(0, (v-min)/(max-min)*100)))
}

function getRadarData(team) {
  const d = TEAM_STATS[team] || { att:0.90, def:1.05, elo:1600, wc:2, titles:0 }
  return {
    attack:     norm(d.att, 0.60, 1.90),
    defense:    norm(1.40-d.def, 0, 0.80),
    elo:        norm(d.elo, 1450, 2100),
    experience: norm(d.wc, 0, 22),
    palmares:   Math.min(100, norm(d.titles, 0, 5) + 10),
  }
}

const DIMS = [
  { key:'attack',     label:'⚽ Attack'     },
  { key:'defense',    label:'🛡 Defense'    },
  { key:'elo',        label:'📈 ELO'        },
  { key:'experience', label:'🏟 Experience' },
  { key:'palmares',   label:'🏆 Trophies'  },
]

const CustomTick = ({ x, y, payload }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
    style={{ fontSize:11, fontWeight:600, fill:'var(--text2)' }}>
    {payload.value}
  </text>
)

export default function RadarComparison({ teamA, teamB }) {
  const raA = getRadarData(teamA)
  const raB = getRadarData(teamB)

  const data = DIMS.map(d => ({
    dimension: d.label,
    [teamA]: raA[d.key],
    [teamB]: raB[d.key],
  }))

  return (
    <div>
      {/* Team headers */}
      <div style={{ display:'flex', justifyContent:'space-around', marginBottom:20 }}>
        {[teamA, teamB].map((team, i) => (
          <div key={team} style={{ textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>
              <Flag team={team} size={36} />
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--text1)', marginTop:4 }}>
              {team}
            </div>
            <div style={{ width:60, height:4, borderRadius:99, margin:'8px auto 0',
                          background:i===0?'#E8271B':'#0066CC' }}/>
          </div>
        ))}
      </div>

      {/* Radar */}
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} margin={{ top:10, right:30, bottom:10, left:30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)"/>
          <PolarAngleAxis dataKey="dimension" tick={<CustomTick/>}/>
          <Radar name={teamA} dataKey={teamA}
            stroke="#E8271B" fill="#E8271B" fillOpacity={0.18} strokeWidth={2.5} dot/>
          <Radar name={teamB} dataKey={teamB}
            stroke="#0066CC" fill="#0066CC" fillOpacity={0.18} strokeWidth={2.5} dot/>
          <Legend formatter={v => (
            <span style={{ color:'var(--text2)', fontSize:13, fontWeight:600 }}>
              {v}
            </span>
          )}/>
        </RadarChart>
      </ResponsiveContainer>

      {/* Dimension scores */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginTop:12 }}>
        {DIMS.map(d => {
          const vA = raA[d.key], vB = raB[d.key]
          const winsA = vA > vB
          const tie   = vA === vB
          return (
            <div key={d.key} style={{
              textAlign:'center', padding:'8px',
              background:'var(--surface3)', borderRadius:10,
            }}>
              <div style={{ fontSize:10, color:'var(--text3)', marginBottom:5 }}>{d.label}</div>
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:14, fontWeight:800,
                               color:winsA?'#E8271B':tie?'var(--text3)':'var(--text2)' }}>
                  {vA}
                </span>
                <span style={{ fontSize:10, color:'var(--text3)' }}>vs</span>
                <span style={{ fontSize:14, fontWeight:800,
                               color:!winsA&&!tie?'#0066CC':tie?'var(--text3)':'var(--text2)' }}>
                  {vB}
                </span>
              </div>
              {!tie && (
                <div style={{ fontSize:9, marginTop:3, fontWeight:700,
                              color:winsA?'#E8271B':'#0066CC' }}>
                  {winsA ? `✓ ${teamA.split(' ')[0]}` : `✓ ${teamB.split(' ')[0]}`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}