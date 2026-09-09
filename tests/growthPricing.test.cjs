const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");
const source = fs.readFileSync(
  path.join(__dirname, "../src/utils/growthPricing.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const context = { exports: {} };
vm.runInNewContext(compiled.outputText, context);
const { estimateGrowthPricing, formatPhp } = context.exports;
test("minimum can be disabled or configured independently of allowance", () => {
  assert.equal(estimateGrowthPricing(5, 10, 19, 0).monthlyPesos, 0);
  assert.equal(estimateGrowthPricing(5, 10, 19, 1).monthlyPesos, 19);
  assert.equal(estimateGrowthPricing(25, 10, 19, 1).monthlyPesos, 285);
});
test("configured rates preserve centavos", () => {
  assert.equal(estimateGrowthPricing(11, 10, 19.5).monthlyPesos, 19.5);
  assert.equal(formatPhp(19.5), "₱19.5");
  assert.equal(formatPhp(19.55), "₱19.55");
});
test("first ten employees are free; additional employees cost nineteen pesos", () => {
  for (const [employees, monthly] of [
    [1, 0],
    [10, 0],
    [11, 19],
    [25, 285],
    [50, 760],
    [100, 1710],
    [200, 3610],
  ]) {
    assert.equal(estimateGrowthPricing(employees).monthlyPesos, monthly);
    assert.equal(
      estimateGrowthPricing(String(employees)).monthlyPesos,
      monthly,
    );
  }
});
test("invalid headcounts do not produce misleading estimates", () => {
  for (const value of ["", "abc", 0, -1, 10.5, Infinity, NaN, 100001]) {
    assert.equal(estimateGrowthPricing(value), null);
  }
});
test("amounts use pesos and thousands separators", () => {
  assert.equal(formatPhp(1710), "₱1,710");
});
