import React from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts'
import Flag from '../components/Flag'

const TD = {
  Argentina:{elo:2055,att:1.85,def:0.60,wc:18,titles:3},
  France:{elo:2025,att:1.80,def:0.62,wc:16,titles:2},
  Brazil:{elo:2010,att:1.75,def:0.65,wc:22,titles:5},
  England:{elo:1985,att:1.65,def:0.70,wc:16,titles:1},
  Spain:{elo:1940,att:1.65,def:0.68,wc:16,titles:1},
  Portugal:{elo:1945,att:1.70,def:0.67,wc:9,titles:0},
  Germany:{elo:1950,att:1.60,def:0.70,wc:20,titles:4},
  Belgium:{elo:1935,att:1.55,def:0.72,wc:14,titles:0},
  Netherlands:{elo:1930,att:1.55,def:0.72,wc:11,titles:0},
  Uruguay:{elo:1895,att:1.40,def:0.76,wc:14,titles:2},
  Colombia:{elo:1855,att:1.50,def:0.78,wc:6,titles:0},
  Morocco:{elo:1840,att:1.25,def:0.72,wc:6,titles:0},
  Senegal:{elo:1840,att:1.30,def:0.80,wc:4,titles:0},
  Japan:{elo:1865,att:1.35,def:0.80,wc:8,titles:0},
  Croatia:{elo:1825,att:1.30,def:0.80,wc:8,titles:0},
  Switzerland:{elo:1790,att:1.20,def:0.80,wc:11,titles:0},
  Mexico:{elo:1820,att:1.35,def:0.82,wc:17,titles:0},
  Norway:{elo:1760,att:1.45,def:0.85,wc:3,titles:0},
  USA:{elo:1805,att:1.30,def:0.85,wc:11,titles:0},
  Türkiye:{elo:1755,att:1.42,def:0.80,wc:3,titles:0},
  Austria:{elo:1745,att:1.15,def:0.92,wc:7,titles:0},
  Ecuador:{elo:1745,att:1.12,def:0.98,wc:4,titles:0},
  "South Korea":{elo:1755,att:1.20,def:0.93,wc:11,titles:0},
  Australia:{elo:1745,att:1.10,def:0.95,wc:6,titles:0},
  Sweden:{elo:1740,att:1.15,def:0.90,wc:12,titles:0},
  "Ivory Coast":{elo:1720,att:1.18,def:0.97,wc:4,titles:0},
  Canada:{elo:1715,att:1.15,def:0.90,wc:2,titles:0},
  Czechia:{elo:1685,att:1.10,def:0.95,wc:9,titles:0},
  Algeria:{elo:1655,att:1.00,def:1.00,wc:4,titles:0},
  Tunisia:{elo:1720,att:1.00,def:0.98,wc:6,titles:0},
  Egypt:{elo:1695,att:1.05,def:0.97,wc:3,titles:0},
  "South Africa":{elo:1580,att:0.78,def:1.05,wc:3,titles:0},
  Scotland:{elo:1660,att:1.05,def:1.00,wc:8,titles:0},
  Ghana:{elo:1675,att:0.95,def:1.02,wc:4,titles:0},
  Iran:{elo:1660,att:1.05,def:0.95,wc:6,titles:0},
  "Congo DR":{elo:1665,att:0.90,def:1.05,wc:1,titles:0},
  Paraguay:{elo:1650,att:0.92,def:1.02,wc:9,titles:0},
  "Bosnia-Herzegovina":{elo:1650,att:0.90,def:1.05,wc:1,titles:0},
  "Saudi Arabia":{elo:1695,att:0.95,def:1.02,wc:6,titles:0},
  Uzbekistan:{elo:1630,att:0.88,def:1.05,wc:0,titles:0},
  Qatar:{elo:1635,att:0.85,def:1.10,wc:1,titles:0},
  Iraq:{elo:1605,att:0.85,def:1.08,wc:1,titles:0},
  Jordan:{elo:1580,att:0.78,def:1.12,wc:0,titles:0},
  "Cabo Verde":{elo:1585,att:0.80,def:1.10,wc:0,titles:0},
  Panama:{elo:1575,att:0.75,def:1.15,wc:2,titles:0},
  "New Zealand":{elo:1535,att:0.70,def:1.20,wc:2,titles:0},
  Haiti:{elo:1490,att:0.65,def:1.25,wc:1,titles:0},
  "Curaçao":{elo:1490,att:0.62,def:1.28,wc:0,titles:0},
}

