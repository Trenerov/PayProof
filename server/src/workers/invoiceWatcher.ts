import { invoiceRepository } from "../db/invoiceRepository.js";
import type { ChainAdapter } from "../chain/opnetAdapter.js";
import { invoiceService } from "../services/invoiceService.js";

export const createInvoiceWatcher = (chainAdapter: ChainAdapter, intervalMs: number) => {
  let timer: NodeJS.Timeout | null = null;
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      const activeInvoices = await invoiceRepository.findActive();
      for (const invoice of activeInvoices) {
        const txs = await chainAdapter.getTxsByAddress(
          invoice.recipientAddress,
          invoice.createdAtBlockHeight ?? 0
        );
        await invoiceService.refreshInvoiceFromChain(invoice, txs);
      }
    } catch (error) {
      console.error("Invoice watcher failed", error);
    } finally {
      running = false;
    }
  };

  return {
    start() {
      if (timer) {
        return;
      }

      void tick();
      timer = setInterval(() => {
        void tick();
      }, intervalMs);
    },
    stop() {
      if (!timer) {
        return;
      }

      clearInterval(timer);
      timer = null;
    }
  };
};

export const runWatcherOnce = async (chainAdapter: ChainAdapter) => {
  const activeInvoices = await invoiceRepository.findActive();
  for (const invoice of activeInvoices) {
    const txs = await chainAdapter.getTxsByAddress(
      invoice.recipientAddress,
      invoice.createdAtBlockHeight ?? 0
    );
    await invoiceService.refreshInvoiceFromChain(invoice, txs);
  }
};
