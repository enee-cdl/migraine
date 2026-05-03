import { useCallback, useEffect, useState } from "react";
import MigraineDashboard from "./MigraineDashboard";
import { fetchSheetValues } from "./sheetsClient";
import { SheetsApiError } from "./sheetsErrors";
import { parseMigraineRows } from "./parseSheetRows";
import type { MigraineRow } from "./types";

const COLORS = {
  bg: "#0f1117",
  text: "#e8eaf0",
  muted: "#7a8099",
  card: "#181c25",
  border: "#252b38",
  accent: "#5c9fe0",
};

export default function App() {
  const [rows, setRows] = useState<MigraineRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const values = await fetchSheetValues();
      setRows(parseMigraineRows(values));
    } catch (e) {
      const msg =
        e instanceof SheetsApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Erreur inconnue";
      setError(msg);
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && rows === null && !error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          color: COLORS.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Chargement des données…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          color: COLORS.text,
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Impossible de charger la feuille</h1>
        <p style={{ color: COLORS.muted, lineHeight: 1.5 }}>{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          style={{
            marginTop: 16,
            padding: "10px 18px",
            borderRadius: 8,
            border: `1px solid ${COLORS.accent}`,
            background: COLORS.accent,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          color: COLORS.text,
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p>Aucune ligne de crise trouvée. Vérifiez la plage et les en-têtes du tableur.</p>
        <button
          type="button"
          onClick={() => void load()}
          style={{
            marginTop: 16,
            padding: "10px 18px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.card,
            color: COLORS.text,
            cursor: "pointer",
          }}
        >
          Rafraîchir
        </button>
      </div>
    );
  }

  return (
    <>
      <MigraineDashboard rawData={rows} />
      <div
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => void load()}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.card,
            color: COLORS.muted,
            cursor: "pointer",
            fontSize: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,.35)",
          }}
        >
          Rafraîchir depuis Sheets
        </button>
      </div>
    </>
  );
}
