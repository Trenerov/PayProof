import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInvoice } from "../api/invoices";

const expiryOptions = [
  { label: "15 min", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 }
];

export const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    recipientAddress: "",
    amountBtc: "",
    memo: "",
    expiresInMinutes: 60,
    minConfirmations: 1
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const invoice = await createInvoice(form);
      navigate(`/i/${invoice.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create invoice");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="panel hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">MVP invoice flow</p>
        <h1>Publish a payment page that confirms itself.</h1>
        <p className="hero-text">
          Generate a public OP_NET invoice page with a shareable link, QR code, and automatic status tracking.
        </p>
      </div>

      <form className="invoice-form" onSubmit={onSubmit}>
        <label>
          <span>Recipient address</span>
          <input
            value={form.recipientAddress}
            onChange={(event) => setForm((current) => ({ ...current, recipientAddress: event.target.value }))}
            placeholder="opt1... / opnet1..."
            required
          />
        </label>

        <label>
          <span>Amount (BTC)</span>
          <input
            value={form.amountBtc}
            onChange={(event) => setForm((current) => ({ ...current, amountBtc: event.target.value }))}
            placeholder="0.001"
            required
          />
        </label>

        <label>
          <span>Memo</span>
          <input
            value={form.memo}
            onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
            placeholder="Optional note"
          />
        </label>

        <div className="field-grid">
          <label>
            <span>Expiry</span>
            <select
              value={form.expiresInMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, expiresInMinutes: Number(event.target.value) }))
              }
            >
              {expiryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Min confirmations</span>
            <select
              value={form.minConfirmations}
              onChange={(event) =>
                setForm((current) => ({ ...current, minConfirmations: Number(event.target.value) }))
              }
            >
              {[0, 1, 2, 3].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="error-box">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </section>
  );
};
