import random
import numpy as np
from collections import defaultdict
from .enhanced_predictor import load_tournament_data, compute_match_probabilities

# R32: 12 winners vs 12 runners-up (fixed slots)
R32_FIXED = [
    ("1A","2C"), ("1B","2A"), ("1C","2B"), ("1D","2F"),
    ("1E","2D"), ("1F","2E"), ("1G","2I"), ("1H","2G"),
    ("1I","2H"), ("1J","2L"), ("1K","2J"), ("1L","2K"),
]


def sim_match_fast(ta, tb, teams_data, allow_draw=True):
    """Fast Poisson simulation using vectorized numpy."""
    from scipy.stats import poisson
    goals = np.arange(10)
    I, J = np.meshgrid(goals, goals, indexing='ij')
    
    att_a = teams_data[ta].get("attack", 1.0)
    def_b = teams_data[tb].get("defense", 1.0)
    att_b = teams_data[tb].get("attack", 1.0)
    def_a = teams_data[ta].get("defense", 1.0)
    elo_a = teams_data[ta]["elo"]
    elo_b = teams_data[tb]["elo"]
    elo_adj = 1 / (1 + 10**((elo_b - elo_a)/400))

    lam_a = max(0.25, att_a * def_b * (0.6 + elo_adj * 0.8))
    lam_b = max(0.25, att_b * def_a * (0.6 + (1-elo_adj) * 0.8))

    pa = poisson.pmf(I, lam_a)
    pb = poisson.pmf(J, lam_b)
    mat = pa * pb
    rho = -0.12
    mat[0,0] *= max(1e-10, 1 - lam_a*lam_b*rho)
    mat[1,0] *= max(1e-10, 1 + lam_b*rho)
    mat[0,1] *= max(1e-10, 1 + lam_a*rho)
    mat[1,1] *= max(1e-10, 1 - rho)
    mat = np.clip(mat, 0, None)
    mat /= mat.sum()

    hw = float(np.tril(mat,-1).sum())
    d  = float(np.trace(mat))
    aw = float(np.triu(mat, 1).sum())

    r = random.random()
    if allow_draw:
        ga = int(np.random.poisson(lam_a))
        gb = int(np.random.poisson(lam_b))
        return (ta if ga>gb else (tb if gb>ga else "draw")), ga, gb
    else:
        adj_a = hw + d*0.48
        return ta if r < adj_a else tb


def sim_group_stage(groups_data, teams_data):
    standings = {}
    for gid, gdata in groups_data.items():
        teams = gdata["teams"]
        s = {t: {"pts":0,"gf":0,"ga":0,"gd":0} for t in teams}
        for i in range(len(teams)):
            for j in range(i+1, len(teams)):
                ta, tb = teams[i], teams[j]
                result, ga, gb = sim_match_fast(ta, tb, teams_data, allow_draw=True)
                s[ta]["gf"] += ga; s[ta]["ga"] += gb
                s[tb]["gf"] += gb; s[tb]["ga"] += ga
                if result == ta:    s[ta]["pts"] += 3
                elif result == "draw": s[ta]["pts"] += 1; s[tb]["pts"] += 1
                else:               s[tb]["pts"] += 3
                s[ta]["gd"] = s[ta]["gf"] - s[ta]["ga"]
                s[tb]["gd"] = s[tb]["gf"] - s[tb]["ga"]
        ranked = sorted(teams, key=lambda t: (
            s[t]["pts"], s[t]["gd"], s[t]["gf"], teams_data[t]["elo"]
        ), reverse=True)
        standings[gid] = {"ranked": ranked, "stats": s}
    return standings


def get_best_thirds(standings, teams_data):
    thirds = []
    for gid, data in standings.items():
        t = data["ranked"][2]
        s = data["stats"][t]
        thirds.append({"team":t,"pts":s["pts"],"gd":s["gd"],"gf":s["gf"],"elo":teams_data[t]["elo"]})
    thirds.sort(key=lambda x:(x["pts"],x["gd"],x["gf"],x["elo"]), reverse=True)
    return [x["team"] for x in thirds[:8]]


def build_r32(standings, thirds, teams_data):
    """
    Build exactly 32-team bracket:
    - 12 R32_FIXED matchups (24 teams: all 12 winners + all 12 runners-up)
    - 4 matchups from 8 best thirds (paired by rank)
    Total: 16 matchups = 32 teams
    """
    pos = {}
    for gid, data in standings.items():
        pos[f"1{gid}"] = data["ranked"][0]
        pos[f"2{gid}"] = data["ranked"][1]

    pairs = []
    # 12 fixed matchups
    for pa, pb in R32_FIXED:
        ta = pos.get(pa)
        tb = pos.get(pb)
        if ta and tb:
            pairs.append((ta, tb))

    # 4 matchups from 8 best thirds
    t_list = list(thirds[:8])
    for i in range(0, len(t_list)-1, 2):
        pairs.append((t_list[i], t_list[i+1]))

    # Ensure exactly 16 pairs
    while len(pairs) < 16:
        pairs.append(pairs[-1])

    bracket = []
    for ta, tb in pairs[:16]:
        bracket.extend([ta, tb])
    return bracket  # exactly 32 teams


def sim_knockout(bracket, teams_data):
    """Simulate knockout: R32→R16→QF→SF→Final. Always processes pairs."""
    current = list(bracket)
    results = {"R32":[],"R16":[],"QF":[],"SF":[],"Final":[],"Winner":None}
    for rname in ["R32","R16","QF","SF","Final"]:
        nxt = []
        for i in range(0, len(current)-1, 2):
            ta, tb = current[i], current[i+1]
            w = sim_match_fast(ta, tb, teams_data, allow_draw=False)
            if isinstance(w, tuple): w = w[0]
            results[rname].append({"match":f"{ta} vs {tb}","winner":w})
            nxt.append(w)
        current = nxt
        if len(current) <= 1:
            break
    results["Winner"] = current[0] if current else None
    return results


def run_simulation(n_simulations=50000, data=None, predict_fn=None):
    if data is None:
        data = load_tournament_data()
    teams_data  = data["teams"]
    groups_data = data["groups"]
    counters = {k: defaultdict(int) for k in ["r32","r16","qf","sf","final","winner"]}
    stage_map = {"R32":"r32","R16":"r16","QF":"qf","SF":"sf","Final":"final"}

    print(f"🎲 Running {n_simulations:,} simulations...")
    for i in range(n_simulations):
        if i % 5000 == 0 and i > 0:
            print(f"   {i:,}/{n_simulations:,}")
        standings = sim_group_stage(groups_data, teams_data)
        thirds    = get_best_thirds(standings, teams_data)
        bracket   = build_r32(standings, thirds, teams_data)
        for t in bracket:
            counters["r32"][t] += 1
        ko = sim_knockout(bracket, teams_data)
        for stage, key in stage_map.items():
            for m in ko.get(stage, []):
                if m.get("winner"):
                    counters[key][m["winner"]] += 1
        if ko["Winner"]:
            counters["winner"][ko["Winner"]] += 1

    return {
        t: {
            "qualify_r32":    round(counters["r32"].get(t,0)    / n_simulations, 4),
            "qualify_r16":    round(counters["r16"].get(t,0)    / n_simulations, 4),
            "qualify_qf":     round(counters["qf"].get(t,0)     / n_simulations, 4),
            "qualify_sf":     round(counters["sf"].get(t,0)     / n_simulations, 4),
            "qualify_final":  round(counters["final"].get(t,0)  / n_simulations, 4),
            "win_tournament": round(counters["winner"].get(t,0) / n_simulations, 4),
        }
        for t in teams_data
    }