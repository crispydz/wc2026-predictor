"""
WC 2026 Live Results Auto-Updater
Fetche les vrais résultats de la Coupe du Monde 2026 et met à jour :
- ELO de chaque équipe
- Forme récente (recent_form)
- Paramètres attaque/défense

Usage:
  python -m collectors.wc2026_live           # Utilise résultats connus + API
  python -m collectors.wc2026_live --api-only # API seulement
  python -m collectors.wc2026_live --known    # Résultats hardcodés seulement
"""
import json, requests, time, os, sys, argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
DATA_PATH = Path(__file__).parent.parent / "data"
API_KEY   = os.getenv("FOOTBALL_DATA_API_KEY", "")

# ── Résultats WC 2026 connus (mis à jour manuellement) ────────────────────
# Format: {h, a, hg, ag, date, stage}
# stage: "GROUP" | "R32" | "R16" | "QF" | "SF" | "FINAL"
KNOWN_RESULTS = [
    # ════════════════════════════════════════════════════
    # MATCHDAY 1
    # ════════════════════════════════════════════════════

    # Groupe A — 11 juin
    {"h":"Mexico",        "a":"South Africa",       "hg":2,"ag":0,"date":"2026-06-11","stage":"GROUP"},
    {"h":"South Korea",   "a":"Czechia",             "hg":2,"ag":1,"date":"2026-06-11","stage":"GROUP"},

    # Groupe B — 12 juin
    {"h":"Canada",        "a":"Bosnia-Herzegovina",  "hg":1,"ag":1,"date":"2026-06-12","stage":"GROUP"},
    {"h":"Switzerland",   "a":"Qatar",               "hg":1,"ag":1,"date":"2026-06-13","stage":"GROUP"},

    # Groupe C — 13 juin
    {"h":"Brazil",        "a":"Morocco",             "hg":1,"ag":1,"date":"2026-06-13","stage":"GROUP"},
    {"h":"Scotland",      "a":"Haiti",               "hg":1,"ag":0,"date":"2026-06-13","stage":"GROUP"},

    # Groupe D — 12-13 juin
    {"h":"USA",           "a":"Paraguay",            "hg":4,"ag":1,"date":"2026-06-12","stage":"GROUP"},  # ✅ corrigé 4-1
    {"h":"Australia",     "a":"Türkiye",             "hg":2,"ag":0,"date":"2026-06-13","stage":"GROUP"},

    # Groupe E — 14 juin
    {"h":"Germany",       "a":"Curaçao",             "hg":7,"ag":1,"date":"2026-06-14","stage":"GROUP"},
    {"h":"Ivory Coast",   "a":"Ecuador",             "hg":1,"ag":0,"date":"2026-06-14","stage":"GROUP"},

    # Groupe F — 14 juin
    {"h":"Netherlands",   "a":"Japan",               "hg":2,"ag":2,"date":"2026-06-14","stage":"GROUP"},
    {"h":"Sweden",        "a":"Tunisia",             "hg":5,"ag":1,"date":"2026-06-14","stage":"GROUP"},

    # Groupe G — 15 juin
    {"h":"Belgium",       "a":"Egypt",               "hg":1,"ag":1,"date":"2026-06-15","stage":"GROUP"},
    {"h":"Iran",          "a":"New Zealand",         "hg":2,"ag":2,"date":"2026-06-15","stage":"GROUP"},

    # Groupe H — 15 juin
    {"h":"Spain",         "a":"Cabo Verde",          "hg":0,"ag":0,"date":"2026-06-15","stage":"GROUP"},
    {"h":"Saudi Arabia",  "a":"Uruguay",             "hg":1,"ag":1,"date":"2026-06-15","stage":"GROUP"},

    # Groupe I — 16 juin
    {"h":"France",        "a":"Senegal",             "hg":3,"ag":1,"date":"2026-06-16","stage":"GROUP"},
    {"h":"Norway",        "a":"Iraq",                "hg":4,"ag":1,"date":"2026-06-16","stage":"GROUP"},

    # Groupe J — 16 juin
    {"h":"Argentina",     "a":"Algeria",             "hg":3,"ag":0,"date":"2026-06-16","stage":"GROUP"},  # Messi hat-trick
    {"h":"Austria",     "a":"Jordan",                "hg":3,"ag":1,"date":"2026-06-16","stage":"GROUP"},
  
    # Groupe K — 17 juin
    {"h":"Portugal",      "a":"Congo DR",            "hg":1,"ag":1,"date":"2026-06-17","stage":"GROUP"},
    {"h":"Uzbekistan",    "a":"Colombia",            "hg":1,"ag":3,"date":"2026-06-17","stage":"GROUP"},

    # Groupe L — 17 juin
    {"h":"England",       "a":"Croatia",             "hg":4,"ag":2,"date":"2026-06-17","stage":"GROUP"},
    {"h":"Ghana",         "a":"Panama",              "hg":1,"ag":0,"date":"2026-06-17","stage":"GROUP"},

    # ════════════════════════════════════════════════════
    # MATCHDAY 2
    # ═════════════════════════════════════════════════╗  

    # Groupe A — 18 juin
    {"h":"Mexico",       "a":"Czechia",             "hg":1,"ag":1,"date":"2026-06-18","stage":"GROUP"},
    {"h":"South Africa", "a":"South Korea",         "hg":0,"ag":2,"date":"2026-06-18","stage":"GROUP"},

    # Groupe B — 18 juin
    {"h":"Switzerland",   "a":"Bosnia-Herzegovina",  "hg":4,"ag":1,"date":"2026-06-18","stage":"GROUP"},
    {"h":"Canada",        "a":"Qatar",               "hg":6,"ag":0,"date":"2026-06-18","stage":"GROUP"},

    # Groupe C — 19 juin
    {"h":"Scotland",      "a":"Morocco",             "hg":0,"ag":1,"date":"2026-06-19","stage":"GROUP"},
    {"h":"Brazil",        "a":"Haiti",               "hg":3,"ag":0,"date":"2026-06-19","stage":"GROUP"},

    # Groupe D — 19 juin
    {"h":"USA",           "a":"Australia",           "hg":2,"ag":0,"date":"2026-06-19","stage":"GROUP"},
    {"h":"Türkiye",       "a":"Paraguay",            "hg":0,"ag":1,"date":"2026-06-19","stage":"GROUP"},

    # Groupe E — 20-21 juin
    {"h":"Germany",       "a":"Ivory Coast",         "hg":2,"ag":1,"date":"2026-06-20","stage":"GROUP"},
    {"h":"Ecuador",       "a":"Curacao",             "hg":0,"ag":0,"date":"2026-06-20","stage":"GROUP"},

    # Groupe F — 20 juin
    {"h":"Netherlands",   "a":"Sweden",             "hg":5,"ag":1,"date":"2026-06-20","stage":"GROUP"},
    {"h":"Japan",         "a":"Tunisia",            "hg":4,"ag":0,"date":"2026-06-20","stage":"GROUP"},

    # Groupe G — 21 juin
    {"h":"Belgium",       "a":"Iran",               "hg":0,"ag":0,"date":"2026-06-21","stage":"GROUP"},
    {"h":"New Zealand",   "a":"Egypt",              "hg":1,"ag":3,"date":"2026-06-21","stage":"GROUP"},

    # Groupe H — 21 juin
    {"h":"Spain",         "a":"Saudi Arabia",       "hg":4,"ag":0,"date":"2026-06-21","stage":"GROUP"},
    {"h":"Uruguay",       "a":"Cabo Verde",         "hg":2,"ag":2,"date":"2026-06-21","stage":"GROUP"},

    # Groupe I — 22 juin
    {"h":"France",        "a":"Iraq",              "hg":3,"ag":0,"date":"2026-06-22","stage":"GROUP"},
    {"h":"Norway",        "a":"Senegal",           "hg":3,"ag":2,"date":"2026-06-22","stage":"GROUP"},

    # Groupe J — 22 juin
    {"h":"Argentina",     "a":"Austria",           "hg":3,"ag":0,"date":"2026-06-22","stage":"GROUP"},
    {"h":"Jordan",        "a":"Algeria",           "hg":3,"ag":2,"date":"2026-06-22","stage":"GROUP"},










 

    # ════════════════════════════════════════════════════
    # AJOUTER ICI les prochains résultats au fur et à mesure
    # Format : {"h":"Equipe1","a":"Equipe2","hg":X,"ag":Y,"date":"YYYY-MM-DD","stage":"GROUP"},
    # ════════════════════════════════════════════════════
]

