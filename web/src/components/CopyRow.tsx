import { useState } from "react";

type CopyRowProps = {
  label: string;
  value: string;
  href?: string | null;
};

export const CopyRow = ({ label, value, href }: CopyRowProps) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="copy-row">
      <div>
        <p className="field-label">{label}</p>
        <p className="mono break">{value}</p>
      </div>
      <div className="copy-actions">
        {href ? (
          <a href={href} className="ghost-button" target="_blank" rel="noreferrer">
            Open
          </a>
        ) : null}
        <button type="button" className="ghost-button" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};
