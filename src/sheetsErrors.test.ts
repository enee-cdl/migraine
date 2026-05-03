import { describe, expect, it } from "vitest";
import {
  humanMessageForStatus,
  parseGoogleErrorBody,
  SheetsApiError,
} from "./sheetsErrors";

describe("humanMessageForStatus", () => {
  it("covers common HTTP codes", () => {
    expect(humanMessageForStatus(400)).toMatch(/plage|ID/i);
    expect(humanMessageForStatus(403)).toMatch(/403|refusé/i);
    expect(humanMessageForStatus(404)).toMatch(/404|introuvable/i);
    expect(humanMessageForStatus(429)).toMatch(/429|requêtes/i);
    expect(humanMessageForStatus(503)).toMatch(/indisponible/i);
    expect(humanMessageForStatus(418)).toMatch(/418/);
  });
});

describe("parseGoogleErrorBody", () => {
  it("extracts error.message from JSON", () => {
    const body = JSON.stringify({
      error: { message: "Requested entity was not found." },
    });
    expect(parseGoogleErrorBody(body)).toBe(
      "Requested entity was not found."
    );
  });

  it("returns slice for non-JSON", () => {
    expect(parseGoogleErrorBody("not json")).toBe("not json");
  });
});

describe("SheetsApiError", () => {
  it("stores status and snippet", () => {
    const e = new SheetsApiError(403, "msg", "detail");
    expect(e.status).toBe(403);
    expect(e.bodySnippet).toBe("detail");
    expect(e.name).toBe("SheetsApiError");
  });
});