# Correspondance noms API → nos noms
NAME_MAP = {
    "United States":              "USA",
    "Korea Republic":             "South Korea",
    "South Korea":                "South Korea",
    "Bosnia and Herzegovina":     "Bosnia-Herzegovina",
    "Côte d'Ivoire":              "Ivory Coast",
    "DR Congo":                   "Congo DR",
    "Democratic Republic of Congo":"Congo DR",
    "Turkey":                     "Türkiye",
    "Türkiye":                    "Türkiye",
    "Czech Republic":             "Czechia",
    "Cape Verde":                 "Cabo Verde",
    "Iran":                       "Iran",
    "IR Iran":                    "Iran",
    "Saudi Arabia":               "Saudi Arabia",
    "New Zealand":                "New Zealand",
}

def normalize(name):
    return NAME_MAP.get(name, name)


def elo_update(elo_h, elo_a, hg, ag, K=20):
    """Mise à jour ELO basée sur le résultat."""
    expected_h = 1 / (1 + 10**((elo_a - elo_h) / 400))
    score_h    = 1.0 if hg > ag else (0.5 if hg == ag else 0.0)
    gd_mult    = 1.0 + (0.5 if abs(hg - ag) > 1 else 0) + (0.25 if abs(hg - ag) > 3 else 0)
    delta_h    = K * gd_mult * (score_h - expected_h)
    return round(elo_h + delta_h, 1), round(elo_a - delta_h, 1)


