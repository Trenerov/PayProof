# Implementation Plan — PayProof (Proof-of-Payment Pages for OP_NET / Bitcoin L1)

## 1) Goal
Build a lightweight app on OP_NET (Bitcoin L1) that lets users create a shareable payment invoice page (link + QR) and automatically tracks payment status (unpaid → pending confirmations → paid / expired). No private keys. Read-only monitoring.

## 2) Scope (MVP)
### Must-have
- Create invoice (recipient address, asset BTC, amount, memo optional, expiry, minConfirmations).
- Public invoice page `/i/:id` with:
  - Amount + address (copy buttons)
  - QR payload
  - Status badge (UNPAID / PENDING / PAID / EXPIRED)
  - Matched txId + confirmations + received vs expected
- Backend watcher that updates invoice status by monitoring transactions to the address.
- Storage (SQLite recommended).
- Frontend polling (no SSE required).

### Nice-to-have (only if time)
- Partial payments visualization (received X/Y)
- Webhook on PAID
- OP_20 invoices (second phase)

## 3) Tech assumptions
- Existing repo uses React/Vite on frontend and Node/Express on backend (adjust if different).
- Use SQLite + Prisma (or Drizzle) for fast setup.
- Chain reads via an OP_NET-compatible explorer/RPC/SDK:
  - `getTxsByAddress(address)` returning recent txs and their outputs + confirmations (or blockHeight).
  - If confirmations not returned, derive via current height - tx height.

## 4) Data model

### Table: `invoices`
Fields:
- `id` (string, cuid/uuid, primary key)
- `createdAt` (datetime)
- `updatedAt` (datetime)
- `expiresAt` (datetime)
- `recipientAddress` (string)
- `assetType` (enum: `BTC`)  // MVP
- `amountSats` (string)      // store as string to avoid JS bigint issues in DB/JSON
- `amountDisplay` (string)   // e.g. "0.001"
- `memo` (string, nullable)
- `status` (enum: `UNPAID | PENDING | PAID | EXPIRED`)
- `minConfirmations` (int, default 1 or 2)
- `matchedTxId` (string, nullable)
- `matchedAmountSats` (string, nullable)
- `confirmations` (int, nullable)
- `paidAt` (datetime, nullable)

Optional table (can be skipped MVP):
- `invoice_events` or `invoice_matches` for history.

## 5) Status rules

- `EXPIRED`: now > expiresAt AND status not PAID
- `UNPAID`: no matching payment tx found
- `PENDING`: matching tx found but confirmations < minConfirmations
- `PAID`: matching tx found and confirmations >= minConfirmations AND matchedAmountSats >= amountSats

Matching BTC:
- Find tx outputs paying to `recipientAddress`
- Sum all outputs to that address within the tx
- If sum >= amountSats → match candidate
- Prefer earliest tx after invoice.createdAt (or highest value tx); keep first valid match.

Edge case policy:
- Multi-tx payments: MVP can accept “single tx pays full amount”. (Optional: sum multiple txs after createdAt).
- Late payment after expiry: MVP still marks PAID but show “Paid after expiry” flag (optional).

## 6) Backend API

### POST `/api/invoices`
Request JSON:
- `recipientAddress: string`
- `amountBtc: string` (decimal string, e.g. "0.001")
- `memo?: string`
- `expiresInMinutes?: number` (default 60)
- `minConfirmations?: number` (default 1 or 2)

Validation:
- address non-empty and matches OP_NET/Bitcoin address format (basic regex or SDK validation)
- amount > 0
- expiresInMinutes within [5..10080] (5 min .. 7 days)
- minConfirmations within [0..6] (or [1..6])

Response:
- `id`
- `shareUrl` (frontend base + `/i/${id}`)
- `qrPayload` (BIP21-style string: `bitcoin:<address>?amount=<amount>&message=<memo>` if memo present)
- `expiresAt`
- `status`

### GET `/api/invoices/:id`
Response:
- invoice fields + computed display:
  - `expectedAmountSats`, `receivedAmountSats`, `confirmations`, `status`, `matchedTxId`

## 7) Chain adapter interface (MVP)
Create `server/src/chain/opnetAdapter.ts`:

