"""
WC 2026 Prediction Engine
Ensemble: Dixon-Coles Poisson + ELO ratings + Recent form
"""
import json
import numpy as np
from scipy.stats import poisson
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "data" / "wc2026_data.json"


def load_tournament_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def dc_correction(x, y, lx, ly, rho=-0.12):
    """Dixon-Coles low-score correction (fixes Poisson underestimation of 0-0, 1-0...)"""
    if x == 0 and y == 0:
        return 1 - lx * ly * rho
    elif x == 1 and y == 0:
        return 1 + ly * rho
    elif x == 0 and y == 1:
        return 1 + lx * rho
    elif x == 1 and y == 1:
        return 1 - rho
    return 1.0


def form_multiplier(recent_form):
    """Convert last 10 results (0=L,1=D,2=W) into a strength multiplier [0.85, 1.15]."""
    if not recent_form:
        return 1.0
    weights = [0.05, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.12, 0.13]
    w = weights[:len(recent_form)]
    w = [x / sum(w) for x in w]
    score = sum(wi * (f / 2.0) for wi, f in zip(w, recent_form))
    return 0.85 + score * 0.30


def elo_factor(elo_a, elo_b, k=400):
    """ELO expected score → strength multiplier."""
    expected = 1 / (1 + 10 ** ((elo_b - elo_a) / k))
    return max(0.5, min(2.0, expected / 0.5))


def compute_match_probabilities(team_a, team_b, teams_data, neutral=True):
    """
    Compute win/draw/loss probs using Dixon-Coles Poisson model.
    Returns dict with all probabilities and expected goals.
    """
    a = teams_data[team_a]
    b = teams_data[team_b]

    fa = form_multiplier(a["recent_form"]) * a.get("injury_factor", 1.0)
    fb = form_multiplier(b["recent_form"]) * b.get("injury_factor", 1.0)
    ef = elo_factor(a["elo"], b["elo"])
    home_adv = 1.0 if neutral else 1.12

    lambda_a = max(0.3, min(5.0, a["attack"] * b["defense"] * home_adv * ef * fa))
    lambda_b = max(0.3, min(5.0, b["attack"] * a["defense"] * (1 / ef) * fb))

    max_g = 9
    prob_matrix = np.zeros((max_g, max_g))
    for i in range(max_g):
        for j in range(max_g):
            p = poisson.pmf(i, lambda_a) * poisson.pmf(j, lambda_b)
            prob_matrix[i, j] = p * dc_correction(i, j, lambda_a, lambda_b)
    prob_matrix /= prob_matrix.sum()

    hw = float(np.tril(prob_matrix, -1).sum())
    d  = float(np.trace(prob_matrix))
    aw = float(np.triu(prob_matrix, 1).sum())
    best_score = np.unravel_index(prob_matrix.argmax(), prob_matrix.shape)

    return {
        "team_a": team_a, "team_b": team_b,
        "home_win_prob": round(hw, 4),
        "draw_prob":     round(d,  4),
        "away_win_prob": round(aw, 4),
        "expected_goals_a": round(lambda_a, 2),
        "expected_goals_b": round(lambda_b, 2),
        "most_likely_score": f"{best_score[0]}-{best_score[1]}",
        "elo_a": a["elo"], "elo_b": b["elo"],
    }


def run_group_stage_predictions(data=None):
    if data is None:
        data = load_tournament_data()
    result = {}
    for gid, gdata in data["groups"].items():
        teams = gdata["teams"]
        exp_pts = {t: 0.0 for t in teams}
        matches = []
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                ta, tb = teams[i], teams[j]
                pred = compute_match_probabilities(ta, tb, data["teams"])
                exp_pts[ta] += pred["home_win_prob"] * 3 + pred["draw_prob"]
                exp_pts[tb] += pred["away_win_prob"] * 3 + pred["draw_prob"]
                matches.append(pred)
        standing = sorted(teams, key=lambda t: exp_pts[t], reverse=True)
        result[gid] = {
            "teams": teams,
            "matches": matches,
            "predicted_standings": standing,
            "expected_points": {t: round(exp_pts[t], 2) for t in teams},
        }
    return result


if __name__ == "__main__":
    data = load_tournament_data()
    res = compute_match_probabilities("France", "Argentina", data["teams"])
    import json; print(json.dumps(res, indent=2))