def form_result(hg, ag):
    """Retourne 2=victoire, 1=nul, 0=défaite pour l'équipe à domicile."""
    return 2 if hg > ag else (1 if hg == ag else 0)


def update_attack_defense(team_data, scored, conceded, alpha=0.05):
    """
    Mise à jour légère des paramètres attaque/défense basée sur la performance réelle.
    alpha: taux d'apprentissage (5% = influence légère)
    """
    expected_scored    = team_data.get("avg_goals_scored", 1.3)
    expected_conceded  = team_data.get("avg_goals_conceded", 1.0)

    # Ratio réel vs attendu
    ratio_att = scored    / max(expected_scored, 0.5)
    ratio_def = conceded  / max(expected_conceded, 0.5)

    # Mise à jour légère (on ne bouge pas trop d'un seul match)
    old_att = team_data.get("attack", 1.0)
    old_def = team_data.get("defense", 1.0)
    team_data["attack"]  = round(old_att * (1 + alpha * (ratio_att - 1)), 3)
    team_data["defense"] = round(old_def * (1 + alpha * (ratio_def - 1)), 3)

    # Clamp dans des limites raisonnables
    team_data["attack"]  = max(0.40, min(2.50, team_data["attack"]))
    team_data["defense"] = max(0.40, min(1.60, team_data["defense"]))

    # Mise à jour moyenne de buts
    n = team_data.get("matches_played_wc", 0)
    team_data["avg_goals_scored"]   = round((expected_scored * n + scored) / (n + 1), 2)
    team_data["avg_goals_conceded"] = round((expected_conceded * n + conceded) / (n + 1), 2)
    team_data["matches_played_wc"]  = n + 1

    return team_data


def apply_results(results, wc_data):
    """Applique les résultats à wc2026_data.json."""
    teams   = wc_data["teams"]
    applied = []

    # Charger résultats déjà appliqués
    cache_path = DATA_PATH / "applied_results.json"
    already_applied = set()
    if cache_path.exists():
        with open(cache_path) as f:
            already_applied = set(json.load(f))

    for r in results:
        key = f"{r['date']}_{r['h']}_{r['a']}"
        if key in already_applied:
            continue  # Déjà appliqué, on skip

        h, a  = r["h"], r["a"]
        hg, ag = r["hg"], r["ag"]

        if h not in teams or a not in teams:
            print(f"  ⚠ Équipe inconnue: {h} ou {a} — skipped")
            continue

        # ELO update
        old_elo_h = teams[h]["elo"]
        old_elo_a = teams[a]["elo"]
        new_elo_h, new_elo_a = elo_update(old_elo_h, old_elo_a, hg, ag)
        teams[h]["elo"] = new_elo_h
        teams[a]["elo"] = new_elo_a

        # Form update (le résultat WC va en tête de liste)
        h_form = form_result(hg, ag)
        a_form = form_result(ag, hg)
        teams[h]["recent_form"] = [h_form] + teams[h].get("recent_form", [])[:9]
        teams[a]["recent_form"] = [a_form] + teams[a].get("recent_form", [])[:9]

        # Attack/defense update
        teams[h] = update_attack_defense(teams[h], hg, ag)
        teams[a] = update_attack_defense(teams[a], ag, hg)

        already_applied.add(key)
        applied.append({
            "match":   f"{h} {hg}-{ag} {a}",
            "date":    r["date"],
            "elo_h":   f"{old_elo_h}→{new_elo_h}",
            "elo_a":   f"{old_elo_a}→{new_elo_a}",
            "form_h":  h_form,
            "form_a":  a_form,
        })

    # Sauvegarder la liste des résultats appliqués
    with open(cache_path, "w") as f:
        json.dump(list(already_applied), f)

    return wc_data, applied


