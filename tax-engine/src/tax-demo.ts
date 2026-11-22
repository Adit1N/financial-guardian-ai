import { strict as assert } from "node:assert";
import { calculateIndiaTax } from "./index";

const cases = [
  { incomeRupees: 0, expectedTaxRupees: 0 },
  { incomeRupees: 400_000, expectedTaxRupees: 0 },
  { incomeRupees: 1_200_000, expectedTaxRupees: 0 },
  { incomeRupees: 1_210_000, expectedTaxRupees: 10_400 },
  { incomeRupees: 1_600_000, expectedTaxRupees: 124_800 },
  { incomeRupees: 5_000_000, expectedTaxRupees: 1_123_200 },
];

const results = cases.map((example) => {
  const result = calculateIndiaTax({
    taxYear: "2026-27",
    regime: "new",
    residentIndividual: true,
    hasSpecialRateIncome: false,
    annualTaxableIncomePaise: example.incomeRupees * 100,
  });

  assert.equal(
    result.estimatedTaxPaise,
    example.expectedTaxRupees * 100,
    `Unexpected tax for income ₹${example.incomeRupees}`
  );

  return {
    taxableIncomeRupees: example.incomeRupees,
    estimatedTaxRupees: result.estimatedTaxPaise / 100,
  };
});

console.table(results);
console.log("All six tax calculation checks passed.");