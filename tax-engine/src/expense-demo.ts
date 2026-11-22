import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  importTransactionsCsv,
  calculateExpenseBreakdown,
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