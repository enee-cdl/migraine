import { describe, expect, it } from "vitest";
import {
  cellBool,
  cellNum,
  HEADER_ROW_INDEX,
  parseMigraineRows,
} from "./parseSheetRows";

/** Grille minimale : ligne 0 = bandeau, ligne 1 = en-têtes (comme votre Sheet). */
function sampleGrid() {
  return [
    ["", "DECLENCHEUR"],
    [
      "date ",
      "LUMIERE",
      "SON",
      "PRESSION ",
      "TEMPERATURE",
      "ODEUR",
      "STRESS",
      "ALCOOL",
      "NE SAIT PAS ",
      "VISION",
      "ODORAT",
      "NAUSEE",
      "VOMISSEMENTS",
      "DOULEURS OS",
      "OUIE",
      "FAIBLESSES MUSCULAIRE",
      "BRAIN FOG",
      "DUREE",
      "MEDICAMENTS",
      "INTENSITE MIGRAINE",
      "INTENSITE DOULEUR OSSEUSE",
    ],
    [
      "26-03",
      "FALSE",
      "FALSE",
      "FALSE",
      "FALSE",
      "FALSE",
      "TRUE",
      "FALSE",
      "TRUE",
      "TRUE",
      "TRUE",
      "TRUE",
      "FALSE",
      "TRUE",
      "FALSE",
      "TRUE",
      "FALSE",
      "10",
      "PROFEMIGR",
      "5",
      "2",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ];
}

describe("cellBool / cellNum", () => {
  it("parse booleans", () => {
    expect(cellBool("TRUE")).toBe(true);
    expect(cellBool("FALSE")).toBe(false);
    expect(cellBool(undefined)).toBe(false);
  });

  it("parse numbers with comma decimal", () => {
    expect(cellNum("5")).toBe(5);
    expect(cellNum("7,5")).toBe(7.5);
    expect(cellNum("")).toBeNull();
  });
});

describe("parseMigraineRows", () => {
  it("maps Sheet rows to MigraineRow (minutes, slash dates)", () => {
    const rows = parseMigraineRows(sampleGrid());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      date: "26/03",
      stress: true,
      saitPas: true,
      dureeMinutes: 10,
      medicaments: "PROFEMIGR",
      intensiteMigr: 5,
      intensiteOs: 2,
    });
  });

  it("skips rows without date", () => {
    const g = sampleGrid();
    g.push(["", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "", "", "", ""]);
    const rows = parseMigraineRows(g);
    expect(rows).toHaveLength(1);
  });

  it("skips rows without intensité migraine", () => {
    const g = sampleGrid();
    g[2][19] = "";
    const rows = parseMigraineRows(g);
    expect(rows).toHaveLength(0);
  });

  it("uses HEADER_ROW_INDEX 1", () => {
    expect(HEADER_ROW_INDEX).toBe(1);
  });

  it("throws if a required column is missing", () => {
    const bad = [
      ["x"],
      ["date", "LUMIERE"],
      ["1", "FALSE"],
    ];
    expect(() => parseMigraineRows(bad)).toThrow(/Colonne introuvable/i);
  });
});
