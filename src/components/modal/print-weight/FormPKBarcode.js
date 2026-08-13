import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import logo from "../../../assets/images/logo.png";

/** สไตล์ใบปะหน้าถุง (100mm x 50mm) แบบมีกรอบ + QR Code */
export const PK_LABEL_STYLE = `
  .pk-label {
    width: 100mm;
    height: 50mm;
    box-sizing: border-box;
    padding: 2mm;
    margin: 0;
    background: #fff;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
    font-family: "Sarabun", "TH Sarabun New", Tahoma, sans-serif;
    color: #000;
  }
  .pk-label:last-child { page-break-after: auto; break-after: auto; }

  .pk-frame {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 1.2pt solid #000;
    border-radius: 2mm;
    padding: 1.6mm 2.4mm;
    display: flex;
    flex-direction: column;
  }

  /* ---- หัวฉลาก ---- */
  .pk-head {
    display: flex;
    align-items: center;
    gap: 2mm;
  }
  .pk-logo {
    width: 11mm;
    height: auto;
    max-height: 8mm;
    object-fit: contain;
    flex: 0 0 auto;
  }
  .pk-title {
    flex: 1 1 auto;
    font-size: 10pt;
    font-weight: 700;
    line-height: 1.15;
    max-height: 8mm;
    overflow: hidden;
  }
  .pk-badge {
    flex: 0 0 auto;
    min-width: 11mm;
    text-align: center;
    font-size: 11pt;
    font-weight: 700;
    border: 1.2pt solid #000;
    border-radius: 1.6mm;
    padding: 0.6mm 1.6mm;
  }

  .pk-hr {
    border-top: 1pt solid #000;
    margin: 1.2mm 0;
  }

  /* ---- เนื้อหา: ข้อมูลซ้าย / QR ขวา ---- */
  .pk-body {
    flex: 1 1 auto;
    display: flex;
    gap: 2mm;
    min-height: 0;
  }
  .pk-fields {
    flex: 1 1 auto;
    display: table;
    width: 100%;
    border-collapse: collapse;
  }
  .pk-row { display: table-row; }
  .pk-lb, .pk-vl {
    display: table-cell;
    padding: 0.35mm 0;
    vertical-align: top;
    line-height: 1.25;
  }
  .pk-lb {
    width: 22mm;
    font-size: 8pt;
    color: #333;
    white-space: nowrap;
  }
  .pk-vl { font-size: 9pt; }
  .pk-vl.strong { font-size: 10.5pt; font-weight: 700; }

  /* ---- QR ---- */
  .pk-qr {
    flex: 0 0 auto;
    width: 24mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .pk-qr svg { display: block; }
  .pk-cuscode {
    font-size: 20pt;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: 0.3pt;
    text-align: center;
    margin-bottom: 0.8mm;
    word-break: break-all;
  }
`;

const FormPKBarcode = forwardRef(({ printData }, ref) => {
  const groups = Array.isArray(printData) ? printData : [];

  return (
    <div ref={ref} id="pk-print-root">
      <style>{`
        ${PK_LABEL_STYLE}
        @media print {
          @page { size: 100mm 50mm; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; }
          #pk-print-root { width: 100mm; margin: 0; padding: 0; }
          .pk-label { padding: 2mm !important; box-shadow: none !important; }
        }
        @media screen {
          #pk-print-root {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
          .pk-label { box-shadow: 0 2px 10px rgba(0,0,0,.12); }
        }
      `}</style>

      {groups.map((group, gi) => {
        const items = Array.isArray(group) ? group : [];
        return items.map((data, i) => {
          const qrValue = String(data?.package_id ?? "");
          return (
            <div className="pk-label" key={`${gi}-${data?.package_id ?? i}`}>
              <div className="pk-frame">
                <div className="pk-head">
                  <img className="pk-logo" src={logo} alt="" />
                  <div className="pk-title">{data?.stname}</div>
                  <div className="pk-badge">
                    {i + 1}/{items.length}
                  </div>
                </div>

                <div className="pk-hr" />

                <div className="pk-body">
                  <div className="pk-fields">
                    <div className="pk-row">
                      <span className="pk-lb">รหัสสินค้า</span>
                      <span className="pk-vl">{data?.stcode}</span>
                    </div>
                    <div className="pk-row">
                      <span className="pk-lb">Lot No.</span>
                      <span className="pk-vl strong">{data?.package_id}</span>
                    </div>
                    <div className="pk-row">
                      <span className="pk-lb">จำนวน</span>
                      <span className="pk-vl strong">{data?.sup_weight} KG</span>
                    </div>
                    <div className="pk-row">
                      <span className="pk-lb">ชื่อลูกค้า</span>
                      <span className="pk-vl">{data?.cusname}</span>
                    </div>
                    <div className="pk-row">
                      <span className="pk-lb">เลขที่เอกสาร</span>
                      <span className="pk-vl">{data?.socode}</span>
                    </div>
                  </div>

                  <div className="pk-qr">
                    <div className="pk-cuscode">{data?.cuscode}</div>
                    <QRCodeSVG size={72} level="M" value={qrValue} />
                  </div>
                </div>
              </div>
            </div>
          );
        });
      })}
    </div>
  );
});

export default FormPKBarcode;
