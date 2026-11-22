import { readFileSync } from "node:fs";
import { join } from "node:path";
import { importTransactionsCsv } from "./importers/csv";
import { calculateForecast } from "./calculators/cashflow-forecast";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

try {
  const csv = readFileSync(
    join(__dirname, "../data/transactions.csv"),
    "utf8"
  );

  const transactions = importTransactionsCsv(csv);

  const forecast = calculateForecast(transactions, {
    historyStart: "2026-11-01",
    historyEnd: "2026-11-05",
    forecastDays: 30,
    currentBalancePaise: 1_000_000, // Example current balance of ₹10,000
  });

  console.log(`History period: ${forecast.historyDays} days`);
  console.log(`Forecast period: ${forecast.forecastDays} days`);

  console.log(
    "Projected income:",
    rupees.format(forecast.projectedIncomePaise / 100)
  );

  console.log(
    "Projected expenses:",
    rupees.format(forecast.projectedExpensePaise / 100)
  );

  console.log(
    "Projected balance:",
    rupees.format(forecast.projectedBalancePaise / 100)
  );

  console.log("Assumption: the historical daily averages continue.");
} catch (error) {
  console.error(
    "Forecast failed:",
    error instanceof Error ? error.message : String(error)
  );

  process.exitCode = 1;
}