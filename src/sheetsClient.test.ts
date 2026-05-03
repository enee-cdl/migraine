import { describe, expect, it, vi } from "vitest";
import { fetchSheetValues } from "./sheetsClient";

const testConfig = {
  key: "test-key",
  id: "spreadsheet-id",
  range: "Feuille 1!A1:Z10",
};

function mockResponse(
  init: Partial<Response> & { body?: string }
): Response {
  const body = init.body ?? "";
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: async () => body,
  } as Response;
}

describe("fetchSheetValues", () => {
  it("returns values on 200", async () => {
    const payload = { values: [["a"], ["b"]] };
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse({ body: JSON.stringify(payload) })
    );
    const v = await fetchSheetValues({
      fetchImpl: fetchImpl as typeof fetch,
      config: testConfig,
    });
    expect(v).toEqual([["a"], ["b"]]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const url = String(fetchImpl.mock.calls[0][0]);
    expect(url).toContain("spreadsheets/spreadsheet-id/values");
    expect(url).toContain(encodeURIComponent("Feuille 1!A1:Z10"));
    expect(url).toContain("key=test-key");
  });

  it("returns empty array when values key missing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse({ body: JSON.stringify({}) })
    );
    const v = await fetchSheetValues({
      fetchImpl: fetchImpl as typeof fetch,
      config: testConfig,
    });
    expect(v).toEqual([]);
  });

  it("throws SheetsApiError on 403", async () => {
    const body = JSON.stringify({
      error: { message: "The caller does not have permission" },
    });
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 403, body })
    );
    await expect(
      fetchSheetValues({ fetchImpl: fetchImpl as typeof fetch, config: testConfig })
    ).rejects.toMatchObject({
      name: "SheetsApiError",
      status: 403,
    });
  });

  it("throws SheetsApiError on 404", async () => {
    const body = JSON.stringify({
      error: { message: "Requested entity was not found." },
    });
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 404, body })
    );
    await expect(
      fetchSheetValues({ fetchImpl: fetchImpl as typeof fetch, config: testConfig })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws SheetsApiError on 429", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        status: 429,
        body: JSON.stringify({ error: { message: "Quota exceeded" } }),
      })
    );
    await expect(
      fetchSheetValues({ fetchImpl: fetchImpl as typeof fetch, config: testConfig })
    ).rejects.toMatchObject({ status: 429 });
  });

  it("throws SheetsApiError on 502", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 502, body: "Bad Gateway" })
    );
    await expect(
      fetchSheetValues({ fetchImpl: fetchImpl as typeof fetch, config: testConfig })
    ).rejects.toMatchObject({ status: 502 });
  });

  it("throws SheetsApiError when JSON is invalid on 200", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse({ ok: true, body: "not-json" })
    );
    await expect(
      fetchSheetValues({ fetchImpl: fetchImpl as typeof fetch, config: testConfig })
    ).rejects.toMatchObject({ name: "SheetsApiError" });
  });
});
