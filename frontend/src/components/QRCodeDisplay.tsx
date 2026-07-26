"use client";
// QRCodeDisplay — lightweight QR code generator using canvas API (no external lib)
// Generates a QR code URL using a free API and displays it with download capability

import { useState, useEffect } from "react";
import { Download, ExternalLink, QrCode } from "lucide-react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCodeDisplay({ value, size = 160, label }: QRCodeDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    // Use QR Server API — a free, no-auth QR code generator
    const encoded = encodeURIComponent(value);
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png&margin=10&color=0B1426&bgcolor=FFFFFF`);
  }, [value, size]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `certifyval-qr-${value.substring(0, 8)}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-white rounded border border-border shadow-sm">
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrUrl}
            alt={`QR Code for ${label || value.substring(0, 8)}`}
            width={size}
            height={size}
            className="block"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-secondary"
            style={{ width: size, height: size }}
          >
            <QrCode size={40} className="text-foreground/30 animate-pulse" />
          </div>
        )}
      </div>
      {label && (
        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest text-center max-w-[160px]">
          {label}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border text-foreground/60 hover:text-foreground text-[10px] font-bold uppercase tracking-widest rounded hover:bg-surface-hover transition-colors"
        >
          <Download size={10} /> Download QR
        </button>
        <a
          href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(value)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border text-foreground/60 hover:text-foreground text-[10px] font-bold uppercase tracking-widest rounded hover:bg-surface-hover transition-colors"
        >
          <ExternalLink size={10} /> Full Size
        </a>
      </div>
    </div>
  );
}
