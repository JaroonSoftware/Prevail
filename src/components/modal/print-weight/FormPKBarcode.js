import React, { forwardRef } from "react";
import { Card, QRCode } from "antd";

const keyStyled = {
  fontSize: "20px",
  fontWeight: "920px",
};

const FormPKBarcode = forwardRef(({ printData }, ref) => {
  return (
    <div ref={ref} >
      {printData.map((maindata, index) =>
        maindata.map((data, index) => (
          <Card title={null} key={1} style={{ pageBreakAfter: "always", marginTop: 5}}>
            <table style={{ height: "150px"}}>
              <tr>
                <td
                 style={{fontWeight: "bold", fontSize: "20px", width: "320px"}}
                >
                  {data?.stcode}/{data?.package_id}
                </td>
              </tr>
              <tr>
                <td
                  style={{fontWeight: "bold", fontSize: "18px"}}
                  colSpan={2}
                >
                  {data?.stname}
                </td>
                <td rowSpan={3}>
                  <QRCode size={80} value={data.package_id.toString()} />
                </td>
              </tr>
              <tr>
                <td style={{fontWeight: "bold", fontSize: "18px"}}>{data?.weight} KG</td>
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
