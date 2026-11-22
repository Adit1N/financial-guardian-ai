import type { Transaction } from "../types";
import { calculateSummary } from "./summary";

export function calculateExpenseBreakdown(
  transactions: Transaction[]
) {
  // Validate the transactions using the existing summary logic.
  calculateSummary(transactions);

  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (
      transaction.status !== "posted" ||
      transaction.type !== "expense"
    ) {
      continue;
    }

    const category = transaction.category.trim() || "Uncategorized";
    const previousTotal = totals.get(category) ?? 0;

    totals.set(category, previousTotal + transaction.amountPaise);
  }

  return Array.from(totals, ([category, amountPaise]) => ({
    category,
    amountPaise,
  })).sort((first, second) => second.amountPaise - first.amountPaise);
}