import { config } from "./config.js";
import { app } from "./app.js";
import { getChainAdapter } from "./services/opnetClient.js";
import { createInvoiceWatcher } from "./workers/invoiceWatcher.js";

if (!config.isVercel) {
  void (async () => {
    const chainAdapter = await getChainAdapter();
    const watcher = createInvoiceWatcher(chainAdapter, config.watcherIntervalMs);
    watcher.start();
  })();
}

app.listen(config.port, () => {
  console.log(`PayProof server listening on http://localhost:${config.port}`);
});