def fetch_from_api():
    """Récupère les vrais résultats depuis football-data.org."""
    if not API_KEY or API_KEY == "YOUR_FREE_KEY_HERE":
        return []

    headers = {"X-Auth-Token": API_KEY}
    url = "https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=FINISHED"

    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            matches = r.json().get("matches", [])
            results = []
            for m in matches:
                ft = m.get("score", {}).get("fullTime", {})
                hg, ag = ft.get("home"), ft.get("away")
                if hg is None or ag is None:
                    continue
                stage_raw = m.get("stage", "GROUP_STAGE")
                stage_map = {
                    "GROUP_STAGE": "GROUP", "LAST_32": "R32", "LAST_16": "R16",
                    "QUARTER_FINALS": "QF", "SEMI_FINALS": "SF", "FINAL": "FINAL",
                }
                results.append({
                    "h":     normalize(m.get("homeTeam", {}).get("name", "")),
                    "a":     normalize(m.get("awayTeam", {}).get("name", "")),
                    "hg":    int(hg), "ag": int(ag),
                    "date":  m.get("utcDate", "")[:10],
                    "stage": stage_map.get(stage_raw, "GROUP"),
                })
            print(f"  ✅ API: {len(results)} matchs terminés récupérés")
            return results
        elif r.status_code == 429:
            print("  ⏳ Rate limited, attente 65s...")
            time.sleep(65)
            return fetch_from_api()
        else:
            print(f"  ⚠ API error {r.status_code}")
    except Exception as e:
        print(f"  ⚠ Erreur API: {e}")
    return []


def run(use_known=True, use_api=True):
    print("\n🔄 WC 2026 LIVE RESULTS UPDATE")
    print("=" * 52)

    # Charger données actuelles
    data_path = DATA_PATH / "wc2026_data.json"
    with open(data_path, encoding="utf-8") as f:
        wc_data = json.load(f)

    all_results = []

    if use_known:
        print(f"\n[1/2] Résultats connus (hardcodés): {len(KNOWN_RESULTS)} matchs")
        all_results.extend(KNOWN_RESULTS)

    if use_api:
        print("\n[2/2] Récupération API football-data.org...")
        api_results = fetch_from_api()
        # Merge: éviter doublons par (date, h, a)
        known_keys = {f"{r['date']}_{r['h']}_{r['a']}" for r in all_results}
        for r in api_results:
            key = f"{r['date']}_{r['h']}_{r['a']}"
            if key not in known_keys:
                all_results.append(r)
                known_keys.add(key)

    print(f"\n📊 Total: {len(all_results)} matchs à appliquer")

    # Appliquer
    wc_data, applied = apply_results(all_results, wc_data)

    if not applied:
        print("\n✅ Aucun nouveau résultat à appliquer (tout est à jour)")
        return wc_data

    # Sauvegarder
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(wc_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ {len(applied)} nouveaux résultats appliqués:")
    for r in applied:
        form_emoji = lambda f: "✅" if f==2 else ("➖" if f==1 else "❌")
        print(f"  {form_emoji(r['form_h'])} {r['match']} ({r['date']})")
        print(f"     ELO maison: {r['elo_h']} | ELO ext: {r['elo_a']}")

    # Afficher nouveaux ELO top 10
    print("\n📈 TOP 10 ELO après mise à jour:")
    teams_sorted = sorted(wc_data["teams"].items(), key=lambda x: x[1]["elo"], reverse=True)
    for i, (team, td) in enumerate(teams_sorted[:10], 1):
        form = td.get("recent_form", [])[:3]
        form_str = "".join(["✅" if f==2 else "➖" if f==1 else "❌" for f in form])
        print(f"  {i:2}. {team:<22} ELO: {td['elo']:.0f}  {form_str}")

    return wc_data


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--api-only",  action="store_true")
    p.add_argument("--known",     action="store_true")
    args = p.parse_args()

    if args.api_only:
        run(use_known=False, use_api=True)
    elif args.known:
        run(use_known=True, use_api=False)
    else:
        run(use_known=True, use_api=True)