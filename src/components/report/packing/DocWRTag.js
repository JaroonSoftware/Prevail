import React, { forwardRef } from "react";
import { Card, QRCode } from "antd";

const keyStyled = {
  border: "1px solid",
  padding: "4px 8px",
  width: "140px",
  fontSize: "22px",
  fontWeight: "600",
};

const valueStyled = {
  border: "1px solid",
  textAlign: "center",
  fontWeight: "bold",
  width: "250px",
  fontSize: "28px",
};

const DocWRTag = forwardRef(({ printData }, ref) => {
  return (
    <div ref={ref}>
      {printData.map((data, index) => (  
        <Card
          title={null}
          style={{
            marginBottom: "8px",
            pageBreakAfter: (1 + 1) % 3 === 0 && "always",
          }}
          key={1}
        >
          
          <table style={{ border: "1px solid", width: "100%" }}>
            <tr>
              <th
                style={{
                  padding: "4px 8px",
                  textAlign: "center",
                  border: "1px solid",
                  fontSize: "16px",
                }}
              >
                SPL ป้าย 2/1
              </th>
            </tr>

            <tr>
              <td style={keyStyled}>{data?.stname}</td>
     
              <td style={{ ...valueStyled, width: "150px" }} rowspan="1">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <QRCode
                    size={128}
                    style={{ height: "auto" }}
                    value={data?.stcode}
                    viewBox={`0 0 256 256`}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td style={keyStyled}>
                {data?.qty} {data?.unit} {data?.cusname}
              </td>
     
            </tr>
            <tr>
              <td style={keyStyled}>ชื่อบริษัท</td>
            </tr>
          </table>
        </Card>
      ))}
    </div>
  );

});
export default DocWRTag;