```ts
export type ChainTx = {
  txId: string;
  timestampMs: number;
  confirmations: number;
  outputs: Array<{ address: string; valueSats: string }>;
};

export interface ChainAdapter {
  getTxsByAddress(address: string, sinceMs?: number): Promise<ChainTx[]>;
}
```

Implement `getTxsByAddress` using OP_NET explorer/RPC/SDK available in the project (keep implementation isolated). If explorer returns different shape, map into `ChainTx`.

## 8) Watcher / Worker

### Schedule
- Run every 10–15 seconds.

### Logic
- Query DB: invoices where status in (UNPAID, PENDING) and now < expiresAt + grace (optional grace=0 for MVP)
- For each invoice:
  - if now > expiresAt and status != PAID → set EXPIRED and continue
  - txs = adapter.getTxsByAddress(recipientAddress, invoice.createdAt)
  - match = find tx where sum(outputs to address) >= expected amount
  - if no match → keep UNPAID
  - else:
    - set matchedTxId, matchedAmountSats, confirmations
    - status = confirmations >= minConfirmations ? PAID : PENDING
    - if status becomes PAID → set paidAt

### Concurrency
- Process sequentially (MVP) to avoid rate limits.
- Add basic in-memory lock to prevent overlapping runs.

## 9) Frontend UX

### Routes
- `/` Create Invoice page
- `/i/:id` Public Invoice page

### Create Invoice page
Components:
- Address input
- Amount input (BTC)
- Memo input (optional)
- Expiry select (15m, 1h, 6h, 24h)
- Min confirmations select (1,2,3)
- CTA "Create Invoice"
After create:
- Redirect to `/i/:id`

### Invoice page
- Display:
  - Amount
  - Recipient address (copy)
  - QR code
  - Status badge:
    - UNPAID (grey)
    - PENDING (yellow) with “x/y confirmations”
    - PAID (green)
    - EXPIRED (red)
  - Matched txId (copy + explorer link if available)
  - Received vs expected (optional)
- Polling:
  - fetch GET `/api/invoices/:id` every 5–10 seconds
  - stop polling on PAID/EXPIRED

QR:
- Use a QR library (e.g., `qrcode.react`) to render `qrPayload`.
- Also show raw payment URI for copy.

## 10) File/Folder structure (suggested)

Backend:
- `server/src/index.ts` (express bootstrap)
- `server/src/routes/invoices.ts`
- `server/src/db/prisma.ts` (or drizzle)
- `server/src/chain/opnetAdapter.ts`
- `server/src/services/invoiceService.ts` (matching logic)
- `server/src/workers/invoiceWatcher.ts`

Frontend:
- `src/pages/CreateInvoicePage.tsx`
- `src/pages/InvoicePage.tsx`
- `src/api/invoices.ts`
- `src/components/StatusBadge.tsx`
- `src/components/CopyRow.tsx`
- `src/components/InvoiceQR.tsx`
- `src/router.tsx` (or use existing AppRouter)

## 11) Acceptance Criteria (Definition of Done)

1) User can create invoice and receives shareable link + QR.
2) Invoice page loads publicly by ID and shows correct expected amount/address.
3) When a payment tx is made to the address for >= expected amount:
   - status becomes PENDING until confirmations reach minConfirmations
   - then becomes PAID and shows txId + confirmations
4) If expiry time passes without payment, status becomes EXPIRED.
5) No private keys are stored/used.
6) Basic validation prevents empty/invalid inputs.
7) Works end-to-end on OP_NET testnet with at least one real payment transaction.

## 12) Implementation order (fastest path)

Phase 1 (Day 1):
- DB schema + migrations
- POST/GET invoices endpoints
- Frontend create + invoice page (polling) with mocked status

Phase 2 (Day 2):
- OP_NET chain adapter: fetch txs by address + confirmations
- Matching logic + watcher loop
- End-to-end testnet flow

Phase 3 (Day 3, polish):
- Better UI, copy buttons, QR
- Partial payment display (optional)
- Explorer link (optional)
- Rate limiting (optional)

## 13) Notes / Simplifications
- MVP supports BTC only.
- Matching assumes single tx pays full amount.
- Address reuse is allowed; matching considers tx timestamp >= createdAt.
- If OP_NET explorer/RPC limits queries, reduce polling frequency and batch queries.
