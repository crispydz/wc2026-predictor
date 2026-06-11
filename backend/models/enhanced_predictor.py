"""
Enhanced WC 2026 Prediction Engine
Ensemble: MLE-fitted Dixon-Coles + ELO + Squad Quality + Form + Conf. Adjustment
"""
import json, numpy as np
from scipy.stats import poisson
from pathlib import Path

def load_tournament_data():
    with open(DATA_PATH / "wc2026_data.json", encoding="utf-8") as f:
        return json.load(f)

DATA_PATH   = Path(__file__).parent.parent / "data"
PARAMS_PATH = DATA_PATH / "fitted_params.json"

CONF_WEIGHT = {
    "UEFA":     1.000,
    "CONMEBOL": 0.985,
    "AFC":      0.880,
    "CAF":      0.855,
    "CONCACAF": 0.845,
    "OFC":      0.760,
}


def load_all_data():
    with open(DATA_PATH / "wc2026_data.json", encoding="utf-8") as f:
        wc = json.load(f)
    fitted = None
    if PARAMS_PATH.exists():
        with open(PARAMS_PATH) as f:
            fitted = json.load(f)
    squad = None
    sp = DATA_PATH / "squad_ratings.json"
    if sp.exists():
        with open(sp) as f:
            squad = json.load(f)
    return wc, fitted, squad


def dc_correction(x, y, lx, ly, rho):
    if x==0 and y==0: return max(1e-10, 1 - lx*ly*rho)
    if x==1 and y==0: return max(1e-10, 1 + ly*rho)
    if x==0 and y==1: return max(1e-10, 1 + lx*rho)
    if x==1 and y==1: return max(1e-10, 1 - rho)
    return 1.0


def form_multiplier(recent_form, n=10):
    """Exponentially weighted recent form. Range [0.88, 1.12]."""
    if not recent_form:
        return 1.0
    f = recent_form[-n:]
    w = np.exp(np.linspace(0, 1.2, len(f)))
    w /= w.sum()
    score = sum(wi * fi/2 for wi, fi in zip(w, f))
    return 0.88 + score * 0.24


def squad_quality_mult(team, squad_data, baseline=78.0):
    """Squad rating → attack multiplier. Range [0.86, 1.15]."""
    if not squad_data or team not in squad_data:
        return 1.0
    r = squad_data[team].get("avg_rating", baseline)
    return max(0.80, min(1.20, 0.60 + (r / baseline) * 0.40))


def injury_adjusted_attack(team, td, squad_data, injured_players=None):
    """Reduce attack if key player is injured."""
    if not injured_players or not squad_data:
        return 1.0
    impacts = squad_data.get(team, {}).get("key_injury_impact", {})
    total_loss = sum(impacts.get(p, 0) for p in injured_players)
    return max(0.60, 1.0 - total_loss * 0.75)


def get_lambda(team, opponent, td_self, td_opp, fitted, squad, is_home, injured=None):
    """
    Compute expected goals (lambda) for team vs opponent.
    Layers: MLE base × form × squad × injury × ELO blend × home adv × conf
    """
    # Base attack & opponent defense from MLE (or fallback)
    if fitted and team in fitted.get("attack", {}):
        base_att = fitted["attack"][team]
        opp_def  = fitted["defense"].get(opponent, td_opp.get("defense", 1.0))
    else:
        base_att = td_self.get("attack", 1.0)
        opp_def  = td_opp.get("defense", 1.0)

    rho      = fitted["rho"]          if fitted else -0.12
    home_adv = fitted["home_advantage"] if fitted else 1.08

    fm   = form_multiplier(td_self.get("recent_form", []))
    sq   = squad_quality_mult(team, squad)
    inj  = injury_adjusted_attack(team, td_self, squad, injured)
    conf = CONF_WEIGHT.get(td_self.get("confederation", "UEFA"), 0.90)

    # ELO ratio adjustment (soft, 15% weight only)
    elo_ratio = (td_self["elo"] / max(td_opp["elo"], 1)) ** 0.25

    lam = base_att * opp_def * fm * sq * inj * conf * elo_ratio
    if is_home:
        lam *= home_adv

    return max(0.20, min(7.0, lam))


