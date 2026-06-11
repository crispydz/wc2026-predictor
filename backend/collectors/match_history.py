"""
Collects historical international match data from:
- Kaggle CSV (primary — 47k+ matches)
- football-data.org API (supplementary — recent tournaments)
"""
import json, requests, time, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
DATA_PATH = Path(__file__).parent.parent / "data"
FD_BASE   = "https://api.football-data.org/v4"

# Kaggle team name → our data file name (fixes mismatches)
TEAM_NAME_MAP = {
    "South Korea":        "South Korea",
    "Korea Republic":     "South Korea",
    "United States":      "USA",
    "United Arab Emirates": None,  # not in WC 2026
    "IR Iran":            "Iran",
    "Bosnia and Herzegovina": "Bosnia-Herzegovina",
    "Côte d'Ivoire":      "Ivory Coast",
    "Ivory Coast":        "Ivory Coast",
    "DR Congo":           "Congo DR",
    "Democratic Republic of Congo": "Congo DR",
    "Türkiye":            "Türkiye",
    "Turkey":             "Türkiye",
    "Czech Republic":     "Czechia",
    "Cape Verde":         "Cabo Verde",
    "Cape Verde Islands": "Cabo Verde",
    "England":            "England",
    "Scotland":           "Scotland",
}


def normalize_team(name):
    """Map team names from various sources to our standard names."""
    return TEAM_NAME_MAP.get(name, name)


def load_from_kaggle():
    """Load from results.csv (place at backend/data/results.csv)."""
    csv_path = DATA_PATH / "results.csv"
    if not csv_path.exists():
        print("  ⚠ results.csv not found at backend/data/results.csv")
        print("  → Download from: https://www.kaggle.com/datasets/martj42/international-football-results-from-1872-to-2017")
        return []

    import pandas as pd
    df = pd.read_csv(csv_path)
    # Only use matches from 2018 onwards (more relevant for current teams)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df[df["date"].dt.year >= 2018].copy()

    # Only competitive matches + recent friendlies
    competitive = ["World Cup","qualifier","Qualifier","UEFA Nations",
                   "Copa América","Africa Cup","Asian Cup","Gold Cup","CONCACAF"]
    df["is_competitive"] = df["tournament"].apply(
        lambda t: any(k in str(t) for k in competitive)
    )
    # Keep all competitive + friendlies since 2022
    df = df[(df["is_competitive"]) | (df["date"].dt.year >= 2022)].copy()

    matches = []
    for _, row in df.iterrows():
        ht = normalize_team(str(row.get("home_team","")))
        at = normalize_team(str(row.get("away_team","")))
        if ht is None or at is None:
            continue
        try:
            matches.append({
                "date":       str(row["date"])[:10],
                "home_team":  ht,
                "away_team":  at,
                "home_goals": int(row["home_score"]),
                "away_goals": int(row["away_score"]),
                "tournament": str(row.get("tournament","")),
                "neutral":    bool(row.get("neutral", False)),
                "is_competitive": bool(row["is_competitive"]),
                "source":     "kaggle",
            })
        except:
            continue

    print(f"  ✅ Loaded {len(matches)} matches from Kaggle CSV (2018–present, competitive+)")
    return matches


def fetch_fd_competition(comp_code, season, api_key):
    """Fetch competition matches from football-data.org."""
    headers = {"X-Auth-Token": api_key}
    url = f"{FD_BASE}/competitions/{comp_code}/matches?season={season}&status=FINISHED"
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            return r.json().get("matches", [])
        elif r.status_code == 429:
            print("    Rate limited, waiting 65s...")
            time.sleep(65)
            return fetch_fd_competition(comp_code, season, api_key)
        else:
            print(f"    API error {r.status_code}")
    except Exception as e:
        print(f"    Request error: {e}")
    return []


def parse_fd_match(m):
    """Parse football-data.org match into our format."""
    ft = m.get("score", {}).get("fullTime", {})
    hg, ag = ft.get("home"), ft.get("away")
    if hg is None or ag is None:
        return None
    ht = normalize_team(m.get("homeTeam", {}).get("name", ""))
    at = normalize_team(m.get("awayTeam", {}).get("name", ""))
    if ht is None or at is None:
        return None
    comp = m.get("competition", {}).get("name", "")
    competitive_kw = ["World Cup","Euro","Copa","Nations","Qualifier","AFCON","Asian"]
    return {
        "date":         m.get("utcDate", "")[:10],
        "home_team":    ht,
        "away_team":    at,
        "home_goals":   int(hg),
        "away_goals":   int(ag),
        "tournament":   comp,
        "neutral":      False,
        "is_competitive": any(k in comp for k in competitive_kw),
        "source":       "football-data.org",
    }


def collect_from_api(api_key):
    """Collect from football-data.org free tier."""
    competitions = [
        ("WC",  [2022, 2018]),   # World Cup
        ("EC",  [2024, 2020]),   # Euros
        ("CLI", [2024, 2023]),   # Nations League (not available on free, skip)
    ]
    matches = []
    for comp, seasons in competitions:
        for season in seasons:
            print(f"    {comp} {season}...")
            ms = fetch_fd_competition(comp, season, api_key)
            for m in ms:
                parsed = parse_fd_match(m)
                if parsed:
                    matches.append(parsed)
            time.sleep(7)  # Free tier: 10 req/min
    print(f"  ✅ Collected {len(matches)} matches from football-data.org API")
    return matches


def collect_all():
    """Collect from all sources, deduplicate, save."""
    print("\n📡 COLLECTING HISTORICAL MATCH DATA")
    print("="*52)

    all_matches = []

    # Source 1: Kaggle
    print("\n[1/2] Loading Kaggle CSV...")
    all_matches.extend(load_from_kaggle())

    # Source 2: football-data.org API
    api_key = os.getenv("FOOTBALL_DATA_API_KEY", "")
    if api_key and api_key != "YOUR_FREE_KEY_HERE":
        print("\n[2/2] Fetching from football-data.org API...")
        api_matches = collect_from_api(api_key)
        all_matches.extend(api_matches)
    else:
        print("\n[2/2] Skipping API (no key in .env)")

    if not all_matches:
        print("\n❌ No match data collected.")
        return []

    # Deduplicate on date+teams
    seen, unique = set(), []
    for m in all_matches:
        k = f"{m['date']}_{m['home_team']}_{m['away_team']}"
        if k not in seen:
            seen.add(k)
            unique.append(m)

    # Filter out matches with invalid goals
    unique = [m for m in unique if isinstance(m["home_goals"], int)
              and isinstance(m["away_goals"], int)
              and 0 <= m["home_goals"] <= 20
              and 0 <= m["away_goals"] <= 20]

    print(f"\n  📊 Total unique valid matches: {len(unique)}")
    out = DATA_PATH / "matches_collected.json"
    with open(out, "w") as f:
        json.dump(unique, f, indent=2)
    print(f"  💾 Saved to matches_collected.json")
    return unique


if __name__ == "__main__":
    collect_all()