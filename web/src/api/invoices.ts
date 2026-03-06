export type InvoiceStatus = "UNPAID" | "PENDING" | "PAID" | "EXPIRED";

export type Invoice = {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  recipientAddress: string;
  assetType: "BTC";
  amountSats: string;
  amountDisplay: string;
  memo: string | null;
  status: InvoiceStatus;
  minConfirmations: number;
  matchedTxId: string | null;
  matchedAmountSats: string | null;
  confirmations: number | null;
  paidAt: string | null;
  qrPayload: string;
  shareUrl: string;
  expectedAmountSats: string;
  receivedAmountSats: string;
  explorerTxUrl: string | null;
};

export type CreateInvoiceRequest = {
  recipientAddress: string;
  amountBtc: string;
  memo?: string;
  expiresInMinutes?: number;
  minConfirmations?: number;
};

const parseResponse = async (response: Response) => {
  if (response.ok) {
    return response.json();
  }

  const payload = await response.json().catch(() => ({ message: "Request failed" }));
  const details = Array.isArray(payload.issues)
    ? payload.issues.map((issue: { message: string }) => issue.message).join(", ")
    : payload.message;
  throw new Error(details || "Request failed");
};

export const createInvoice = async (payload: CreateInvoiceRequest): Promise<Invoice> => {
  const response = await fetch("/api/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await fetch(`/api/invoices/${id}`);
  return parseResponse(response);
};
