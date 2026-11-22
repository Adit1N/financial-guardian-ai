export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amountPaise: number; // Positive integer
  currency: "INR";
  type: "income" | "expense" | "transfer";
  category: string;
  status: "posted" | "pending";
}

export interface FinancialSummary {
  incomePaise: number;
  expensePaise: number;
  netCashFlowPaise: number;
}