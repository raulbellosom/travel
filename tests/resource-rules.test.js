import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllowedCommercialModes,
  isAllowedCommercialMode,
} from "../src/utils/resourceTaxonomy.js";
import {
  getAllowedPricingModels,
  normalizePricingModel,
} from "../src/utils/resourceModel.js";

test("filters category -> commercialMode strictly by context", () => {
  assert.deepEqual(getAllowedCommercialModes("property", "house"), [
    "sale",
    "rent_long_term",
    "rent_short_term",
  ]);
  assert.equal(
    isAllowedCommercialMode("property", "house", "rent_hourly"),
    false,
  );
  assert.equal(
    isAllowedCommercialMode("venue", "event_hall", "rent_hourly"),
    true,
  );
});

test("vehicles never allow hourly rent", () => {
  assert.deepEqual(getAllowedCommercialModes("vehicle", "car"), [
    "sale",
    "rent_long_term",
    "rent_short_term",
  ]);
  assert.equal(
    isAllowedCommercialMode("vehicle", "car", "rent_hourly"),
    false,
  );
});

test("pricing models are filtered by full context", () => {
  assert.deepEqual(
    getAllowedPricingModels("vehicle", "rent_short_term", "car"),
    ["per_day"],
  );
  assert.deepEqual(
    getAllowedPricingModels("property", "rent_short_term", "land"),
    ["per_day", "fixed_total"],
  );
  assert.deepEqual(
    getAllowedPricingModels("property", "rent_short_term", "house"),
    ["per_night", "per_day", "fixed_total"],
  );
});

test("pricing model alias total resolves to fixed_total", () => {
  assert.equal(
    normalizePricingModel("total", "sale", "property", "house"),
    "fixed_total",
  );
  assert.equal(
    normalizePricingModel("fixed_total", "sale", "property", "house"),
    "fixed_total",
  );
});
