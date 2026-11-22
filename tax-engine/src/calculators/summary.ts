import type { Transaction, FinancialSummary } from "../types";

export function calculateSummary(
  transactions: Transaction[]
): FinancialSummary {
  let incomePaise = 0;
  let expensePaise = 0;

  const seenIds = new Set<string>();

  for (const transaction of transactions) {
    if (seenIds.has(transaction.id)) {
      throw new Error(`Duplicate transaction ID: ${transaction.id}`);
    }

    seenIds.add(transaction.id);

    if (
      transaction.currency !== "INR" ||
      !Number.isSafeInteger(transaction.amountPaise) ||
      transaction.amountPaise <= 0
    ) {
      throw new Error(`Invalid amount or currency: ${transaction.id}`);
    }

    if (transaction.status === "pending") {
      continue;
    }

    if (transaction.type === "income") {
      incomePaise += transaction.amountPaise;
    } else if (transaction.type === "expense") {
      expensePaise += transaction.amountPaise;
    }

    if (
      !Number.isSafeInteger(incomePaise) ||
      !Number.isSafeInteger(expensePaise)
    ) {
      throw new Error("Transaction totals exceed the supported range");
    }
  }

  return {
    incomePaise,
    expensePaise,
    netCashFlowPaise: incomePaise - expensePaise,
  };
}