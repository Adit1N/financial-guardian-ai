import type { Transaction } from "./types";
import { calculateSummary } from "./calculators/summary";

const transactions: Transaction[] = [
  {
    id: "txn-001",
    date: "2026-11-01",
    description: "Website project payment",
    amountPaise: 2500000,
    currency: "INR",
    type: "income",
    category: "Freelance income",
    status: "posted",
  },
  {
    id: "txn-002",
    date: "2026-11-02",
    description: "Design software subscription",
    amountPaise: 150000,
    currency: "INR",
    type: "expense",
    category: "Software",
    status: "posted",
  },
  {
    id: "txn-003",
    date: "2026-11-03",
    description: "Internet bill",
    amountPaise: 100000,
    currency: "INR",
    type: "expense",
    category: "Internet",
    status: "posted",
  },
];

const summary = calculateSummary(transactions);

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

console.log("Financial Guardian — Financial Summary");
console.log("Income:", rupees.format(summary.incomePaise / 100));
console.log("Expenses:", rupees.format(summary.expensePaise / 100));
console.log("Net cash flow:", rupees.format(summary.netCashFlowPaise / 100));