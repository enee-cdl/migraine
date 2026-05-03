import {
  SheetsApiError,
  humanMessageForStatus,
  parseGoogleErrorBody,
} from "./sheetsErrors";

export type SheetValuesResponse = {
  values?: string[][];
};

export type SheetsClientConfig = {
  key: string;
  id: string;
  range: string;
};

function getConfigFromEnv(): SheetsClientConfig {
  const key = import.meta.env.VITE_GOOGLE_API_KEY?.trim();
  const id = import.meta.env.VITE_SHEET_ID?.trim();
  const range = import.meta.env.VITE_SHEET_RANGE?.trim();
  if (!key || !id || !range) {
    throw new Error(
      "Variables manquantes : définissez VITE_GOOGLE_API_KEY, VITE_SHEET_ID et VITE_SHEET_RANGE dans .env"
    );
  }
  return { key, id, range };
}

/**
 * Lit les valeurs brutes via Google Sheets API v4 (clé API).
 * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
 */
export async function fetchSheetValues(options?: {
  fetchImpl?: typeof fetch;
  config?: SheetsClientConfig;
}): Promise<string[][]> {
  const { key, id, range } = options?.config ?? getConfigFromEnv();
  const fetchImpl = options?.fetchImpl ?? fetch;
  const path = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    id
  )}/values/${encodeURIComponent(range)}`;
  const url = `${path}?key=${encodeURIComponent(key)}`;

  const res = await fetchImpl(url, { method: "GET" });
  const text = await res.text();

  if (!res.ok) {
    const snippet = parseGoogleErrorBody(text);
    const human = humanMessageForStatus(res.status);
    throw new SheetsApiError(
      res.status,
      `${human} Détail : ${snippet}`,
      snippet
    );
  }

  let json: SheetValuesResponse;
  try {
    json = JSON.parse(text) as SheetValuesResponse;
  } catch {
    throw new SheetsApiError(
      res.status,
      "Réponse JSON invalide de l’API Sheets.",
      text.slice(0, 200)
    );
  }

  return json.values ?? [];
}
