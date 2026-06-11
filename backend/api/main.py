"""FastAPI backend — WC 2026 Prediction API."""
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent))
from models.enhanced_predictor import load_tournament_data, compute_match_probabilities, run_group_stage_predictions
from models.simulator import run_simulation

app = FastAPI(title="WC 2026 Predictor API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

data = load_tournament_data()
_cache_groups = None
_cache_sim = None


class MatchReq(BaseModel):
    team_a: str
    team_b: str
    neutral: bool = True

class SimReq(BaseModel):
    n_simulations: int = 50000


@app.get("/")
def root():
    return {"status": "ok", "teams": len(data["teams"]), "groups": len(data["groups"])}

@app.get("/teams")
def get_teams():
    teams = []
    for name, td in data["teams"].items():
        group = next((g for g, gd in data["groups"].items() if name in gd["teams"]), None)
        teams.append({"name": name, "group": group, **td})
    return {"teams": sorted(teams, key=lambda x: x["elo"], reverse=True)}

@app.get("/teams/{name}")
def get_team(name: str):
    match = next((k for k in data["teams"] if k.lower() == name.lower()), None)
    if not match:
        raise HTTPException(404, f"Team '{name}' not found")
    group = next((g for g, gd in data["groups"].items() if match in gd["teams"]), None)
    return {"name": match, "group": group, **data["teams"][match]}

@app.get("/groups")
def get_groups():
    return {gid: {"teams": [{
        "name": t, "flag": data["teams"][t]["flag"],
        "elo": data["teams"][t]["elo"], "fifa_rank": data["teams"][t]["fifa_rank"]
    } for t in gd["teams"]]} for gid, gd in data["groups"].items()}

@app.post("/predict/match")
def predict_match(req: MatchReq):
    for t in [req.team_a, req.team_b]:
        if t not in data["teams"]:
            raise HTTPException(404, f"Team '{t}' not found")
    return compute_match_probabilities(req.team_a, req.team_b, data["teams"], req.neutral)

@app.get("/predict/groups")
def predict_groups():
    global _cache_groups
    if _cache_groups is None:
        _cache_groups = run_group_stage_predictions(data)
    return _cache_groups

@app.post("/predict/simulate")
def simulate(req: SimReq):
    global _cache_sim
    _cache_sim = run_simulation(min(req.n_simulations, 100000), data)
    return {"n_simulations": req.n_simulations, "probabilities": _cache_sim}

@app.get("/predict/champion")
def champion(top: int = Query(20)):
    if _cache_sim is None:
        # Fast ELO estimate
        total = sum(td["elo"] for td in data["teams"].values())
        probs = {t: {"win_tournament": round(td["elo"]/total, 4)} for t, td in data["teams"].items()}
    else:
        probs = _cache_sim
    sorted_p = sorted([{"team":t,"flag":data["teams"][t]["flag"],"elo":data["teams"][t]["elo"],**p}
                        for t, p in probs.items()], key=lambda x: x["win_tournament"], reverse=True)
    return {"champion_probabilities": sorted_p[:top]}

@app.get("/predict/h2h")
def h2h(team_a: str, team_b: str):
    for t in [team_a, team_b]:
        if t not in data["teams"]:
            raise HTTPException(404, f"Team '{t}' not found")
    return {
        "team_a": {"name": team_a, **data["teams"][team_a]},
        "team_b": {"name": team_b, **data["teams"][team_b]},
        "prediction": compute_match_probabilities(team_a, team_b, data["teams"]),
    }