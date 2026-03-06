import { db, initDb } from "./client.js";
import type { InvoiceRecord, InvoiceStatus } from "../types.js";

const selectFields = `
  id,
  createdAt,
  createdAtBlockHeight,
  updatedAt,
  expiresAt,
  recipientAddress,
  assetType,
  amountSats,
  amountDisplay,
  memo,
  status,
  minConfirmations,
  matchedTxId,
  matchedAmountSats,
  confirmations,
  paidAt
`;

const mapRow = (row: Record<string, unknown>): InvoiceRecord => ({
  id: String(row.id),
  createdAt: String(row.createdAt),
  createdAtBlockHeight:
    row.createdAtBlockHeight === null || row.createdAtBlockHeight === undefined
      ? null
      : Number(row.createdAtBlockHeight),
  updatedAt: String(row.updatedAt),
  expiresAt: String(row.expiresAt),
  recipientAddress: String(row.recipientAddress),
  assetType: "BTC",
  amountSats: String(row.amountSats),
  amountDisplay: String(row.amountDisplay),
  memo: row.memo ? String(row.memo) : null,
  status: row.status as InvoiceStatus,
  minConfirmations: Number(row.minConfirmations),
  matchedTxId: row.matchedTxId ? String(row.matchedTxId) : null,
  matchedAmountSats: row.matchedAmountSats ? String(row.matchedAmountSats) : null,
  confirmations: row.confirmations === null || row.confirmations === undefined ? null : Number(row.confirmations),
  paidAt: row.paidAt ? String(row.paidAt) : null
});

type InvoiceInsert = InvoiceRecord;

export const invoiceRepository = {
  async create(invoice: InvoiceInsert) {
    await initDb();
    await db.execute({
      sql: `
        INSERT INTO invoices (
          id, createdAt, createdAtBlockHeight, updatedAt, expiresAt, recipientAddress, assetType,
          amountSats, amountDisplay, memo, status, minConfirmations,
          matchedTxId, matchedAmountSats, confirmations, paidAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        invoice.id,
        invoice.createdAt,
        invoice.createdAtBlockHeight,
        invoice.updatedAt,
        invoice.expiresAt,
        invoice.recipientAddress,
        invoice.assetType,
        invoice.amountSats,
        invoice.amountDisplay,
        invoice.memo,
        invoice.status,
        invoice.minConfirmations,
        invoice.matchedTxId,
        invoice.matchedAmountSats,
        invoice.confirmations,
        invoice.paidAt
      ]
    });
    return invoice;
  },
  async findById(id: string) {
    await initDb();
    const result = await db.execute({
      sql: `SELECT ${selectFields} FROM invoices WHERE id = ?`,
      args: [id]
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapRow(row) : null;
  },
  async findActive() {
    await initDb();
    const result = await db.execute(`
      SELECT ${selectFields}
      FROM invoices
      WHERE status IN ('UNPAID', 'PENDING')
      ORDER BY createdAt ASC
    `);
    return (result.rows as Record<string, unknown>[]).map(mapRow);
  },
  async update(invoice: InvoiceRecord) {
    await initDb();
    await db.execute({
      sql: `
        UPDATE invoices
        SET updatedAt = ?,
            createdAtBlockHeight = ?,
            expiresAt = ?,
            recipientAddress = ?,
            assetType = ?,
            amountSats = ?,
            amountDisplay = ?,
            memo = ?,
            status = ?,
            minConfirmations = ?,
            matchedTxId = ?,
            matchedAmountSats = ?,
            confirmations = ?,
            paidAt = ?
        WHERE id = ?
      `,
      args: [
        invoice.updatedAt,
        invoice.createdAtBlockHeight,
        invoice.expiresAt,
        invoice.recipientAddress,
        invoice.assetType,
        invoice.amountSats,
        invoice.amountDisplay,
        invoice.memo,
        invoice.status,
        invoice.minConfirmations,
        invoice.matchedTxId,
        invoice.matchedAmountSats,
        invoice.confirmations,
        invoice.paidAt,
        invoice.id
      ]
    });
    return invoice;
  }
};
