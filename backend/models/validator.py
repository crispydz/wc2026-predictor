"""
Model validator — backtests predictions against WC 2022 actual results.
Gives accuracy %, Brier score, calibration report.
"""
import json, sys, numpy as np
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

# ── WC 2022 ACTUAL RESULTS (48 group + 16 knockout matches) ──────────────
WC2022 = [
    # GROUP STAGE
    {"h":"Qatar",       "a":"Ecuador",      "hg":0,"ag":2},
    {"h":"Senegal",     "a":"Netherlands",  "hg":0,"ag":2},
    {"h":"Qatar",       "a":"Senegal",      "hg":1,"ag":3},
    {"h":"Netherlands", "a":"Ecuador",      "hg":1,"ag":1},
    {"h":"Ecuador",     "a":"Senegal",      "hg":1,"ag":2},
    {"h":"Netherlands", "a":"Qatar",        "hg":2,"ag":0},
    {"h":"England",     "a":"Iran",         "hg":6,"ag":2},
    {"h":"USA",         "a":"Wales",        "hg":1,"ag":1},
    {"h":"Iran",        "a":"USA",          "hg":0,"ag":1},
    {"h":"England",     "a":"USA",          "hg":0,"ag":0},
    {"h":"Argentina",   "a":"Saudi Arabia", "hg":1,"ag":2},  # 🚨 Biggest upset
    {"h":"Poland",      "a":"Saudi Arabia", "hg":2,"ag":0},
    {"h":"Argentina",   "a":"Mexico",       "hg":2,"ag":0},
    {"h":"Poland",      "a":"Argentina",    "hg":0,"ag":2},
    {"h":"Saudi Arabia","a":"Mexico",       "hg":1,"ag":2},
    {"h":"France",      "a":"Australia",    "hg":4,"ag":1},
    {"h":"France",      "a":"Denmark",      "hg":2,"ag":1},
    {"h":"Australia",   "a":"Denmark",      "hg":1,"ag":0},
    {"h":"Tunisia",     "a":"France",       "hg":1,"ag":0},
    {"h":"Germany",     "a":"Japan",        "hg":1,"ag":2},  # 🚨 Upset
    {"h":"Spain",       "a":"Germany",      "hg":1,"ag":1},
    {"h":"Japan",       "a":"Spain",        "hg":2,"ag":1},  # 🚨 Upset
    {"h":"Costa Rica",  "a":"Germany",      "hg":2,"ag":4},
    {"h":"Morocco",     "a":"Croatia",      "hg":0,"ag":0},
    {"h":"Belgium",     "a":"Canada",       "hg":1,"ag":0},
    {"h":"Belgium",     "a":"Morocco",      "hg":0,"ag":2},  # 🚨 Upset
    {"h":"Croatia",     "a":"Canada",       "hg":4,"ag":1},
    {"h":"Croatia",     "a":"Belgium",      "hg":0,"ag":0},
    {"h":"Morocco",     "a":"Canada",       "hg":2,"ag":1},
    {"h":"Brazil",      "a":"Serbia",       "hg":2,"ag":0},
    {"h":"Brazil",      "a":"Switzerland",  "hg":1,"ag":0},
    {"h":"Switzerland", "a":"Serbia",       "hg":3,"ag":2},
    {"h":"Portugal",    "a":"Ghana",        "hg":3,"ag":2},
    {"h":"South Korea", "a":"Ghana",        "hg":2,"ag":3},
    {"h":"Portugal",    "a":"Uruguay",      "hg":2,"ag":0},
    {"h":"South Korea", "a":"Portugal",     "hg":2,"ag":1},
    {"h":"Uruguay",     "a":"South Korea",  "hg":0,"ag":0},
    # R16
    {"h":"Netherlands", "a":"USA",          "hg":3,"ag":1},
    {"h":"Argentina",   "a":"Australia",    "hg":2,"ag":1},
    {"h":"France",      "a":"Poland",       "hg":3,"ag":1},
    {"h":"England",     "a":"Senegal",      "hg":3,"ag":0},
    {"h":"Brazil",      "a":"South Korea",  "hg":4,"ag":1},
    {"h":"Portugal",    "a":"Switzerland",  "hg":6,"ag":1},
    # QF
    {"h":"Netherlands", "a":"Argentina",    "hg":2,"ag":2},  # Argentina on pens
    {"h":"France",      "a":"England",      "hg":2,"ag":1},
    {"h":"Brazil",      "a":"Croatia",      "hg":1,"ag":1},  # Croatia on pens (upset)
    {"h":"Morocco",     "a":"Portugal",     "hg":1,"ag":0},  # 🚨 Huge upset
    # SF
    {"h":"Argentina",   "a":"Croatia",      "hg":3,"ag":0},
    {"h":"France",      "a":"Morocco",      "hg":2,"ag":0},
    # Final
    {"h":"Argentina",   "a":"France",       "hg":3,"ag":3},  # Argentina on pens
]


