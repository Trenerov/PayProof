import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getInvoice, type Invoice } from "../api/invoices";
import { CopyRow } from "../components/CopyRow";
import { InvoiceQR } from "../components/InvoiceQR";
import { StatusBadge } from "../components/StatusBadge";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const satsToBtc = (amountSats: string) => {
  const value = BigInt(amountSats);
  const whole = value / 100_000_000n;
  const fraction = (value % 100_000_000n).toString().padStart(8, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
};

export const InvoicePage = () => {
  const { id = "" } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const load = async () => {
      try {
        const nextInvoice = await getInvoice(id);
        if (cancelled) {
          return;
        }

        setInvoice(nextInvoice);
        setError(null);
        if (nextInvoice.status !== "PAID" && nextInvoice.status !== "EXPIRED") {
          timer = window.setTimeout(load, 7000);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load invoice");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [id]);

  if (error) {
    return (
      <section className="panel">
        <p className="error-box">{error}</p>
        <Link to="/" className="text-link">
          Back to create form
        </Link>
      </section>
    );
  }

  if (!invoice) {
    return (
      <section className="panel">
        <p>Loading invoice…</p>
      </section>
    );
  }

  return (
    <section className="invoice-view">
      <div className="panel invoice-overview">
        <div className="invoice-head">
          <div>
            <p className="eyebrow">Public invoice</p>
            <h1>{invoice.amountDisplay} BTC</h1>
            <p className="muted">Expires {formatDateTime(invoice.expiresAt)}</p>
          </div>
          <StatusBadge
            status={invoice.status}
            confirmations={invoice.confirmations}
            minConfirmations={invoice.minConfirmations}
          />
        </div>

        {invoice.memo ? <p className="memo-box">{invoice.memo}</p> : null}

        <div className="metric-grid">
          <article className="metric-card">
            <span className="field-label">Expected</span>
            <strong>{invoice.amountDisplay} BTC</strong>
            <span>{invoice.expectedAmountSats} sats</span>
          </article>
          <article className="metric-card">
            <span className="field-label">Received</span>
            <strong>{satsToBtc(invoice.receivedAmountSats)} BTC</strong>
            <span>{invoice.receivedAmountSats} sats</span>
          </article>
        </div>

        <CopyRow label="Recipient address" value={invoice.recipientAddress} />
        <CopyRow label="Share link" value={invoice.shareUrl} />
        <CopyRow label="Payment URI" value={invoice.qrPayload} />
        {invoice.matchedTxId ? (
          <CopyRow label="Matched tx" value={invoice.matchedTxId} href={invoice.explorerTxUrl} />
        ) : null}

        <div className="invoice-foot">
          <Link to="/" className="text-link">
            Create another invoice
          </Link>
          {invoice.paidAt ? <span className="muted">Paid at {formatDateTime(invoice.paidAt)}</span> : null}
        </div>
      </div>

      <aside className="panel qr-panel">
        <InvoiceQR value={invoice.qrPayload} />
        <p className="field-label">Scan to pay</p>
        <p className="muted">
          Status refreshes automatically against OP_NET-compatible backend data until the invoice reaches `PAID` or `EXPIRED`.
        </p>
      </aside>
    </section>
  );
};
