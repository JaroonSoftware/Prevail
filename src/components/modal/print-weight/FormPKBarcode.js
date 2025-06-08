import React, { forwardRef } from "react";
// import { Card, QRCode } from "antd";
import { Card } from "antd";
import Barcode from 'react-barcode';

const FormPKBarcode = forwardRef(({ printData }, ref) => {
  return (
    <div ref={ref} >
      {printData.map((maindata, index) =>
        maindata.map((data, index) => (
          <Card title={null} key={1} style={{ pageBreakAfter: "always", marginTop: 5}}>
            <table style={{ height: "130px"}}>
              <tr>
                <td
                 style={{fontWeight: "bold", fontSize: "20px", width: "200px"}}
                >
                  {data?.stcode}/{data?.package_id}
                </td>
                <td style={{fontWeight: "bold", fontSize: "50px" }} colSpan={2} rowSpan={2}>
                  {data?.cuscode}
                </td>
              </tr>
              <tr>
                <td
                  style={{fontWeight: "bold", fontSize: "18px",width: "450px"}}
                  colSpan={3}
                >
                  {data?.stname}
                </td>
                <td rowSpan={2}>
                  {/* <QRCode size={80} value={data.package_id.toString()} /> */}
                  <Barcode displayValue={false} width={1} height={40} value={data.package_id.toString()} />
                </td>
              </tr>
              <tr>
                <td style={{fontWeight: "bold", fontSize: "18px"}}>{data?.sup_weight} KG</td>
              </tr>
              <tr>
                <td style={{ fontSize: "14px" }} colSpan={2}>
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
