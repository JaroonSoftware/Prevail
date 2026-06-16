import { forwardRef } from "react";
import { QRCode } from "antd";
import { Card } from "antd";
import {QRCodeSVG} from 'qrcode.react';
// import Barcode from 'react-barcode';

const FormPKBarcode = forwardRef(({ printData }, ref) => {
  return (
    <div ref={ref} id="pk-print-root">
      <style>{`
        @media print {
          @page {
            size: 100mm 50mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          #pk-print-root {
            width: 100mm;
            margin: 0;
            padding: 0;
          }
          .ant-card.pkqrcode {
            width: 100mm !important;
            height: 50mm !important;
            box-sizing: border-box !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always;
            overflow: hidden;
          }
          .ant-card.pkqrcode .ant-card-body {
            padding: 6px 8px !important;
            width: 100% !important;
            height: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      {printData.map((maindata, index) =>
        maindata.map((data, index) => (
          <Card title={null} key={1} className="pkqrcode" 
          style={{ pageBreakAfter: "always" }}
          >
            <table style={{ width: "100%", tableLayout: "fixed" }}>
              <tr>
                <td
                 style={{fontWeight: "bold", fontSize: "16px", width: "55%"}}
                >
                  {data?.stcode}/{data?.package_id}
                </td>
                <td style={{fontWeight: "bold", fontSize: "36px", textAlign: "center" }} rowSpan={2}>
                  {data?.cuscode}
                </td>
              </tr>
              <tr>
                <td
                  style={{ fontSize: "16px" }}
                >
                  {data?.stname}
                </td>
              </tr>
              <tr>
                <td style={{fontWeight: "bold", fontSize: "16px"}}>{data?.sup_weight} KG</td>
                <td rowSpan={2} style={{ textAlign: "center" }}>
                  <QRCodeSVG size={70} value={data.package_id.toString()} />
                </td>
              </tr>
              <tr>
                <td style={{ fontSize: "13px" }}>
                  {data?.cusname} {data?.socode}
                </td>
              </tr>
            </table>
          </Card>
        ))
      )}
    </div>
  );
});
export default FormPKBarcode;
