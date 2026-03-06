import { QRCodeSVG } from "qrcode.react";

export const InvoiceQR = ({ value }: { value: string }) => (
  <div className="qr-card">
    <QRCodeSVG
      value={value}
      size={220}
      marginSize={1}
      bgColor="transparent"
      fgColor="#102019"
    />
  </div>
);
