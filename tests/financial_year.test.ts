import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getFinancialYear,
  getFYRange,
  getRelativeDateRange,
  getCurrentFinancialYear,
} from "../src/components/portal/utils";

test("calculates Indian Financial Year correctly across calendar years", () => {
  // April to December belongs to start year
  assert.equal(getFinancialYear("2026-04-01"), "FY 2026-27");
  assert.equal(getFinancialYear("2026-09-20"), "FY 2026-27");
  assert.equal(getFinancialYear("2026-12-31"), "FY 2026-27");

  // January to March belongs to previous calendar year's FY
  assert.equal(getFinancialYear("2027-01-01"), "FY 2026-27");
  assert.equal(getFinancialYear("2027-03-31"), "FY 2026-27");

  // Past years
  assert.equal(getFinancialYear("2025-05-10"), "FY 2025-26");
  assert.equal(getFinancialYear("2026-02-15"), "FY 2025-26");
  assert.equal(getFinancialYear("2024-04-01"), "FY 2024-25");
});

test("computes exact Indian FY date ranges", () => {
  const fy26 = getFYRange("FY 2026-27");
  assert.equal(fy26.start, "2026-04-01");
  assert.equal(fy26.end, "2027-03-31");

  const fy25 = getFYRange("FY 2025-26");
  assert.equal(fy25.start, "2025-04-01");
  assert.equal(fy25.end, "2026-03-31");
});

test("returns relative date ranges", () => {
  const thisMonth = getRelativeDateRange("this_month");
  assert.match(thisMonth.start, /^\d{4}-\d{2}-01$/);
  assert.match(thisMonth.end, /^\d{4}-\d{2}-\d{2}$/);

  const lastMonth = getRelativeDateRange("last_month");
  assert.match(lastMonth.start, /^\d{4}-\d{2}-01$/);
  assert.match(lastMonth.end, /^\d{4}-\d{2}-\d{2}$/);
});
