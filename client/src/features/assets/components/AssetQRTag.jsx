import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Tag, QrCode } from 'lucide-react';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
 * @param {string} [props.companyName] - Organization/company name shown on label
 * @param {string} [props.categoryName] - Asset category
 * @param {string} [props.serialNumber] - Asset serial number
 * @param {string} [props.location] - Asset location
 * @param {string} [props.status] - Asset status
 */
export const AssetQRTag = ({
  assetTag,
  assetName,
  assetId,
  companyName = 'AssetFlow',
  categoryName,
  serialNumber,
  location,
  status,
}) => {
  const printRef = useRef(null);

  // QR payload: link to the asset's detail page
  const qrValue = `${window.location.origin}/assets/${assetId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    if (!printWindow) return;

    const svgContent =
      printRef.current?.querySelector('.asset-qr-svg')?.outerHTML ??
      printRef.current?.querySelector('svg:last-of-type')?.outerHTML ??
      '';
    const primaryToken = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim();
    const primaryColor = primaryToken ? `hsl(${primaryToken})` : '#6d28d9';
    const generatedAt = new Date().toLocaleString();
    const details = [
      { label: 'Asset Tag', value: assetTag },
      { label: 'Asset Name', value: assetName },
      { label: 'Category', value: categoryName },
      { label: 'Serial Number', value: serialNumber },
      { label: 'Location', value: location },
      { label: 'Status', value: status },
      { label: 'Asset URL', value: qrValue },
      { label: 'Generated', value: generatedAt },
    ]
      .filter((item) => item.value)
      .map(
        (item) => `
          <div class="detail-row">
            <span class="detail-label">${escapeHtml(item.label)}</span>
            <span class="detail-value">${escapeHtml(item.value)}</span>
          </div>
        `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Label - ${escapeHtml(assetTag)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              min-height: auto;
              background: #fff;
              padding: 10px;
              color: #111827;
            }
            .label {
              border: 2px solid ${primaryColor};
              border-radius: 12px;
              padding: 16px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
              max-width: 360px;
              width: 100%;
            }
            .header {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .org-name {
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              color: ${primaryColor};
            }
            .asset-tag {
              font-size: 18px;
              font-weight: 800;
              font-family: monospace;
              color: #0f172a;
              letter-spacing: 2px;
            }
            .asset-name {
              font-size: 12px;
              font-weight: 600;
              text-align: center;
              color: #334155;
              max-width: 280px;
              line-height: 1.3;
            }
            .qr-frame {
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 10px;
              background: #fff;
            }
            .qr-container svg {
              display: block;
              width: 220px;
              height: 220px;
            }
            .details {
              width: 100%;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
              display: grid;
              gap: 6px;
            }
            .detail-row {
              display: grid;
              grid-template-columns: 96px minmax(0, 1fr);
              gap: 10px;
              align-items: baseline;
            }
            .detail-label {
              font-size: 10px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              font-weight: 700;
              color: #64748b;
            }
            .detail-value {
              font-size: 11px;
              font-weight: 600;
              color: #0f172a;
              overflow-wrap: anywhere;
            }
            .scan-note {
              width: 100%;
              font-size: 10px;
              color: #64748b;
              text-align: center;
            }
            @media print {
              body { background: #fff; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">
              <span class="org-name">${escapeHtml(companyName)}</span>
              <span class="asset-tag">${escapeHtml(assetTag)}</span>
              <span class="asset-name">${escapeHtml(assetName)}</span>
            </div>
            <div class="qr-frame">
              <div class="qr-container">${svgContent}</div>
            </div>
            <p class="scan-note">Scan QR to open asset details in AssetFlow</p>
            <div class="details">${details}</div>
          </div>
          <script>window.onload = () => window.print();</script>
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
          className="asset-qr-svg"
          value={qrValue}
          size={220}
          level="M"
          includeMargin={true}
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
