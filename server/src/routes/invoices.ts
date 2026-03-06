import { Router } from "express";
import { ZodError } from "zod";
import { invoiceService } from "../services/invoiceService.js";
import { chainAdapter } from "../services/opnetClient.js";

export const invoicesRouter = Router();

invoicesRouter.post("/", async (request, response) => {
  try {
    const currentBlockNumber = await chainAdapter.getCurrentBlockNumber();
    const invoice = await invoiceService.createInvoice(request.body, currentBlockNumber);
    response.status(201).json(invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Validation failed",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
      return;
    }

    response.status(400).json({
      message: error instanceof Error ? error.message : "Failed to create invoice"
    });
  }
});

invoicesRouter.get("/:id", (request, response) => {
  void (async () => {
    const existingInvoice = await invoiceService.getInvoice(request.params.id);
    if (!existingInvoice) {
      response.status(404).json({ message: "Invoice not found" });
      return;
    }

    if (existingInvoice.status === "UNPAID" || existingInvoice.status === "PENDING") {
      const txs = await chainAdapter.getTxsByAddress(
        existingInvoice.recipientAddress,
        existingInvoice.createdAtBlockHeight ?? 0
      );
      await invoiceService.refreshInvoiceFromChain(existingInvoice, txs);
    }

    const invoice = await invoiceService.getInvoice(request.params.id);
    response.json(invoice);
  })().catch((error: unknown) => {
    response.status(500).json({
      message: error instanceof Error ? error.message : "Failed to load invoice"
    });
  });
});
