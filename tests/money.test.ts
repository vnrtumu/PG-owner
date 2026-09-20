import { test } from "node:test";
import assert from "node:assert/strict";
import { paise, proratedRent, today } from "../src/lib/money";
test("money avoids floating point errors", () => {
  assert.equal(paise("1234.56"), 123456);
  assert.equal(paise("0.29"), 29);
  assert.equal(paise("1.1"), 110);
});
test("rejects invalid money", () => {
  for (const value of ["-1", "1.001", "NaN", "Infinity", "1e9", ""])
    assert.throws(() => paise(value));
});
test("proration handles leap year and last-day move-in", () => {
  assert.equal(proratedRent(290000, "2024-02-29", "2024-02"), 10000);
  assert.equal(proratedRent(300000, "2026-09-16", "2026-09"), 150000);
  assert.equal(proratedRent(300000, "2026-08-16", "2026-09"), 300000);
});
test("billing date uses a calendar-date format", () =>
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/));
