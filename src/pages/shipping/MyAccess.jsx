/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from "react";
import { Card } from "antd";
import { Form, Flex, Row, Col, Space, DatePicker, Divider, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { DEFALUT_CHECK_DELIVERY } from "./model";
import dayjs from "dayjs";
const dateFormat = "DD/MM/YYYY";
const ShippingAccess = () => {
  const [form] = Form.useForm();
  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_DELIVERY);
  const [
    // openCustomers,
    setOpenCustomers,
  ] = useState(false);
  const [dnCode] = useState(null);
  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };
  const handleCalculatePrice = (day, date) => {
    const newDateAfterAdding = dayjs(date || new Date()).add(
      Number(day),
      "day"
    );
    const nDateFormet = newDateAfterAdding.format("YYYY-MM-DD");

    setFormDetail((state) => ({ ...state, dated_price_until: nDateFormet }));
    form.setFieldValue("dated_price_until", nDateFormet);
  };
  const handleQuotDate = (e) => {
    const { valid_price_until } = form.getFieldsValue();
    if (!!valid_price_until && !!e) {
      handleCalculatePrice(valid_price_until || 0, e || new Date());
    }
  };
  const SectionCustomers = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              name="cuscode"
              htmlFor="cuscode-1"
              label="รหัสลูกค้า"
              className="!mb-1"
            >
              <Input
                readOnly
                placeholder="เลือกลูกค้า"
                id="cuscode-1"
                value={formDetail.cuscode}
                className="!bg-white"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={18} lg={18}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input placeholder="ที่อยู่" readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item className="" name="remark" label="หมายเหตุ">
              <Input.TextArea placeholder="Enter Remark" rows={4} />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );
  const SectionProduct = (
    <>
      {/* <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTable}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listDetail}
          columns={prodcolumns}
          pagination={false}
          rowKey="stcode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          summary={(record) => {
            return (
              <>
                {listDetail.length > 0 && (
                  <>
                    <Table.Summary.Row>
                      {/* <Table.Summary.Cell
                        index={0}
                        colSpan={2}
                      ></Table.Summary.Cell> */}
      {/* <Table.Summary.Cell
                        index={4}
                        align="end"
                        colSpan={3}
                        className="!pe-4"
                      >
                        น้ำหนักรวม
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end border-right-0"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {comma(Number(formDetail?.total_weight || 0),2,2)}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={2}
                      ></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )}
              </>
            );
          }}
        />
      </Flex> */}
    </>
  );
  return (
    <div className="item-access">
      <Space
        direction="vertical"
        size="middle"
        style={{ display: "flex", position: "relative" }}
      >
        <Card>
          <Flex gap="small" wrap>
            <Button type="primary">เลือกใบส่งสินค้า</Button>
            <Button type="primary">แสกนสินค้า</Button>
          </Flex>
        </Card>
        <Card
          title={
            <>
              <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
                <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                  <Typography.Title level={3} className="m-0">
                    เลขที่ใบส่งของ : {dnCode}
                  </Typography.Title>
                </Col>
                <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                  <Flex
                    gap={10}
                    align="center"
                    className="justify-start sm:justify-end"
                  >
                    <Typography.Title level={3} className="m-0">
                      วันที่ใบส่งของ :{" "}
                    </Typography.Title>
                    <Form.Item name="dndate" className="!m-0">
                      <DatePicker
                        className="input-40"
                        allowClear={false}
                        onChange={handleQuotDate}
                        format={dateFormat}
                      />
                    </Form.Item>
                  </Flex>
                </Col>
              </Row>
            </>
          }
        >
          <Row className="m-0" gutter={[12, 12]}>
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
              <Divider orientation="left" className="!mb-3 !mt-1">
                {" "}
                ข้อมูลใบส่งของ{" "}
              </Divider>
              <Card style={cardStyle}>{SectionCustomers}</Card>
            </Col>
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
              <Divider orientation="left" className="!my-0">
                รายการใบส่งสินค้า
              </Divider>
              <Card style={{ backgroundColor: "#f0f0f0" }}>
                {SectionProduct}
              </Card>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default ShippingAccess;