# Pre-compute score grid once at module load (big speedup)
_GOALS = np.arange(10)
_I, _J = np.meshgrid(_GOALS, _GOALS, indexing='ij')

def compute_match_probabilities(team_a, team_b, teams_data,
                                 fitted=None, squad=None,
                                 neutral=True, injured_a=None, injured_b=None):
    a = teams_data[team_a]
    b = teams_data[team_b]
    rho = fitted["rho"] if fitted else -0.12

    lam_a = get_lambda(team_a, team_b, a, b, fitted, squad, is_home=not neutral, injured=injured_a)
    lam_b = get_lambda(team_b, team_a, b, a, fitted, squad, is_home=False, injured=injured_b)

    # Vectorized Poisson matrix (no Python loop)
    from scipy.stats import poisson
    pa = poisson.pmf(_I, lam_a)  # shape (10,10)
    pb = poisson.pmf(_J, lam_b)
    mat = pa * pb

    # Dixon-Coles correction (only affects 4 cells)
    mat[0,0] *= max(1e-10, 1 - lam_a * lam_b * rho)
    mat[1,0] *= max(1e-10, 1 + lam_b * rho)
    mat[0,1] *= max(1e-10, 1 + lam_a * rho)
    mat[1,1] *= max(1e-10, 1 - rho)
    mat = np.clip(mat, 0, None)
    mat /= mat.sum()

    hw = float(np.tril(mat, -1).sum())
    d  = float(np.trace(mat))
    aw = float(np.triu(mat, 1).sum())
    
    # Most likely score CONSISTENT with the most likely outcome
    if hw >= d and hw >= aw:
        zone = np.tril(mat, -1)          # home win zone
    elif aw >= d and aw >= hw:
        zone = np.triu(mat, 1)           # away win zone
    else:
        zone = np.diag(np.diag(mat))     # draw zone

    best = np.unravel_index(zone.argmax(), zone.shape)

    return {
        "team_a": team_a, "team_b": team_b,
        "home_win_prob":     round(hw, 4),
        "draw_prob":         round(d,  4),
        "away_win_prob":     round(aw, 4),
        "expected_goals_a":  round(lam_a, 2),
        "expected_goals_b":  round(lam_b, 2),
        "most_likely_score": f"{best[0]}-{best[1]}",
        "elo_a": a["elo"], "elo_b": b["elo"],
        "fitted_params_used": fitted is not None,
    }

    return {
        "team_a": team_a, "team_b": team_b,
        "home_win_prob":     round(hw, 4),
        "draw_prob":         round(d,  4),
        "away_win_prob":     round(aw, 4),
        "expected_goals_a":  round(lam_a, 2),
        "expected_goals_b":  round(lam_b, 2),
        "most_likely_score": f"{best[0]}-{best[1]}",
        "elo_a": a["elo"], "elo_b": b["elo"],
        "fitted_params_used": fitted is not None,
    }


def run_group_stage_predictions(data, fitted=None, squad=None):
    """Predict all 72 group matches (expected points method)."""
    result = {}
    for gid, gdata in data["groups"].items():
        teams = gdata["teams"]
        exp   = {t: 0.0 for t in teams}
        matches = []
        for i in range(len(teams)):
            for j in range(i+1, len(teams)):
                ta, tb = teams[i], teams[j]
                pred = compute_match_probabilities(ta, tb, data["teams"],
                                                   fitted, squad, neutral=True)
                exp[ta] += pred["home_win_prob"]*3 + pred["draw_prob"]
                exp[tb] += pred["away_win_prob"]*3 + pred["draw_prob"]
                matches.append(pred)
        standing = sorted(teams, key=lambda t: exp[t], reverse=True)
        result[gid] = {
            "teams": teams,
            "matches": matches,
            "predicted_standings": standing,
            "expected_points": {t: round(exp[t],2) for t in teams},
        }
    return result