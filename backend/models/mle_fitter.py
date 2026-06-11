"""
Dixon-Coles Maximum Likelihood Estimation
Fits attack/defense parameters from real historical match data.
Uses time-decay weighting (recent = more important).
"""
import json, numpy as np, pandas as pd
from scipy.optimize import minimize
from scipy.stats import poisson
from pathlib import Path

DATA_PATH   = Path(__file__).parent.parent / "data"
PARAMS_PATH = DATA_PATH / "fitted_params.json"


def load_match_dataframe(min_year=2020):
    """Load matches into a filtered DataFrame."""
    src = DATA_PATH / "matches_collected.json"
    if not src.exists():
        print("  ❌ matches_collected.json not found. Run match_history.py first.")
        return None

    with open(src) as f:
        raw = json.load(f)

    df = pd.DataFrame(raw)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "home_team", "away_team"])
    df = df[df["date"].dt.year >= min_year].copy()
    df["days_ago"] = (pd.Timestamp.now() - df["date"]).dt.days
    df["is_competitive"] = df.get("is_competitive", pd.Series([True]*len(df))).fillna(True)

    # Load WC team list for filtering
    with open(DATA_PATH / "wc2026_data.json", encoding="utf-8") as f:
        wc_data = json.load(f)
    wc_teams = set(wc_data["teams"].keys())

    # Keep matches where at least one team is in WC 2026
    mask = df["home_team"].isin(wc_teams) | df["away_team"].isin(wc_teams)
    df = df[mask].copy()
    print(f"  📄 Loaded {len(df)} matches from {min_year} involving WC 2026 teams")
    return df, wc_teams


def dc_log_likelihood(hg, ag, lam_h, lam_a, rho):
    """Dixon-Coles log-likelihood for one match."""
    if   hg == 0 and ag == 0: corr = max(1e-10, 1 - lam_h * lam_a * rho)
    elif hg == 1 and ag == 0: corr = max(1e-10, 1 + lam_a * rho)
    elif hg == 0 and ag == 1: corr = max(1e-10, 1 + lam_h * rho)
    elif hg == 1 and ag == 1: corr = max(1e-10, 1 - rho)
    else:                      corr = 1.0
    return (np.log(corr)
            + poisson.logpmf(hg, max(lam_h, 1e-10))
            + poisson.logpmf(ag, max(lam_a, 1e-10)))


