"""Fetch ELO ratings from ClubElo.com (free, no API key needed)."""
import requests, json, time
from pathlib import Path

CLUBELO_BASE = "http://api.clubelo.com"
DATA_PATH = Path(__file__).parent.parent / "data" / "wc2026_data.json"

SLUG_MAP = {
    "Argentina":"Argentina","France":"France","Brazil":"Brazil","England":"England",
    "Spain":"Spain","Portugal":"Portugal","Germany":"Germany","Belgium":"Belgium",
    "Netherlands":"Netherlands","Uruguay":"Uruguay","Colombia":"Colombia",
    "Morocco":"Morocco","Senegal":"Senegal","Japan":"Japan","Switzerland":"Switzerland",
    "Croatia":"Croatia","Mexico":"Mexico","Norway":"Norway","USA":"USA",
    "South Korea":"SouthKorea","Austria":"Austria","Ecuador":"Ecuador","Sweden":"Sweden",
    "Ivory Coast":"IvoryCoast","Canada":"Canada","Australia":"Australia",
    "Türkiye":"Turkey","Algeria":"Algeria","Tunisia":"Tunisia","Egypt":"Egypt",
    "Iran":"Iran","Ghana":"Ghana","Czechia":"CzechRepublic","Scotland":"Scotland",
}


def fetch_elo(team_name):
    slug = SLUG_MAP.get(team_name)
    if not slug:
        return None
    try:
        r = requests.get(f"{CLUBELO_BASE}/{slug}", timeout=10)
        if r.status_code == 200:
            lines = r.text.strip().split("\n")
            if len(lines) > 1:
                return float(lines[-1].split(",")[4])
    except:
        pass
    return None


def update_elos():
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    updated = 0
    for team in data["teams"]:
        elo = fetch_elo(team)
        if elo:
            old = data["teams"][team]["elo"]
            data["teams"][team]["elo"] = round(elo, 1)
            if abs(elo - old) > 5:
                print(f"  {team}: {old} → {elo:.0f}")
                updated += 1
        time.sleep(0.3)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✅ {updated} ELOs updated.")
    return data


if __name__ == "__main__":
    update_elos()