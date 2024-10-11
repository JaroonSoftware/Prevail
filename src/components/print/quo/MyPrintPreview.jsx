import React from "react";
import { Table, Row, Col, Card } from "antd";
import logo from "../../../assets/images/logo.png";
import { formatMoney } from "../../../utils/util";

const DocRemainingStock = React.forwardRef(
  ({ printData, columns, date }, ref) => {
    return (
      <div>
        <Card ref={ref}>
          <Row>
            <Col flex="120px" style={{ textAlign: "center" }}>
              <img src={logo} style={{ width: "80px" }} />
            </Col>
            <Col
              flex="auto"
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                alignSelf: "center",
                color: "black",
              }}
            >
              PENSIRI STEEL INDUSTRIES CO., LTD.
            </Col>
          </Row>
          <Row>
            <Col
              xs={24}
              style={{
                fontSize: "16px",
                textAlign: "center",
                color: "black",
                marginTop: "10px",
              }}
            >
              รายงานสต็อกคงเหลือประจำวันที่ {formatMoney(date)}
            </Col>
          </Row>

          <Table
            dataSource={printData}
            columns={columns}
            style={{ marginTop: "1rem" }}
            pagination={false}
            size="small"
            bordered
            className="antd-custom-border-table table-less-pd table-less-font"
            summary={(pageData) => {
              let totalQuantity = 0;
              let totalWeight = 0;
              let totalRemaining = 0;
              let totalSupWeight = 0;
              pageData.forEach(
                ({
                  vendor,
                  quantity,
                  total_weight,
                  remaining,
                  total_sup_weight,
                }) => {
                  if (vendor) {
                    totalQuantity += quantity;
                    totalWeight += total_weight;
                    totalRemaining += remaining;
                    totalSupWeight += total_sup_weight;
                  }
                }
              );
              return (
                <Table.Summary.Row
                  align="center"
                  style={{ backgroundColor: "#fafafa" }}
                >
                  <Table.Summary.Cell index={0}>
                    <b>สุทธิ</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={1}
                    colSpan={6}
                  ></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={1}>
                    <b>{totalQuantity?.toLocaleString()}</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={1}>
                    <b>{totalRemaining?.toLocaleString()}</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right" index={4} colSpan={1}>
                    <b>{totalWeight?.toLocaleString()}</b>
                  </Table.Summary.Cell>
                  {/* <Table.Summary.Cell align="right" index={4} colSpan={1}>
                    <b>{totalSupWeight?.toLocaleString()}</b>
                  </Table.Summary.Cell> */}
                </Table.Summary.Row>
              );
            }}
          />
        </Card>
      </div>
    );
  }
);

export default DocRemainingStock;
