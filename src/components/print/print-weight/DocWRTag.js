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
            pageBreakAfter: (index + 1) % 3 === 0 && "always",
          }}
          key={index}
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
                colspan="2"
              >
                TAG WIREROD
              </th>
              <th
                style={{
                  padding: "4px 8px",
                  textAlign: "center",
                  fontSize: "16px",
                  border: "1px solid",
                }}
              >
                QR CODE
              </th>
            </tr>
            <tr>
              <td style={keyStyled}>GRADE</td>
              <td style={valueStyled}>{data.grade}</td>
              <td style={{ ...valueStyled, width: "150px" }} rowspan="5">
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
                    value={data?.wr_code + ""}
                    viewBox={`0 0 256 256`}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td style={keyStyled}>SIZE</td>
              <td style={valueStyled}>{+data.size}</td>
            </tr>
            <tr>
              <td style={keyStyled}>CHARGE NO.</td>
              <td style={valueStyled}>{data.charge_no}</td>
            </tr>
            <tr>
              <td style={keyStyled}>COIL NO.</td>
              <td style={valueStyled}>{data?.coil_no}</td>
            </tr>
            <tr>
              <td style={keyStyled}>WEIGHT</td>
              <td style={valueStyled}>
                {data?.sup_weight?.toLocaleString() ||
                  data.weight?.toLocaleString()}{" "}
                KGs.
              </td>
            </tr>
          </table>
        </Card>
      ))}
    </div>
  );
});
export default DocWRTag;
