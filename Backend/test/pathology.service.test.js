import { describe, it, expect } from "vitest";
import {
  resolveRange,
  formatRange,
  computeFlag,
  evaluateFormula,
  pendingReferrals,
  computeVials,
  recalcReportPanels,
} from "../services/pathology.service.js";

describe("resolveRange", () => {
  const ranges = [
    { sex: "any", minAgeYears: null, maxAgeYears: null, low: 4, high: 10, display: null },
    { sex: "male", minAgeYears: 18, maxAgeYears: 60, low: 13, high: 17, display: null },
    { sex: "female", minAgeYears: 18, maxAgeYears: 60, low: 12, high: 15, display: null },
  ];
  const parameter = { ranges };

  it("prefers the most specific sex + age-window match", () => {
    const r = resolveRange(parameter, { sex: "male", age: 30, ageUnit: "years" });
    expect(r).toEqual(ranges[1]);
  });

  it("falls back to the catch-all range when age is outside every window", () => {
    const r = resolveRange(parameter, { sex: "male", age: 5, ageUnit: "years" });
    expect(r).toEqual(ranges[0]);
  });

  it("falls back to the catch-all when age is unknown", () => {
    const r = resolveRange(parameter, { sex: "male", age: null });
    expect(r).toEqual(ranges[0]);
  });

  it("returns null when the parameter has no ranges", () => {
    expect(resolveRange({ ranges: [] }, { sex: "male", age: 30 })).toBeNull();
  });

  it("converts months and days to years before matching", () => {
    const infant = [{ sex: "any", minAgeYears: 0, maxAgeYears: 1, low: 1, high: 2, display: null }];
    const r = resolveRange({ ranges: infant }, { sex: "male", age: 6, ageUnit: "months" });
    expect(r).toEqual(infant[0]);
  });
});

describe("formatRange", () => {
  it("prefers an explicit display string", () => {
    expect(formatRange({ display: "Nil - Trace", low: null, high: null })).toBe("Nil - Trace");
  });
  it("renders a bounded range", () => {
    expect(formatRange({ low: 4, high: 10 })).toBe("4 - 10");
  });
  it("renders a floor-only range", () => {
    expect(formatRange({ low: 4, high: null })).toBe("> 4");
  });
  it("renders a ceiling-only range", () => {
    expect(formatRange({ low: null, high: 10 })).toBe("< 10");
  });
  it("returns empty string for no range", () => {
    expect(formatRange(null)).toBe("");
  });
});

describe("computeFlag", () => {
  const range = { low: 4, high: 10 };

  it("flags a value inside the range as normal", () => {
    expect(computeFlag(7, range)).toBe("normal");
  });
  it("flags a value above the range as high", () => {
    expect(computeFlag(11, range)).toBe("high");
  });
  it("escalates to critical_high beyond 1.5x the band width past the ceiling", () => {
    // span = 6, high + span*0.5 = 13
    expect(computeFlag(14, range)).toBe("critical_high");
    expect(computeFlag(13, range)).toBe("high");
  });
  it("flags a value below the range as low, escalating to critical_low", () => {
    expect(computeFlag(3, range)).toBe("low");
    expect(computeFlag(0, range)).toBe("critical_low");
  });
  it("never flags free-text or options fields", () => {
    expect(computeFlag(11, range, "text")).toBe("");
    expect(computeFlag(11, range, "options")).toBe("");
  });
  it("returns empty string for an empty value", () => {
    expect(computeFlag(null, range)).toBe("");
    expect(computeFlag("", range)).toBe("");
  });
  it("returns empty string when there is no range to check against", () => {
    expect(computeFlag(11, null)).toBe("");
  });
});

describe("evaluateFormula", () => {
  it("evaluates arithmetic over sibling parameter codes", () => {
    expect(evaluateFormula("(HB / PCV) * 100", { HB: 15, PCV: 45 })).toBeCloseTo(33.333, 2);
  });

  it("refuses to evaluate when a referenced code is missing/non-numeric", () => {
    expect(evaluateFormula("HB + PCV", { HB: 15 })).toBeNull();
  });

  it("rejects anything that survives substitution but isn't arithmetic", () => {
    // A malicious/malformed formula: after substitution this still contains
    // letters, so the character-class guard must reject it before Function().
    expect(evaluateFormula("HB; process.exit(1)", { HB: 15 })).toBeNull();
  });

  it("returns null for a blank formula", () => {
    expect(evaluateFormula("", {})).toBeNull();
    expect(evaluateFormula(null, {})).toBeNull();
  });
});

describe("pendingReferrals", () => {
  const inHouse = { isInHouse: true, referral: { status: "not_applicable" } };
  const verified = { isInHouse: false, referral: { status: "verified" } };
  const awaiting = { isInHouse: false, referral: { status: "awaiting_report" } };
  const uploaded = { isInHouse: false, referral: { status: "uploaded" } };

  it("returns an empty array when every referred panel is verified", () => {
    expect(pendingReferrals([inHouse, verified])).toEqual([]);
  });

  it("flags referred panels that are not yet verified", () => {
    expect(pendingReferrals([inHouse, awaiting, uploaded, verified])).toEqual([awaiting, uploaded]);
  });

  it("ignores in-house panels entirely", () => {
    expect(pendingReferrals([inHouse])).toEqual([]);
  });

  it("returns an empty array for a report with no panels", () => {
    expect(pendingReferrals([])).toEqual([]);
    expect(pendingReferrals()).toEqual([]);
  });
});

describe("computeVials", () => {
  it("groups panels by container and collects their codes", () => {
    const vials = computeVials([
      { code: "CBC", container: "EDTA" },
      { code: "ESR", container: "EDTA" },
      { code: "LFT", container: "Plain / Serum" },
    ]);
    expect(vials).toHaveLength(2);
    const edta = vials.find((v) => v.containerType === "EDTA");
    expect(edta.panelCodes).toEqual(["CBC", "ESR"]);
    expect(edta.color).toBe("Lavender");
  });

  it("defaults an unlabelled container to Plain", () => {
    const vials = computeVials([{ code: "X" }]);
    expect(vials).toEqual([{ containerType: "Plain", color: "Red", count: 1, panelCodes: ["X"] }]);
  });
});

describe("recalcReportPanels", () => {
  it("recomputes a formula value from sibling results and rounds to its declared precision", () => {
    const panels = [
      {
        results: [
          { parameterCode: "HB", value: 15, valueType: "numeric" },
          { parameterCode: "PCV", value: 45, valueType: "numeric" },
          {
            parameterCode: "MCHC",
            value: null,
            valueType: "formula",
            formula: "(HB / PCV) * 100",
            decimals: 1,
            refLow: 30,
            refHigh: 36,
          },
        ],
      },
    ];
    recalcReportPanels(panels);
    expect(panels[0].results[2].value).toBe(33.3);
    expect(panels[0].results[2].flag).toBe("normal");
  });

  it("recomputes flags for plain numeric results against their frozen range", () => {
    const panels = [
      { results: [{ value: 2, valueType: "numeric", refLow: 4, refHigh: 10 }] },
    ];
    recalcReportPanels(panels);
    expect(panels[0].results[0].flag).toBe("low");
  });
});