function norm(v, min, max) { return Math.round(Math.min(100,Math.max(0,(v-min)/(max-min)*100))) }

function getRadar(team) {
  const d = TD[team] || {elo:1600,att:0.90,def:1.05,wc:2,titles:0}
  return [
    { dim:'⚽ Attaque',    val: norm(d.att, 0.60, 1.90) },
    { dim:'🛡 Défense',    val: norm(1.35-d.def, 0.00, 0.75) },
    { dim:'📈 ELO',        val: norm(d.elo, 1450, 2100) },
    { dim:'🏟 Expérience', val: norm(d.wc, 0, 22) },
    { dim:'🏆 Palmarès',   val: Math.min(100, norm(d.titles, 0, 5)+10) },
  ]
}

export default function RadarComparison({ teamA, teamB }) {
  const ra = getRadar(teamA)
  const rb = getRadar(teamB)

  const data = ra.map((d,i) => ({
    dimension: d.dim,
    [teamA]: d.val,
    [teamB]: rb[i].val,
  }))

  const CustomTick = ({ x, y, payload }) => (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
      style={{ fontSize:12, fontWeight:600, fill:'var(--text2)' }}>
      {payload.value}
    </text>
  )

  return (
    <div>
      {/* Team headers */}
      <div style={{ display:'flex', justifyContent:'space-around', marginBottom:16 }}>
        {[teamA, teamB].map((t,i)=>(
          <div key={t} style={{ textAlign:'center' }}>
            <Flag team={t} size={36} />
            <div style={{ fontSize:14, fontWeight:800, color:'var(--text1)', marginTop:4 }}>{t}</div>
            <div style={{ width:60, height:4, borderRadius:99, margin:'8px auto 0',
                          background: i===0?'#E8271B':'#0066CC' }}/>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} margin={{top:10,right:30,bottom:10,left:30}}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="dimension" tick={<CustomTick/>} />
          <Radar name={teamA} dataKey={teamA}
            stroke="#E8271B" fill="#E8271B" fillOpacity={0.18} strokeWidth={2.5} dot />
          <Radar name={teamB} dataKey={teamB}
            stroke="#0066CC" fill="#0066CC" fillOpacity={0.18} strokeWidth={2.5} dot />
          <Legend
  formatter={(value) => (
    <span
      style={{
        color: 'var(--text2)',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {value}
    </span>
  )}
/>
        </RadarChart>
      </ResponsiveContainer>

      {/* Dimension scores */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:8, marginTop:8 }}>
        {data.map(d => {
          const winsA = d[teamA] > d[teamB]
          const tie   = d[teamA] === d[teamB]
          return (
            <div key={d.dimension} style={{ textAlign:'center', padding:'8px',
                                             background:'var(--surface3)', borderRadius:10 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>{d.dimension}</div>
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:15, fontWeight:800,
                               color: winsA?'#E8271B':tie?'var(--text3)':'var(--text2)' }}>
                  {d[teamA]}
                </span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>vs</span>
                <span style={{ fontSize:15, fontWeight:800,
                               color: !winsA&&!tie?'#0066CC':tie?'var(--text3)':'var(--text2)' }}>
                  {d[teamB]}
                </span>
              </div>
              {!tie && (
                <div style={{ fontSize:10, marginTop:4,
                              color: winsA?'#E8271B':'#0066CC', fontWeight:700 }}>
                  {winsA?`✓ ${teamA}`:`✓ ${teamB}`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}