"""
prepare_data.py
================
Charge les CSV de comptage vélo de la Ville de Montréal,
filtre les 3 compteurs du Parc Jean-Drapeau, agrège et exporte
en JSON pour le dashboard React.

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

# Fichiers sources
LOCALISATION_CSV = os.path.join(DATA_DIR, "localisation_des_compteurs_velo.csv")
COMPTAGE_2023_CSV = os.path.join(DATA_DIR, "comptage_velo_2023.csv")
COMPTAGE_2024_CSV = os.path.join(DATA_DIR, "comptage_velo_2024.csv")

# 3 compteurs pertinents pour le Parc Jean-Drapeau
PJD_COUNTER_IDS = ["100002880", "100003040", "100001753"]
PJD_COUNTER_NAMES = {
    "100002880": "Pont Jacques-Cartier",
    "100003040": "Pierre-Dupuy",
    "100001753": "Notre-Dame",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_localisation():
    """Charge la localisation des 3 compteurs PJD."""
    df = pd.read_csv(LOCALISATION_CSV)
    df["ID"] = df["ID"].astype(str)
    pjd = df[df["ID"].isin(PJD_COUNTER_IDS)].copy()
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


def load_and_filter_csv(filepath: str, year: int) -> pd.DataFrame:
    """
    Charge un CSV de comptage, détecte le format, filtre les colonnes PJD
    et retourne un DataFrame daily avec colonnes: date, <counter_id>...

    Formats gérés:
      - Wide: colonnes = compteur IDs, index = datetime
      - Long: colonnes = Date, compteur_id (à pivoter)
    """
    print(f"  Lecture {os.path.basename(filepath)}...")

    # Lecture avec inférence du séparateur (virgule ou point-virgule)
    try:
        df = pd.read_csv(filepath, sep=None, engine="python", low_memory=False)
    except Exception as e:
        print(f"  ERREUR lecture: {e}")
        return pd.DataFrame()

    print(f"  Colonnes détectées: {list(df.columns[:10])}...")

    # Identifier la colonne date (première colonne non-numérique en général)
    date_col = df.columns[0]

    # Chercher les colonnes compteurs PJD
    present_ids = [cid for cid in PJD_COUNTER_IDS if cid in df.columns]

    if len(present_ids) == 0:
        # Chercher sans tenir compte du type (les IDs peuvent être entiers)
        int_ids = [int(cid) for cid in PJD_COUNTER_IDS]
        present_int = [c for c in df.columns if c in int_ids or str(c) in PJD_COUNTER_IDS]
        if len(present_int) == 0:
            print(f"  ATTENTION: aucun compteur PJD trouvé. Colonnes dispo: {list(df.columns)}")
            return pd.DataFrame()
        # Renommer les colonnes en string
        rename_map = {c: str(c) for c in present_int}
        df = df.rename(columns=rename_map)
        present_ids = [str(c) for c in present_int]

    # Parser les dates
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df = df.dropna(subset=[date_col])

    # Garder seulement date + colonnes PJD
    cols = [date_col] + present_ids
    df = df[cols].copy()
    df = df.rename(columns={date_col: "datetime"})

    # Convertir valeurs en numérique
    for cid in present_ids:
        df[cid] = pd.to_numeric(df[cid], errors="coerce").fillna(0)

    # Ajouter les compteurs absents avec 0
    for cid in PJD_COUNTER_IDS:
        if cid not in df.columns:
            df[cid] = 0

    # Agréger par jour (si données horaires)
    df["date"] = df["datetime"].dt.date
    daily = df.groupby("date")[PJD_COUNTER_IDS].sum().reset_index()
    daily["date"] = daily["date"].astype(str)

    print(f"  {len(daily)} jours chargés pour {year}")
    return daily


def compute_stats(daily_all: pd.DataFrame) -> dict:
    """Calcule les statistiques par compteur."""
    stats = {}
    for cid in PJD_COUNTER_IDS:
        d2023 = daily_all[daily_all["date"].str.startswith("2023")]
        d2024 = daily_all[daily_all["date"].str.startswith("2024")]

        total_2023 = int(d2023[cid].sum())
        total_2024 = int(d2024[cid].sum())
        yoy = ((total_2024 - total_2023) / total_2023 * 100) if total_2023 > 0 else 0.0

        # Moyenne sur jours actifs (> 0)
        active_2023 = d2023[d2023[cid] > 0]
        active_2024 = d2024[d2024[cid] > 0]
        avg_2023 = float(active_2023[cid].mean()) if len(active_2023) > 0 else 0.0
        avg_2024 = float(active_2024[cid].mean()) if len(active_2024) > 0 else 0.0

        # Pics
        peak_2023_row = d2023.loc[d2023[cid].idxmax()] if len(d2023) > 0 else None
        peak_2024_row = d2024.loc[d2024[cid].idxmax()] if len(d2024) > 0 else None

        stats[cid] = {
            "name": PJD_COUNTER_NAMES[cid],
            "total_2023": total_2023,
            "total_2024": total_2024,
            "daily_avg_2023": round(avg_2023, 1),
            "daily_avg_2024": round(avg_2024, 1),
            "peak_date_2023": str(peak_2023_row["date"]) if peak_2023_row is not None else "",
            "peak_value_2023": int(peak_2023_row[cid]) if peak_2023_row is not None else 0,
            "peak_date_2024": str(peak_2024_row["date"]) if peak_2024_row is not None else "",
            "peak_value_2024": int(peak_2024_row[cid]) if peak_2024_row is not None else 0,
            "yoy_change_pct": round(yoy, 2),
        }
    return stats


MONTHS_FR = [
    "Jan 2023", "Fév 2023", "Mar 2023", "Avr 2023", "Mai 2023", "Juin 2023",
    "Juil 2023", "Août 2023", "Sep 2023", "Oct 2023", "Nov 2023", "Déc 2023",
    "Jan 2024", "Fév 2024", "Mar 2024", "Avr 2024", "Mai 2024", "Juin 2024",
    "Juil 2024", "Août 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Déc 2024",
]


def build_monthly(daily_all: pd.DataFrame) -> list:
    """Agrège les données par mois."""
    df = daily_all.copy()
    df["dt"] = pd.to_datetime(df["date"])
    df["year"] = df["dt"].dt.year
    df["month"] = df["dt"].dt.month

    monthly_df = df.groupby(["year", "month"])[PJD_COUNTER_IDS].sum().reset_index()

    MONTH_LABELS_FR = [
        "", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
        "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
    ]

    records = []
    for _, row in monthly_df.iterrows():
        year, month = int(row["year"]), int(row["month"])
        records.append({
            "year": year,
            "month": month,
            "month_label": f"{MONTH_LABELS_FR[month]} {year}",
            **{cid: int(row[cid]) for cid in PJD_COUNTER_IDS},
        })
    return records


def build_weekly(daily_all: pd.DataFrame) -> list:
    """Agrège les données par semaine ISO."""
    df = daily_all.copy()
    df["dt"] = pd.to_datetime(df["date"])
    df["year"] = df["dt"].dt.isocalendar().year.astype(int)
    df["week"] = df["dt"].dt.isocalendar().week.astype(int)

    weekly_df = df.groupby(["year", "week"])[PJD_COUNTER_IDS].sum().reset_index()

    records = []
    for _, row in weekly_df.iterrows():
        year, week = int(row["year"]), int(row["week"])
        records.append({
            "year": year,
            "week": week,
            "week_label": f"S{week:02d} {year}",
            **{cid: int(row[cid]) for cid in PJD_COUNTER_IDS},
        })
    return records


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Préparation des données cyclistes — Parc Jean-Drapeau ===\n")

    # 1. Localisation
    print("1. Chargement de la localisation...")
    counters = load_localisation()
    print(f"   {len(counters)} compteurs PJD trouvés\n")

    # 2. Données de comptage
    print("2. Chargement des données de comptage...")
    daily_2023 = load_and_filter_csv(COMPTAGE_2023_CSV, 2023)
    daily_2024 = load_and_filter_csv(COMPTAGE_2024_CSV, 2024)

    if daily_2023.empty and daily_2024.empty:
        print("\nERREUR: Aucune donnée chargée. Vérifiez les fichiers CSV dans data/")
        return

    # Combiner
    frames = [f for f in [daily_2023, daily_2024] if not f.empty]
    daily_all = pd.concat(frames, ignore_index=True).sort_values("date")

    print(f"\n   Total : {len(daily_all)} jours-observations\n")

    # 3. Agrégations
    print("3. Agrégation mensuelle et hebdomadaire...")
    monthly = build_monthly(daily_all)
    weekly = build_weekly(daily_all)
    print(f"   {len(monthly)} mois, {len(weekly)} semaines\n")

    # 4. Statistiques
    print("4. Calcul des statistiques...")
    stats = compute_stats(daily_all)
    for cid, s in stats.items():
        print(f"   {s['name']}: {s['total_2024']:,} passages en 2024 ({s['yoy_change_pct']:+.1f}% YoY)")

    # 5. Export
    print("\n5. Export JSON...")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    output = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "period": "2023-2024",
            "source": "Données ouvertes — Ville de Montréal (donnees.montreal.ca)",
            "counters": counters,
        },
        "daily": [
            {
                "date": row["date"],
                **{cid: int(row[cid]) for cid in PJD_COUNTER_IDS}
            }
            for _, row in daily_all.iterrows()
        ],
        "monthly": monthly,
        "weekly": weekly,
        "stats": stats,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"\n   Fichier écrit : {OUTPUT_PATH}")
    print(f"   Taille : {size_kb:.0f} KB")
    print("\n=== Terminé. Lancez 'npm run dev' pour démarrer le dashboard. ===")


if __name__ == "__main__":
    main()
