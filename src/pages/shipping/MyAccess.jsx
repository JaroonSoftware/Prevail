/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Card } from "antd";
import {
  Form,
  Flex,
  Row,
  Col,
  Space,
  DatePicker,
  Divider,
  Input,
  Table,
  message,
  Modal,
} from "antd";
import { productColumn } from "./model";
import OptionService from "../../service/Options.service";
import DeliveryNoteService from "../../service/DeliveryNote.service";
import { Button, Typography } from "antd";
import { DEFALUT_CHECK_DELIVERY } from "./model";
const opservice = OptionService();
const dateFormat = "DD/MM/YYYY";
const ShippingAccess = () => {
  const [form] = Form.useForm();
  const dnservice = DeliveryNoteService();
  const [open15, setOpen15] = useState(false);
  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_DELIVERY);
  const [accessData, setAccessData] = useState([]);
  const [listDetail] = useState([]);
  const [
    dnCode,
    //  setDNCode
  ] = useState(null);
  const [ setUnitOption] = React.useState([]);
  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };
  useEffect(() => {
    const initial = async () => {
      const data = {};
      dnservice
      
        .search({ ignoreLoading: Object.keys(data).length !== 0 })
        .then((res) => {
          const { data } = res.data;

          setAccessData(data);
        })
        .catch((err) => {
          console.log(err);
          message.error("Request error!");
        });

      // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
      // handleChoosedCustomers(head);

      const [unitOprionRes] = await Promise.all([
        opservice.optionsUnit({ p: "unit-option" }),
      ]);
      // console.log(unitOprionRes.data.data)
      setUnitOption(unitOprionRes.data.data);
    };

    initial();
    return () => {};
  }, []);

  useEffect(() => {
    if (listDetail) handleSummaryPrice();
  }, [listDetail]);
  const handleSummaryPrice = () => {
    const newData = [...listDetail];

    const total_weight = newData.reduce(
      (a, v) => (a += Number(v.unit_weight || 0)),
      0
    );
    // console.log(total_weight)
    // const total_weight += newData.qty;
    setFormDetail(() => ({
      ...formDetail,
      total_weight,
    }));
    // console.log(formDetail)
  };
  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการสินค้า
          </Typography.Title>
        </Flex>
      </Col>
    </Flex>
  );
  const handleEdit =  {
   
  };
  const prodcolumns = productColumn({ handleEdit});
  const SectionCustomers = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={12} lg={12}>
            <Form.Item name="cuscode" label="รหัสลูกค้า" className="!mb-1">
              <Input readOnly placeholder="รหัสลูกค้า" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input.TextArea placeholder="ที่อยู่" readOnly rows={2} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="remark" label="หมายเหตุ" className="!mb-1">
              <Input.TextArea placeholder="หมายเหตุ" readOnly rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );
  const SectionProduct = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTable}
          rowClassName={() => "editable-row"}
          bordered
          columns={prodcolumns}
          dataSource={accessData}
          pagination={false}
          rowKey="dncode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
        />
      </Flex>
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
          </Flex>
        </Card>
        <Form
          form={form}
          layout="vertical"
          className="width-100"
          autoComplete="off"
        >
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
                        วันที่ใบส่งของ :
                      </Typography.Title>
                      <Form.Item name="dndate" className="!m-0">
                        <DatePicker
                          className="input-40"
                          allowClear={false}
                          // onChange={handleQuotDate}
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
                  ข้อมูลใบส่งของ
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
        </Form>
      </Space>
      <Modal
        title="Modal 1000px width"
        centered
        open={open15}
        onOk={() => setOpen15(false)}
        onCancel={() => setOpen15(false)}
        width={1000}
      >
        <p>some contents...</p>
        <p>some contents...</p>
        <p>some contents...</p>
      </Modal>
    </div>
  );
};

export default ShippingAccess;
