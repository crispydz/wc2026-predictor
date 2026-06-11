export const TOURNAMENT = {
  name: "FIFA World Cup 2026",
  hosts: ["USA", "Canada", "Mexico"],
  dates: { start: "Jun 11, 2026", final: "Jul 19, 2026" },
  totalMatches: 104,
};

export const GROUPS = {
  A: { teams: ["Mexico","South Africa","South Korea","Czechia"] },
  B: { teams: ["Canada","Switzerland","Qatar","Bosnia-Herzegovina"] },
  C: { teams: ["Brazil","Morocco","Haiti","Scotland"] },
  D: { teams: ["USA","Paraguay","Australia","Türkiye"] },
  E: { teams: ["Germany","Curaçao","Ivory Coast","Ecuador"] },
  F: { teams: ["Netherlands","Japan","Tunisia","Sweden"] },
  G: { teams: ["Belgium","Egypt","Iran","New Zealand"] },
  H: { teams: ["Spain","Cabo Verde","Saudi Arabia","Uruguay"] },
  I: { teams: ["France","Senegal","Norway","Iraq"] },
  J: { teams: ["Argentina","Algeria","Austria","Jordan"] },
  K: { teams: ["Portugal","Uzbekistan","Colombia","Congo DR"] },
  L: { teams: ["England","Croatia","Ghana","Panama"] },
};

export const TEAM_FLAGS = {
  Argentina:"🇦🇷", France:"🇫🇷", Brazil:"🇧🇷", England:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", Spain:"🇪🇸",
  Portugal:"🇵🇹", Germany:"🇩🇪", Belgium:"🇧🇪", Netherlands:"🇳🇱", Uruguay:"🇺🇾",
  Colombia:"🇨🇴", Morocco:"🇲🇦", Senegal:"🇸🇳", Japan:"🇯🇵", Switzerland:"🇨🇭",
  Croatia:"🇭🇷", Mexico:"🇲🇽", Norway:"🇳🇴", USA:"🇺🇸", "South Korea":"🇰🇷",
  Austria:"🇦🇹", Ecuador:"🇪🇨", Sweden:"🇸🇪", "Ivory Coast":"🇨🇮", Canada:"🇨🇦",
  Australia:"🇦🇺", Türkiye:"🇹🇷", Algeria:"🇩🇿", Tunisia:"🇹🇳", Egypt:"🇪🇬",
  Iran:"🇮🇷", Ghana:"🇬🇭", Czechia:"🇨🇿", Scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Congo DR":"🇨🇩",
  Paraguay:"🇵🇾", "Bosnia-Herzegovina":"🇧🇦", "Saudi Arabia":"🇸🇦", Uzbekistan:"🇺🇿",
  Qatar:"🇶🇦", Iraq:"🇮🇶", "South Africa":"🇿🇦", Jordan:"🇯🇴", "Cabo Verde":"🇨🇻",
  Panama:"🇵🇦", "New Zealand":"🇳🇿", Haiti:"🇭🇹", "Curaçao":"🇨🇼",
};

export const getFlag = (name) => TEAM_FLAGS[name] || "🏳";
export const getGroupForTeam = (name) =>
  Object.entries(GROUPS).find(([,g]) => g.teams.includes(name))?.[0] || null;