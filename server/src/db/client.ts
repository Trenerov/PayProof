import path from "node:path";
import { createClient } from "@libsql/client";
import { config } from "../config.js";

const defaultFileUrl = `file:${path.resolve(process.cwd(), config.sqliteFile)}`;

export const db = createClient({
  url: config.databaseUrl ?? defaultFileUrl,
  authToken: config.databaseAuthToken
});

let initialized = false;
let initPromise: Promise<void> | null = null;

export const initDb = async () => {
  if (initialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    await db.batch(
      [
        {
          sql: `
            CREATE TABLE IF NOT EXISTS invoices (
              id TEXT PRIMARY KEY,
              createdAt TEXT NOT NULL,
              createdAtBlockHeight INTEGER,
              updatedAt TEXT NOT NULL,
              expiresAt TEXT NOT NULL,
              recipientAddress TEXT NOT NULL,
              assetType TEXT NOT NULL,
              amountSats TEXT NOT NULL,
              amountDisplay TEXT NOT NULL,
              memo TEXT,
              status TEXT NOT NULL,
              minConfirmations INTEGER NOT NULL,
              matchedTxId TEXT,
              matchedAmountSats TEXT,
              confirmations INTEGER,
              paidAt TEXT
            )
          `
        },
        {
          sql: `
            CREATE INDEX IF NOT EXISTS idx_invoices_status_expires_at
            ON invoices (status, expiresAt)
          `
        }
      ],
      "write"
    );

    initialized = true;
    initPromise = null;
  })();

  return initPromise;
};
