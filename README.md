# PayProof

PayProof is a lightweight proof-of-payment app for OP_NET payment pages. It creates shareable invoice pages with QR codes and tracks payment state from `UNPAID` to `PAID` or `EXPIRED`.

## Apps

- `server`: Express API, SQLite storage, watcher, chain adapter abstraction
- `web`: React + Vite frontend for creating and viewing invoices

## Quick start

```bash
npm install
npm run dev:server
npm run dev:web
```

Server environment variables:

- `PORT` default `4000`
- `FRONTEND_BASE_URL` default `http://localhost:5173`
- `OPNET_NETWORK` one of `testnet`, `mainnet`, `regtest` default `testnet`
- `OPNET_RPC_URL` default derived from `OPNET_NETWORK`
- `DATABASE_URL` optional. If omitted locally, the app uses `file:.../server/data/payproof.sqlite`
- `DATABASE_AUTH_TOKEN` optional auth token for remote libSQL/Turso
- `WATCHER_INTERVAL_MS` default `15000`

The app uses the official OP_NET SDK and JSON-RPC provider to monitor native OP_NET P2OP addresses. By default it assumes testnet-style OP_NET addresses (`opt...`) and the inferred RPC host `https://testnet.opnet.org`. If your environment uses a different node or only exposes `mainnet` / `regtest`, set `OPNET_NETWORK` and `OPNET_RPC_URL` explicitly.

## Vercel

The project is prepared for Vercel with:

- static frontend build from `web/dist`
- serverless API entrypoint in `api/[...route].ts`
- on-demand invoice refresh in `GET /api/invoices/:id`
- optional manual/cron watcher endpoint `POST /api/cron/watch`

Important:

- Do not use local SQLite on Vercel for production data. Use a remote `libSQL` / `Turso` database via `DATABASE_URL`.
- Vercel serverless functions do not keep a permanent `setInterval` worker alive. Because of that, invoice status refresh is performed on invoice reads, and `POST /api/cron/watch` can be used for scheduled refreshes if needed.

### Suggested Vercel env vars

- `FRONTEND_BASE_URL=https://<your-project>.vercel.app`
- `OPNET_NETWORK=testnet`
- `OPNET_RPC_URL=<your OP_NET RPC URL>`
- `DATABASE_URL=<your libsql/turso url>`
- `DATABASE_AUTH_TOKEN=<your libsql/turso auth token>`

### Deploy steps

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Set the Root Directory to the repository root.
4. Add the environment variables above in the Vercel dashboard.
5. Deploy.
6. After deploy, verify:
   - `/api/health`
   - invoice creation on `/`
   - public invoice page `/i/:id`
