import type { MigraineRow } from "./types";

/** Ligne d’en-têtes réels (0 = première ligne du fichier Sheet). */
export const HEADER_ROW_INDEX = 1;

function normHeader(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumnIndex(headers: string[], ...candidates: string[]): number {
  const normalized = headers.map((h) => normHeader(String(h ?? "")));
  for (const c of candidates) {
    const want = normHeader(c);
    const i = normalized.indexOf(want);
    if (i !== -1) return i;
  }
  return -1;
}

export function cellBool(v: string | undefined): boolean {
  if (v == null) return false;
  return String(v).trim().toUpperCase() === "TRUE";
}

export function cellNum(v: string | undefined): number | null {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function buildColumnMap(headers: string[]) {
  const idx = (candidates: string[]) => {
    const i = findColumnIndex(headers, ...candidates);
    if (i === -1) {
      throw new Error(
        `Colonne introuvable parmi : ${candidates.join(", ")}. En-têtes reçus : ${headers.join(" | ")}`
      );
    }
    return i;
  };

  return {
    date: idx(["date"]),
    lumiere: idx(["lumiere"]),
    son: idx(["son"]),
    pression: idx(["pression"]),
    temperature: idx(["temperature"]),
    odeur: idx(["odeur"]),
    stress: idx(["stress"]),
    alcool: idx(["alcool"]),
    saitPas: idx(["ne sait pas"]),
    vision: idx(["vision"]),
    odorat: idx(["odorat"]),
    nausee: idx(["nausee"]),
    vomissements: idx(["vomissements"]),
    douleurOs: idx(["douleurs os"]),
    ouie: idx(["ouie"]),
    faiblesseMusc: idx(["faiblesses musculaire", "faiblesses musculaires"]),
    brainFog: idx(["brain fog"]),
    duree: idx(["duree", "durée", "duree (h)", "durée (h)"]),
    medicaments: idx(["medicaments"]),
    intensiteMigr: idx(["intensite migraine"]),
    intensiteOs: idx(["intensite douleur osseuse"]),
  };
}

/**
 * Transforme la grille renvoyée par l’API en lignes typées.
 * Suppose 2 lignes d’en-tête : ligne 0 (groupes), ligne 1 (noms de colonnes), données à partir de la ligne 2.
 */
export function parseMigraineRows(values: string[][]): MigraineRow[] {
  if (values.length <= HEADER_ROW_INDEX + 1) return [];

  const headers = values[HEADER_ROW_INDEX] ?? [];
  const col = buildColumnMap(headers);
  const rows: MigraineRow[] = [];

  for (let r = HEADER_ROW_INDEX + 1; r < values.length; r++) {
    const line = values[r] ?? [];
    const dateRaw = line[col.date];
    const date = dateRaw != null ? String(dateRaw).trim() : "";
    if (!date) continue;

    const im = cellNum(line[col.intensiteMigr]);
    if (im === null) continue;

    rows.push({
      date: date.replace(/-/g, "/"),
      lumiere: cellBool(line[col.lumiere]),
      son: cellBool(line[col.son]),
      pression: cellBool(line[col.pression]),
      temperature: cellBool(line[col.temperature]),
      odeur: cellBool(line[col.odeur]),
      stress: cellBool(line[col.stress]),
      alcool: cellBool(line[col.alcool]),
      saitPas: cellBool(line[col.saitPas]),
      vision: cellBool(line[col.vision]),
      odorat: cellBool(line[col.odorat]),
      nausee: cellBool(line[col.nausee]),
      vomissements: cellBool(line[col.vomissements]),
      douleurOs: cellBool(line[col.douleurOs]),
      ouie: cellBool(line[col.ouie]),
      faiblesseMusc: cellBool(line[col.faiblesseMusc]),
      brainFog: cellBool(line[col.brainFog]),
      dureeHeures: cellNum(line[col.duree]),
      medicaments: String(line[col.medicaments] ?? "").trim(),
      intensiteMigr: im,
      intensiteOs: cellNum(line[col.intensiteOs]) ?? 0,
    });
  }

  return rows;
}
