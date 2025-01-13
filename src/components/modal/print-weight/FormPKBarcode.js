import React, { forwardRef } from "react";
import { Card, QRCode } from "antd";

const keyStyled = {
  fontSize: "20px",
  fontWeight: "920",
};



const FormPKBarcode = forwardRef(({ printData }, ref) => {
  return (
    
    <div ref={ref} style={{pageBreakAfter: "always"}}>
      {printData.map((maindata, index) =>
        maindata.map((data, index) => (
          <Card
            title={null}
            style={{
              marginBottom: "20px",
              pageBreakAfter:  "always",
            }}
            key={1}
          >
            <table style={{  width: "100%" ,height: "100%",}}>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: "22px",
                  }}
                  colSpan={2}
                >
                  {data?.stcode}/{data?.package_id}
                </th>
              </tr>
              <tr>
                <td style={{ ...keyStyled, fontSize: "22px",width: "60%" }} colSpan={2}>
                  {data?.stname}
                </td>
                <td rowSpan={3}>
                  <QRCode
                    size={100}
                    style={{ height: "auto" }}
                    value={data?.package_id}
                  />
                </td>
              </tr>
              <tr>
                <td style={keyStyled}>
                  {data?.weight} KG
                </td>
              </tr>
              <tr>
                <td style={{keyStyled, fontSize: "14px"}} colSpan={2}>
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
