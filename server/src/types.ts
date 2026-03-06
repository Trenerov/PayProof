export type InvoiceStatus = "UNPAID" | "PENDING" | "PAID" | "EXPIRED";
export type AssetType = "BTC";

export type InvoiceRecord = {
  id: string;
  createdAt: string;
  createdAtBlockHeight: number | null;
  updatedAt: string;
  expiresAt: string;
  recipientAddress: string;
  assetType: AssetType;
  amountSats: string;
  amountDisplay: string;
  memo: string | null;
  status: InvoiceStatus;
  minConfirmations: number;
  matchedTxId: string | null;
  matchedAmountSats: string | null;
  confirmations: number | null;
  paidAt: string | null;
};

export type InvoiceResponse = InvoiceRecord & {
  qrPayload: string;
  shareUrl: string;
  expectedAmountSats: string;
  receivedAmountSats: string;
  explorerTxUrl: string | null;
};
