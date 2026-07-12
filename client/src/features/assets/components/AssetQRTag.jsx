import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Tag, QrCode } from 'lucide-react';

/**
 * AssetQRTag
 *
 * Renders a QR code for the given asset and provides a print action.
 * REQ-AST-05: QR & Barcode Generation.
 *
 * @param {Object} props
 * @param {string} props.assetTag - e.g. "AF-0001"
 * @param {string} props.assetName - Display name of the asset
 * @param {string} props.assetId - UUID for building the QR payload URL
 */
export const AssetQRTag = ({ assetTag, assetName, assetId }) => {
  const printRef = useRef(null);

  // QR payload: link to the asset's detail page
  const qrValue = `${window.location.origin}/assets/${assetId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    if (!printWindow) return;

    const svgContent = printRef.current?.querySelector('svg')?.outerHTML ?? '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Label — ${assetTag}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
              padding: 24px;
            }
            .label {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
              max-width: 260px;
              width: 100%;
            }
            .org-name {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #666;
            }
            .asset-tag {
              font-size: 22px;
              font-weight: 900;
              font-family: monospace;
              color: #000;
              letter-spacing: 2px;
            }
            .asset-name {
              font-size: 11px;
              text-align: center;
              color: #333;
              max-width: 200px;
            }
            .qr-container svg {
              display: block;
            }
            @media print {
              body { background: #fff; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <span class="org-name">AssetFlow</span>
            <div class="qr-container">${svgContent}</div>
            <span class="asset-tag">${assetTag}</span>
            <span class="asset-name">${assetName}</span>
          </div>
          <script>window.onload = () => window.print();<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Display Card */}
      <div
        className="bg-white rounded-xl p-5 shadow-lg flex flex-col items-center gap-3"
        ref={printRef}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
          <QrCode size={12} />
          AssetFlow
        </div>

        <QRCodeSVG
          value={qrValue}
          size={140}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#0f0f0f"
        />

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-mono text-lg font-black text-zinc-900 tracking-widest">
            {assetTag}
          </span>
          <span className="text-[10px] text-zinc-500 text-center max-w-36 leading-tight">
            {assetName}
          </span>
        </div>
      </div>

      {/* Label info */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Tag size={11} />
        <span className="font-mono">{assetTag}</span>
      </div>

      {/* Print action */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface/80 hover:border-primary/40 transition-all"
      >
        <Printer size={13} />
        Print Label
      </button>
    </div>
  );
};

export default AssetQRTag;
