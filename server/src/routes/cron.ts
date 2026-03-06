import { Router } from "express";
import { chainAdapter } from "../services/opnetClient.js";
import { runWatcherOnce } from "../workers/invoiceWatcher.js";

export const cronRouter = Router();

cronRouter.post("/watch", async (_request, response) => {
  try {
    await runWatcherOnce(chainAdapter);
    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "Watcher run failed"
    });
  }
});