def validate(predict_fn, teams_data, fitted, squad):
    """Run full validation against WC 2022 results."""
    from models.enhanced_predictor import compute_match_probabilities

    print("\n📊 BACKTESTING ON WC 2022 RESULTS")
    print("="*52)

    stage_stats = {}
    stages = ["group","r16","qf","sf","final"]
    for s in stages:
        stage_stats[s] = {"n":0,"correct":0,"brier":0.0}

    all_n, all_correct, all_brier = 0, 0, 0.0
    misses = []

    stage_map = list(zip(range(len(WC2022)),
        (["group"]*37 + ["r16"]*6 + ["qf"]*4 + ["sf"]*2 + ["final"]*1)))

    for idx, (m, (_, stage)) in enumerate(zip(WC2022, stage_map)):
        ht, at = m["h"], m["a"]
        hg, ag = m["hg"], m["ag"]

        # Skip teams not in our dataset (Costa Rica, Wales, etc.)
        if ht not in teams_data or at not in teams_data:
            continue

        pred = predict_fn(ht, at, teams_data, fitted, squad, neutral=True)

        # Actual outcome
        if hg > ag:
            actual, actual_vec = "home", [1,0,0]
        elif hg == ag:
            actual, actual_vec = "draw", [0,1,0]
        else:
            actual, actual_vec = "away", [0,0,1]

        # Predicted outcome
        pp = [pred["home_win_prob"], pred["draw_prob"], pred["away_win_prob"]]
        pred_idx = int(np.argmax(pp))
        pred_out = ["home","draw","away"][pred_idx]
        correct  = int(pred_out == actual)
        brier    = sum((p-a)**2 for p,a in zip(pp, actual_vec))

        stage_stats[stage]["n"]       += 1
        stage_stats[stage]["correct"] += correct
        stage_stats[stage]["brier"]   += brier
        all_n += 1; all_correct += correct; all_brier += brier

        if not correct and pp[pred_idx] > 0.55:
            misses.append({
                "match": f"{ht} {hg}-{ag} {at}",
                "predicted": f"{pred_out} ({pp[pred_idx]*100:.0f}%)",
                "actual": actual,
            })

    # ── Print results ──────────────────────────────────────────
    print(f"\n  {'Stage':<8} │ {'Acc':>8} │ {'Correct':>9} │ {'Brier':>8}")
    print(f"  {'-'*8}-+-{'-'*8}-+-{'-'*9}-+-{'-'*8}")
    for stage in stages:
        s = stage_stats[stage]
        if s["n"] == 0: continue
        acc = s["correct"]/s["n"]*100
        brier_avg = s["brier"]/s["n"]
        print(f"  {stage.upper():<8} │ {acc:7.1f}% │ {s['correct']:>4}/{s['n']:<4} │ {brier_avg:8.3f}")

    print(f"  {'─'*8}-+-{'─'*8}-+-{'─'*9}-+-{'─'*8}")
    if all_n > 0:
        total_acc   = all_correct/all_n*100
        total_brier = all_brier/all_n
        print(f"  {'TOTAL':<8} │ {total_acc:7.1f}% │ {all_correct:>4}/{all_n:<4} │ {total_brier:8.3f}")

        print(f"\n  🚨 High-confidence wrong predictions ({len(misses)}):")
        for x in misses:
            print(f"     {x['match']:<35} predicted {x['predicted']}, actual {x['actual']}")

        print(f"\n  🎯 VERDICT:")
        print(f"     Random baseline:    33.3%  |  Brier 0.667")
        print(f"     Decent model:       50–55% |  Brier 0.55–0.60")
        print(f"     Good model:         55–60% |  Brier 0.50–0.55")
        print(f"     Bookmaker level:    60–63% |  Brier 0.47–0.50")
        print(f"     ──────────────────────────────────────────")
        print(f"     OUR MODEL:          {total_acc:.1f}%  |  Brier {total_brier:.3f}")

        if total_acc >= 60:   verdict = "✅ EXCELLENT — competitive with bookmakers"
        elif total_acc >= 55: verdict = "✅ GOOD — well above baseline"
        elif total_acc >= 50: verdict = "⚠  FAIR — above random, room to improve"
        else:                 verdict = "❌ POOR — check data and fitting"
        print(f"     {verdict}")

    return {"accuracy": all_correct/max(all_n,1), "brier": all_brier/max(all_n,1), "n": all_n}


if __name__ == "__main__":
    from models.enhanced_predictor import load_all_data, compute_match_probabilities
    wc_data, fitted, squad = load_all_data()
    validate(compute_match_probabilities, wc_data["teams"], fitted, squad)