import { config } from "./config.js";
import { app } from "./app.js";
import { chainAdapter } from "./services/opnetClient.js";
import { createInvoiceWatcher } from "./workers/invoiceWatcher.js";

const watcher = createInvoiceWatcher(chainAdapter, config.watcherIntervalMs);
if (!config.isVercel) {
  watcher.start();
}

app.listen(config.port, () => {
  console.log(`PayProof server listening on http://localhost:${config.port}`);
});
