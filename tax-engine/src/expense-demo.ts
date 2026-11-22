import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  importTransactionsCsv,
  calculateExpenseBreakdown,
  buildDeductionReview,
} from "./index";

const csv = readFileSync(
  join(__dirname, "../data/transactions.csv"),
  "utf8"
);

const transactions = importTransactionsCsv(csv);
const breakdown = calculateExpenseBreakdown(transactions);

console.table(
  breakdown.map((item) => ({
    category: item.category,
    rupees: item.amountPaise / 100,
  }))
);

const deductionReview = buildDeductionReview(transactions);

console.log("\nExpenses requiring deduction review:");

console.table(
  deductionReview.map((item) => ({
    transaction: item.transactionId,
    category: item.category,
    rupees: item.amountPaise / 100,
    status: item.status,
    reviewPrompt: item.reviewPrompt,
  }))
);