import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { analyzeFinances } from "./index";

try {
  const csvText = readFileSync(
    join(__dirname, "../data/transactions.csv"),
    "utf8"
  );

  const result = analyzeFinances({
    csvText,
    forecast: {
      historyStart: "2026-11-01",
      historyEnd: "2026-11-05",
      forecastDays: 30,
      currentBalancePaise: 1_000_000,
    },
    tax: {
      taxYear: "2026-27",
      regime: "new",
      residentIndividual: true,
      hasSpecialRateIncome: false,
      annualTaxableIncomePaise: 160_000_000,
    },
  });

  assert.equal(result.transactionCount, 5);
  assert.equal(result.summary.expensePaise, 250_000);
  assert.equal(result.deductionReview.length, 2);
  assert.equal(result.forecast.projectedBalancePaise, 14_500_000);
  assert.equal(result.taxEstimate.estimatedTaxPaise, 12_480_000);

  console.log(JSON.stringify(result, null, 2));
  console.log("Combined financial analysis checks passed.");
} catch (error) {
  console.error(
    "Analysis failed:",
    error instanceof Error ? error.message : String(error)
  );

  process.exitCode = 1;
}