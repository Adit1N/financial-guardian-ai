import { strict as assert } from "node:assert";
import { importTransactionsCsv } from "../src/index";

const header =
  "id,date,description,amount,currency,type,category,status";

const validRow =
  "txn-001,2026-11-01,Client payment,25000.00,INR,income,Freelance income,posted";

const validCsv = `${header}\n${validRow}`;

const transactions = importTransactionsCsv(validCsv);

assert.equal(transactions.length, 1);
assert.equal(transactions[0].amountPaise, 2_500_000);

// A file needs at least one transaction.
assert.throws(() => importTransactionsCsv(header));

// Transaction IDs must be unique.
assert.throws(() =>
  importTransactionsCsv(`${header}\n${validRow}\n${validRow}`)
);

// Dates must exist in the calendar.
assert.throws(() =>
  importTransactionsCsv(
    validCsv.replace("2026-11-01", "2026-02-30")
  )
);

// Amounts must be positive.
assert.throws(() =>
  importTransactionsCsv(validCsv.replace("25000.00", "-100.00"))
);

// Rupee amounts support at most two decimal places.
assert.throws(() =>
  importTransactionsCsv(validCsv.replace("25000.00", "100.123"))
);

// This importer supports INR.
assert.throws(() =>
  importTransactionsCsv(validCsv.replace(",INR,", ",USD,"))
);

// Required values must be present.
assert.throws(() =>
  importTransactionsCsv(validCsv.replace("Client payment", ""))
);

console.log("Valid CSV import and all seven rejection checks passed.");