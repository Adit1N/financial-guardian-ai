import type { Transaction } from "../types";
import { calculateSummary } from "./summary";

interface ForecastOptions {
  historyStart: string;
  historyEnd: string;
  forecastDays: number;
  currentBalancePaise: number;
}

function parseDate(value: string): number {
  const timestamp = Date.parse(`${value}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`Invalid date: ${value}`);
  }

  return timestamp;
}

export function calculateForecast(
  transactions: Transaction[],
  options: ForecastOptions
) {
  const start = parseDate(options.historyStart);
  const end = parseDate(options.historyEnd);

  if (end < start) {
    throw new Error("History end must be on or after history start.");
  }

  if (
    !Number.isSafeInteger(options.forecastDays) ||
    options.forecastDays <= 0
  ) {
    throw new Error("Forecast days must be a positive whole number.");
  }

  if (!Number.isSafeInteger(options.currentBalancePaise)) {
    throw new Error("Current balance must be a safe integer in paise.");
  }

  const history = transactions.filter((transaction) => {
    const date = parseDate(transaction.date);
    return date >= start && date <= end;
  });

  const hasCompletedActivity = history.some(
    (transaction) =>
      transaction.status === "posted" &&
      (transaction.type === "income" || transaction.type === "expense")
  );

  if (!hasCompletedActivity) {
    throw new Error("The selected period has no completed income or expenses.");
  }

  const summary = calculateSummary(history);
  const historyDays = (end - start) / 86_400_000 + 1;

  const projectedIncomePaise = Math.round(
    (summary.incomePaise / historyDays) * options.forecastDays
  );

  const projectedExpensePaise = Math.round(
    (summary.expensePaise / historyDays) * options.forecastDays
  );

  const projectedNetCashFlowPaise =
    projectedIncomePaise - projectedExpensePaise;

  const projectedBalancePaise =
    options.currentBalancePaise + projectedNetCashFlowPaise;

  const amounts = [
    projectedIncomePaise,
    projectedExpensePaise,
    projectedNetCashFlowPaise,
    projectedBalancePaise,
  ];

  if (!amounts.every(Number.isSafeInteger)) {
    throw new Error("Forecast amounts exceed the supported range.");
  }

  return {
    historyDays,
    forecastDays: options.forecastDays,
    projectedIncomePaise,
    projectedExpensePaise,
    projectedNetCashFlowPaise,
    projectedBalancePaise,
  };
}