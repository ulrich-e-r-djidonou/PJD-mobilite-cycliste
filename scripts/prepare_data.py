"""
prepare_data.py
================
Charge les CSV de comptage vélo de la Ville de Montréal (format long),
filtre les 3 compteurs du Parc Jean-Drapeau, agrège et exporte
en JSON pour le dashboard React.

Format CSV source : date, heure, id_compteur, [nb_passages ou autres cols], longitude, latitude
  -> une ligne par intervalle de temps (horaire ou 15 min) par compteur

Usage:
    pip install pandas
    python scripts/prepare_data.py

Output: public/data/cycling_data.json
"""

import json
import os
import pandas as pd
from datetime import datetime

# ── Configuration ────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)

DATA_DIR = os.path.join(ROOT_DIR, "data")
OUTPUT_PATH = os.path.join(ROOT_DIR, "public", "data", "cycling_data.json")

LOCALISATION_CSV = os.path.join(DATA_DIR, "localisation_des_compteurs_velo.csv")
COMPTAGE_2023_CSV = os.path.join(DATA_DIR, "comptage_velo_2023.csv")
COMPTAGE_2024_CSV = os.path.join(DATA_DIR, "comptage_velo_2024.csv")

PJD_COUNTER_IDS = ["100002880", "100003040", "100001753"]
PJD_COUNTER_NAMES = {
    "100002880": "Pont Jacques-Cartier",
    "100003040": "Pierre-Dupuy",
    "100001753": "Notre-Dame",
}

MONTH_LABELS_FR = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
                   "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_localisation():
    df = pd.read_csv(LOCALISATION_CSV)
    df["ID"] = df["ID"].astype(str)
    pjd = df[df["ID"].isin(PJD_COUNTER_IDS)]
    counters = []
    for _, row in pjd.iterrows():
        counters.append({
            "id": str(row["ID"]),
            "name": row["Nom"],
            "lat": float(row["Latitude"]),
            "lon": float(row["Longitude"]),
            "status": row["Statut"],
            "year_installed": int(row["Annee_implante"]) if pd.notna(row["Annee_implante"]) else 0,
        })
    return counters


def load_long_csv(filepath: str, year: int) -> pd.DataFrame:
    """
    Charge un CSV en format long (une ligne par intervalle par compteur).
    Retourne un DataFrame wide agrégé par jour : colonnes = date, <counter_id>...
    """
    print(f"  Lecture {os.path.basename(filepath)} ({year})...")

    # Lecture avec détection automatique du séparateur
    df = pd.read_csv(filepath, sep=None, engine="python", dtype=str)
    df.columns = [c.strip().lower() for c in df.columns]
    print(f"  Colonnes : {list(df.columns)}")

    # Identifier la colonne compteur et la colonne passages
    col_id = "id_compteur"
    col_passages = "nb_passages"

    if col_id not in df.columns or col_passages not in df.columns:
        raise ValueError(f"Colonnes attendues '{col_id}' et '{col_passages}' introuvables. Colonnes : {list(df.columns)}")

    # Filtrer sur les compteurs PJD
    df[col_id] = df[col_id].astype(str).str.strip()
    df = df[df[col_id].isin(PJD_COUNTER_IDS)].copy()
    print(f"  Lignes après filtre PJD : {len(df):,}")

    if len(df) == 0:
        print("  ATTENTION: aucune ligne trouvée pour les compteurs PJD!")
        return pd.DataFrame()

    # Parser la date
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    df = df.dropna(subset=["date"])

    # Convertir passages en numérique
    df[col_passages] = pd.to_numeric(df[col_passages], errors="coerce").fillna(0)

    # Agréger par jour × compteur (somme des intervalles)
    daily = (
        df.groupby(["date", col_id])[col_passages]
        .sum()
        .reset_index()
    )

    # Pivoter en format wide
    wide = daily.pivot(index="date", columns=col_id, values=col_passages)

    # S'assurer que tous les compteurs PJD sont présents
    for cid in PJD_COUNTER_IDS:
        if cid not in wide.columns:
            wide[cid] = 0

    wide = wide[PJD_COUNTER_IDS].fillna(0).astype(int).reset_index()
    wide["date"] = wide["date"].astype(str)

    print(f"  {len(wide)} jours avec données pour {year}")
    return wide