def fit_dixon_coles(df, wc_teams, time_decay=0.004, competitive_boost=1.8):
    """
    MLE fitting of attack/defense for all WC teams.
    time_decay: 0.004 → matches from 2 years ago get ~5x less weight than today.
    competitive_boost: competitive matches count more than friendlies.
    """
    # Teams present in BOTH the data and WC 2026
    data_teams = set(df["home_team"].tolist() + df["away_team"].tolist())
    # Only fit teams with >= 3 matches in the data
    counts = {}
    for t in data_teams & wc_teams:
        counts[t] = len(df[(df["home_team"]==t)|(df["away_team"]==t)])
    teams = sorted([t for t,c in counts.items() if c >= 3])
    missing = [t for t in wc_teams if t not in teams]
    print(f"  🔧 Fitting {len(teams)} teams (MLE)")
    if missing:
        print(f"  ⚠  Using defaults for: {missing} (insufficient match data)")

    n = len(teams)
    team_idx = {t: i for i, t in enumerate(teams)}

    # Filter to matches where BOTH teams are in our fit set
    fit_df = df[df["home_team"].isin(teams) & df["away_team"].isin(teams)].copy()
    print(f"  📊 {len(fit_df)} matches used for fitting")

    # Compute weights
    fit_df["weight"] = np.exp(-time_decay * fit_df["days_ago"])
    fit_df.loc[fit_df["is_competitive"]==True, "weight"] *= competitive_boost
    fit_df["weight"] /= fit_df["weight"].sum() / len(fit_df)

    # Convert to numpy for speed
    hts  = fit_df["home_team"].values
    ats  = fit_df["away_team"].values
    hgs  = fit_df["home_goals"].values.astype(int)
    ags  = fit_df["away_goals"].values.astype(int)
    wts  = fit_df["weight"].values

    def neg_ll(params):
        log_att = params[:n]
        log_def = params[n:2*n]
        log_hom = params[-2]
        rho     = params[-1]
        att = np.exp(log_att)
        dfs = np.exp(log_def)
        hom = np.exp(log_hom)
        ll  = 0.0
        for k in range(len(hts)):
            hi = team_idx.get(hts[k])
            ai = team_idx.get(ats[k])
            if hi is None or ai is None:
                continue
            lam_h = att[hi] * dfs[ai] * hom
            lam_a = att[ai] * dfs[hi]
            ll   += wts[k] * dc_log_likelihood(hgs[k], ags[k], lam_h, lam_a, rho)
        return -ll

    x0  = np.zeros(2*n + 2)
    x0[-2] = np.log(1.08)
    x0[-1] = -0.10
    bounds = ([(np.log(0.15), np.log(4.0))]*n +
              [(np.log(0.15), np.log(4.0))]*n +
              [(np.log(0.85), np.log(1.40))] +
              [(-0.45, 0.45)])

    print("  ⏳ Running optimizer (L-BFGS-B) — takes 60–180 seconds...")
    res = minimize(neg_ll, x0, method="L-BFGS-B", bounds=bounds,
                   options={"maxiter": 3000, "ftol": 1e-13, "gtol": 1e-9})

    if res.success:
        print(f"  ✅ Converged in {res.nit} iterations  |  Log-likelihood: {-res.fun:.1f}")
    else:
        print(f"  ⚠  Optimizer ended: {res.message}")

    p = res.x
    raw_att = {t: float(np.exp(p[team_idx[t]]))   for t in teams}
    raw_def = {t: float(np.exp(p[n+team_idx[t]])) for t in teams}

    # Normalize so mean attack = 1.0
    mu = np.mean(list(raw_att.values()))
    fitted_att = {t: v/mu for t,v in raw_att.items()}
    fitted_def = {t: v*mu for t,v in raw_def.items()}

    home_adv = float(np.exp(p[-2]))
    rho_fit  = float(p[-1])

    # Load WC data for fallback params
    with open(DATA_PATH / "wc2026_data.json", encoding="utf-8") as f:
        wc_data = json.load(f)

    # Fill missing teams with hardcoded params from wc2026_data.json
    for t in missing:
        td = wc_data["teams"].get(t, {})
        fitted_att[t] = td.get("attack",  1.0)
        fitted_def[t] = td.get("defense", 1.0)

    # Summary
    print(f"\n  📈 Top 5 attacking teams:  " +
          str(sorted(fitted_att.items(), key=lambda x:-x[1])[:5]))
    print(f"  🛡 Top 5 defensive teams:  " +
          str(sorted(fitted_def.items(), key=lambda x: x[1])[:5]))
    print(f"  🏠 Home advantage factor:  {home_adv:.4f} ({(home_adv-1)*100:.1f}%)")
    print(f"  📐 Rho (DC correction):    {rho_fit:.4f}")

    return {
        "attack":           fitted_att,
        "defense":          fitted_def,
        "home_advantage":   home_adv,
        "rho":              rho_fit,
        "n_matches_used":   int(len(fit_df)),
        "n_teams_fitted":   len(teams),
        "teams_with_data":  teams,
        "teams_using_defaults": missing,
        "log_likelihood":   float(-res.fun),
        "converged":        bool(res.success),
    }


def run_fitting(min_year=2020):
    print("\n🔬 DIXON-COLES MLE PARAMETER FITTING")
    print("="*52)
    result = load_match_dataframe(min_year=min_year)
    if result is None:
        return None
    df, wc_teams = result
    params = fit_dixon_coles(df, wc_teams)
    with open(PARAMS_PATH, "w") as f:
        json.dump(params, f, indent=2)
    print(f"\n  💾 Saved → fitted_params.json")
    return params


if __name__ == "__main__":
    run_fitting()