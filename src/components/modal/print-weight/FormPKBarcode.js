import { forwardRef } from "react";
import { QRCode } from "antd";
import { Card } from "antd";
import {QRCodeSVG} from 'qrcode.react';
// import Barcode from 'react-barcode';

const FormPKBarcode = forwardRef(({ printData }, ref) => {
  return (
    <div ref={ref} >
      {printData.map((maindata, index) =>
        maindata.map((data, index) => (
          <Card title={null} key={1} className="pkqrcode" 
          style={{ pageBreakAfter: "always" }}
          >
            <table style={{ height: "140px"}}>
              <tr>
                <td
                 style={{fontWeight: "bold", fontSize: "16px", width: "200px"}} 
                >
                  {data?.stcode}/{data?.package_id}
                </td>
                <td style={{fontWeight: "bold", fontSize: "50px" }} rowSpan={2}>
                  <div style={{marginLeft: "16px"}}>{data?.cuscode}</div>
                  
                </td>
              </tr>
              <tr>
                <td
                  style={{ fontSize: "16px",width: "200px"}}
                >
                  {data?.stname}
                </td>
                
              </tr>
              <tr>
                <td style={{fontWeight: "bold", fontSize: "16px"}}>{data?.sup_weight} KG</td>
                <td rowSpan={2} >
                  <QRCodeSVG size={80} style={{marginLeft: "25px"}} value={data.package_id.toString()} />
                  {/* <QRCode size={80} value={data.package_id.toString()} /> */}
                  {/* <Barcode displayValue={false} width={1} height={40} value={data.package_id.toString()} /> */}
                </td>
              </tr>
              <tr>
                <td style={{ fontSize: "12px" }} colSpan={2}>
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
