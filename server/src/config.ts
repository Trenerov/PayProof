const envNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const opnetNetwork = process.env.OPNET_NETWORK ?? "testnet";

const defaultRpcUrl = () => {
  switch (opnetNetwork) {
    case "mainnet":
      return "https://mainnet.opnet.org";
    case "regtest":
      return "https://regtest.opnet.org";
    case "testnet":
    default:
      return "https://testnet.opnet.org";
  }
};

export const config = {
  port: envNumber(process.env.PORT, 4000),
  frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? "http://localhost:5173",
  opnetNetwork,
  opnetRpcUrl: process.env.OPNET_RPC_URL ?? defaultRpcUrl(),
  watcherIntervalMs: envNumber(process.env.WATCHER_INTERVAL_MS, 15000),
  sqliteFile: process.env.SQLITE_FILE ?? "data/payproof.sqlite",
  databaseUrl: process.env.DATABASE_URL,
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN,
  isVercel: process.env.VERCEL === "1"
};
