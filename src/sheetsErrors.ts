export class SheetsApiError extends Error {
  readonly status: number;
  readonly bodySnippet: string;

  constructor(status: number, message: string, bodySnippet = "") {
    super(message);
    this.name = "SheetsApiError";
    this.status = status;
    this.bodySnippet = bodySnippet;
  }
}

/** Message utilisateur court selon le code HTTP Sheets. */
export function humanMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Requête invalide (plage ou ID tableur incorrect). Vérifiez VITE_SHEET_RANGE et VITE_SHEET_ID.";
    case 403:
      return "Accès refusé (403). Vérifiez que la feuille est partagée en lecture, que l’API Sheets est activée et que la clé API n’est pas trop restreinte.";
    case 404:
      return "Tableur ou feuille introuvable (404). Vérifiez VITE_SHEET_ID et le nom d’onglet dans VITE_SHEET_RANGE.";
    case 429:
      return "Trop de requêtes (429). Réessayez plus tard ou augmentez les quotas dans Google Cloud.";
    case 500:
    case 502:
    case 503:
      return "Service Google temporairement indisponible. Réessayez plus tard.";
    default:
      return `Erreur Google Sheets (HTTP ${status}).`;
  }
}

export function parseGoogleErrorBody(body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { message?: string } };
    return j.error?.message ?? body.slice(0, 200);
  } catch {
    return body.slice(0, 200);
  }
}
