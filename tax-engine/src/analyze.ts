import { importTransactionsCsv } from "./importers/csv";
import { calculateSummary } from "./calculators/summary";
import { calculateExpenseBreakdown } from "./calculators/expense-breakdown";
import { buildDeductionReview } from "./calculators/deductions";
import { calculateForecast } from "./calculators/cashflow-forecast";
import { calculateIndiaTax } from "./calculators/india-tax";

import type { ForecastOptions } from "./calculators/cashflow-forecast";
import type { IndiaTaxInput } from "./calculators/india-tax";

export interface FinancialAnalysisInput {
  csvText: string;
  forecast: ForecastOptions;
  tax: IndiaTaxInput;
}

export function analyzeFinances(input: FinancialAnalysisInput) {
  const transactions = importTransactionsCsv(input.csvText);

  return {
    currency: "INR",
    amountUnit: "paise",
    transactionCount: transactions.length,
    summary: calculateSummary(transactions),
    expenseBreakdown: calculateExpenseBreakdown(transactions),
    deductionReview: buildDeductionReview(transactions),
    forecast: calculateForecast(transactions, input.forecast),
    taxEstimate: calculateIndiaTax(input.tax),
  };
}