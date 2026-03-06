import type { InvoiceStatus } from "../api/invoices";

const labels: Record<InvoiceStatus, string> = {
  UNPAID: "Unpaid",
  PENDING: "Pending",
  PAID: "Paid",
  EXPIRED: "Expired"
};

export const StatusBadge = ({
  status,
  confirmations,
  minConfirmations
}: {
  status: InvoiceStatus;
  confirmations: number | null;
  minConfirmations: number;
}) => (
  <div className={`status-badge status-${status.toLowerCase()}`}>
    <span>{labels[status]}</span>
    {status === "PENDING" ? (
      <span className="status-meta">
        {confirmations ?? 0}/{minConfirmations} conf
      </span>
    ) : null}
  </div>
);
