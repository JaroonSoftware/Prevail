import React from "react";
import { Table, Row, Col, Card } from "antd";
import logo from "../../../assets/images/logo.png";

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
              Prevail International Food Co.,Ltd
              <br></br>
              60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเกต 83000 TEL. 098-1929391 ID
              LINE : 0981929391 E-mail :prevailinternational89@gmail.com
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
          />
        </Card>
      </div>
    );
  }
);

export default DocRemainingStock;