def compute_stats(daily_all: pd.DataFrame) -> dict:
    stats = {}
    for cid in PJD_COUNTER_IDS:
        d2023 = daily_all[daily_all["date"].str.startswith("2023")]
        d2024 = daily_all[daily_all["date"].str.startswith("2024")]

        total_2023 = int(d2023[cid].sum())
        total_2024 = int(d2024[cid].sum())
        yoy = ((total_2024 - total_2023) / total_2023 * 100) if total_2023 > 0 else 0.0

        active_2023 = d2023[d2023[cid] > 0]
        active_2024 = d2024[d2024[cid] > 0]
        avg_2023 = float(active_2023[cid].mean()) if len(active_2023) > 0 else 0.0
        avg_2024 = float(active_2024[cid].mean()) if len(active_2024) > 0 else 0.0

        peak_2023 = d2023.loc[d2023[cid].idxmax()] if len(d2023) > 0 else None
        peak_2024 = d2024.loc[d2024[cid].idxmax()] if len(d2024) > 0 else None

        stats[cid] = {
            "name": PJD_COUNTER_NAMES[cid],
            "total_2023": total_2023,
            "total_2024": total_2024,
            "daily_avg_2023": round(avg_2023, 1),
            "daily_avg_2024": round(avg_2024, 1),
            "peak_date_2023": str(peak_2023["date"]) if peak_2023 is not None else "",
            "peak_value_2023": int(peak_2023[cid]) if peak_2023 is not None else 0,
            "peak_date_2024": str(peak_2024["date"]) if peak_2024 is not None else "",
            "peak_value_2024": int(peak_2024[cid]) if peak_2024 is not None else 0,
            "yoy_change_pct": round(yoy, 2),
        }
    return stats


def build_monthly(daily_all: pd.DataFrame) -> list:
    df = daily_all.copy()
    df["dt"] = pd.to_datetime(df["date"])
    df["year"] = df["dt"].dt.year
    df["month"] = df["dt"].dt.month
    g = df.groupby(["year", "month"])[PJD_COUNTER_IDS].sum().reset_index()
    records = []
    for _, row in g.iterrows():
        y, m = int(row["year"]), int(row["month"])
        records.append({
            "year": y,
            "month": m,
            "month_label": f"{MONTH_LABELS_FR[m]} {y}",
            **{cid: int(row[cid]) for cid in PJD_COUNTER_IDS},
        })
    return records


def build_weekly(daily_all: pd.DataFrame) -> list:
    df = daily_all.copy()
    df["dt"] = pd.to_datetime(df["date"])
    iso = df["dt"].dt.isocalendar()
    df["year"] = iso.year.astype(int)
    df["week"] = iso.week.astype(int)
    g = df.groupby(["year", "week"])[PJD_COUNTER_IDS].sum().reset_index()
    records = []
    for _, row in g.iterrows():
        y, w = int(row["year"]), int(row["week"])
        records.append({
            "year": y,
            "week": w,
            "week_label": f"S{w:02d} {y}",
            **{cid: int(row[cid]) for cid in PJD_COUNTER_IDS},
        })
    return records


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Préparation des données cyclistes — Parc Jean-Drapeau ===\n")

    print("1. Localisation des compteurs...")
    counters = load_localisation()
    print(f"   {len(counters)} compteurs PJD trouvés\n")

    print("2. Chargement des CSV de comptage (format long)...")
    daily_2023 = load_long_csv(COMPTAGE_2023_CSV, 2023)
    print()
    daily_2024 = load_long_csv(COMPTAGE_2024_CSV, 2024)
    print()

    frames = [f for f in [daily_2023, daily_2024] if not f.empty]
    if not frames:
        print("ERREUR: aucune donnée chargée.")
        return

    daily_all = pd.concat(frames, ignore_index=True).sort_values("date").reset_index(drop=True)
    print(f"3. Combiné : {len(daily_all)} jours-observations\n")

    print("4. Agrégations...")
    monthly = build_monthly(daily_all)
    weekly = build_weekly(daily_all)
    print(f"   {len(monthly)} mois, {len(weekly)} semaines\n")

    print("5. Statistiques...")
    stats = compute_stats(daily_all)
    for cid, s in stats.items():
        print(f"   {s['name']:30s}: {s['total_2024']:>10,} passages 2024  ({s['yoy_change_pct']:+.1f}% vs 2023)")

    print("\n6. Export JSON...")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    output = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "period": "2023-2024",
            "source": "Données ouvertes — Ville de Montréal (donnees.montreal.ca)",
            "counters": counters,
        },
        "daily": [
            {"date": row["date"], **{cid: int(row[cid]) for cid in PJD_COUNTER_IDS}}
            for _, row in daily_all.iterrows()
        ],
        "monthly": monthly,
        "weekly": weekly,
        "stats": stats,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"   Écrit : {OUTPUT_PATH}  ({size_kb:.0f} KB)")
    print("\n=== Terminé. Lancez 'npm run dev' pour démarrer le dashboard. ===")


if __name__ == "__main__":
    main()
