import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { cronRouter } from "./routes/cron.js";
import { invoicesRouter } from "./routes/invoices.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    network: config.opnetNetwork,
    chainApiBaseUrl: config.opnetRpcUrl,
    databaseUrl: config.databaseUrl ?? `file:${config.sqliteFile}`
  });
});

app.use("/api/invoices", invoicesRouter);
app.use("/api/cron", cronRouter);
