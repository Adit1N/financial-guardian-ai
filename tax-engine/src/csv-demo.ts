import { readFileSync } from "node:fs";
import { join } from "node:path";
import { importTransactionsCsv } from "./importers/csv";
import { calculateSummary } from "./calculators/summary";

try {
  const filePath = join(__dirname, "../data/transactions.csv");
  const csvText = readFileSync(filePath, "utf8");

  const transactions = importTransactionsCsv(csvText);
  const summary = calculateSummary(transactions);

  const rupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  });

  console.log(`Imported ${transactions.length} transactions`);
  console.log("Income:", rupees.format(summary.incomePaise / 100));
  console.log("Expenses:", rupees.format(summary.expensePaise / 100));
  console.log(
    "Net cash flow:",
    rupees.format(summary.netCashFlowPaise / 100)
  );
} catch (error) {
  console.error(
    "Import failed:",
    error instanceof Error ? error.message : String(error)
  );

  process.exitCode = 1;
}