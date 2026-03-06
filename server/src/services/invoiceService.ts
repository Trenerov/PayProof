import { z } from "zod";
import { config } from "../config.js";
import { invoiceRepository } from "../db/invoiceRepository.js";
import type { ChainTx } from "../chain/opnetAdapter.js";
import type { InvoiceRecord, InvoiceResponse, InvoiceStatus } from "../types.js";
import {
  buildQrPayload,
  btcToSats,
  createId,
  isLikelyOpNetAddress,
  nowIso,
  safeExplorerTxUrl
} from "../utils.js";

const createInvoiceSchema = z.object({
  recipientAddress: z
    .string()
    .trim()
    .min(1)
    .refine(isLikelyOpNetAddress, "Expected an OP_NET address"),
  amountBtc: z.string().trim(),
  memo: z.string().trim().max(280).optional().or(z.literal("")),
  expiresInMinutes: z.number().int().min(5).max(10080).optional(),
  minConfirmations: z.number().int().min(0).max(6).optional()
});

type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

const computeStatus = (
  invoice: InvoiceRecord,
  match: { txId: string; amountSats: string; confirmations: number } | null
): InvoiceStatus => {
  const expired = Date.now() > new Date(invoice.expiresAt).getTime();
  if (match) {
    return match.confirmations >= invoice.minConfirmations ? "PAID" : "PENDING";
  }
  return expired ? "EXPIRED" : "UNPAID";
};

const getReceivedAmountForAddress = (tx: ChainTx, address: string) =>
  tx.outputs
    .filter((output) => output.address === address)
    .reduce((sum, output) => sum + BigInt(output.valueSats), 0n);

export const findMatchingTransaction = (invoice: InvoiceRecord, txs: ChainTx[]) => {
  const expected = BigInt(invoice.amountSats);

  for (const tx of txs) {
    if (
      invoice.createdAtBlockHeight !== null &&
      tx.blockNumber !== null &&
      tx.blockNumber < invoice.createdAtBlockHeight
    ) {
      continue;
    }

    const received = getReceivedAmountForAddress(tx, invoice.recipientAddress);
    if (received >= expected) {
      return {
        txId: tx.txId,
        amountSats: received.toString(),
        confirmations: tx.confirmations
      };
    }
  }

  return null;
};

const toResponse = (invoice: InvoiceRecord): InvoiceResponse => ({
  ...invoice,
  qrPayload: buildQrPayload(invoice.recipientAddress, invoice.amountDisplay, invoice.memo),
  shareUrl: `${config.frontendBaseUrl.replace(/\/$/, "")}/i/${invoice.id}`,
  expectedAmountSats: invoice.amountSats,
  receivedAmountSats: invoice.matchedAmountSats ?? "0",
  explorerTxUrl: safeExplorerTxUrl(invoice.matchedTxId)
});

export const invoiceService = {
  async createInvoice(input: unknown, currentBlockNumber: number) {
    const parsed = createInvoiceSchema.parse(input) as CreateInvoiceInput;
    const amountSats = btcToSats(parsed.amountBtc);
    if (BigInt(amountSats) <= 0n) {
      throw new Error("Amount must be greater than zero");
    }

    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + (parsed.expiresInMinutes ?? 60) * 60_000).toISOString();

    const invoice: InvoiceRecord = {
      id: createId(),
      createdAt,
      createdAtBlockHeight: currentBlockNumber,
      updatedAt: createdAt,
      expiresAt,
      recipientAddress: parsed.recipientAddress,
      assetType: "BTC",
      amountSats,
      amountDisplay: parsed.amountBtc,
      memo: parsed.memo?.trim() || null,
      status: "UNPAID",
      minConfirmations: parsed.minConfirmations ?? 1,
      matchedTxId: null,
      matchedAmountSats: null,
      confirmations: null,
      paidAt: null
    };

    return toResponse(await invoiceRepository.create(invoice));
  },
  async getInvoice(id: string) {
    const invoice = await invoiceRepository.findById(id);
    return invoice ? toResponse(invoice) : null;
  },
  async refreshInvoiceFromChain(invoice: InvoiceRecord, txs: ChainTx[]) {
    const match = findMatchingTransaction(invoice, txs);
    const nextStatus = computeStatus(invoice, match);
    const updatedAt = nowIso();
    const paidAt =
      nextStatus === "PAID" ? invoice.paidAt ?? updatedAt : invoice.paidAt;

    const updated: InvoiceRecord = {
      ...invoice,
      updatedAt,
      status: nextStatus,
      matchedTxId: match?.txId ?? null,
      matchedAmountSats: match?.amountSats ?? null,
      confirmations: match?.confirmations ?? null,
      paidAt
    };

    return invoiceRepository.update(updated);
  }
};
