import type { Transaction } from "../types";
import { calculateSummary } from "./summary";

export interface DeductionReviewItem {
  transactionId: string;
  date: string;
  description: string;
  category: string;
  amountPaise: number;
  status: "needs_review";
  reviewPrompt: string;
}

export function buildDeductionReview(
  transactions: Transaction[]
): DeductionReviewItem[] {
  calculateSummary(transactions);

  return transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.status === "posted"
    )
    .map((transaction) => {
      const category = transaction.category.trim() || "Uncategorized";

      let reviewPrompt =
        "Describe the business purpose and provide a receipt or invoice.";

      if (category.toLowerCase() === "software") {
        reviewPrompt =
          "Confirm how this software supports your work and retain the invoice.";
      }

      if (category.toLowerCase() === "internet") {
        reviewPrompt =
          "Confirm the business-use percentage and retain the internet bill.";
      }

      return {
        transactionId: transaction.id,
        date: transaction.date,
        description: transaction.description,
        category,
        amountPaise: transaction.amountPaise,
        status: "needs_review",
        reviewPrompt,
      };
    });
}