import { parse } from "csv-parse/sync";
import type { Transaction } from "../types";

const expectedHeaders = [
  "id",
  "date",
  "description",
  "amount",
  "currency",
  "type",
  "category",
  "status",
];

export function importTransactionsCsv(csvText: string): Transaction[] {
  const rows: Record<string, string>[] = parse(csvText, {
    bom: true,
    trim: true,
    skip_empty_lines: true,
    columns: (headers: string[]) => {
      if (headers.join(",") !== expectedHeaders.join(",")) {
        throw new Error(
          `CSV headers must be: ${expectedHeaders.join(",")}`
        );
      }

      return headers;
    },
  });

  if (rows.length === 0) {
    throw new Error("The CSV contains no transactions");
  }

  const seenIds = new Set<string>();

  return rows.map((row, index): Transaction => {
    const label = `Transaction ${index + 1}`;

    if (expectedHeaders.some((header) => !row[header]?.trim())) {
      throw new Error(`${label}: required fields cannot be blank`);
    }

    if (seenIds.has(row.id)) {
      throw new Error(`${label}: duplicate ID ${row.id}`);
    }

    seenIds.add(row.id);

    const date = new Date(`${row.date}T00:00:00Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== row.date
    ) {
      throw new Error(`${label}: use a valid YYYY-MM-DD date`);
    }

    if (!/^\d+(\.\d{1,2})?$/.test(row.amount)) {
      throw new Error(`${label}: amount must look like 1500.00`);
    }

    const [rupees, fraction = ""] = row.amount.split(".");
    const amountPaise =
      Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      throw new Error(`${label}: amount must be positive and within range`);
    }

    if (row.currency !== "INR") {
      throw new Error(`${label}: currency must be INR`);
    }

    const type = row.type;

    if (type !== "income" && type !== "expense" && type !== "transfer") {
      throw new Error(`${label}: invalid transaction type`);
    }

    const status = row.status;

    if (status !== "posted" && status !== "pending") {
      throw new Error(`${label}: status must be posted or pending`);
    }

    return {
      id: row.id,
      date: row.date,
      description: row.description,
      amountPaise,
      currency: "INR",
      type,
      category: row.category,
      status,
    };
  });
}