/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";

import {
  Form,
  Flex,
  Select,
  Row,
  Col,
  Space,
  Divider,
  Input,
  Table,
  message,
  Collapse,
} from "antd";
import { productColumn } from "./model";
import OptionService from "../../service/Options.service";
import DeliveryNoteService from "../../service/DeliveryNote.service";
import BarcodeService from "../../service/Barcode.service";
import ModalDN from "../../components/modal/shippingDelivery/ModalDelivery";
import ModalScan from "../../components/modal/scan-shipping/MyModal";
import { Button, Typography } from "antd";
import { DEFALUT_CHECK_DELIVERY } from "./model";
const opservice = OptionService();
const dnservice = DeliveryNoteService();
const barcodeservice = BarcodeService();
// const dateFormat = "DD/MM/YYYY";
const ShippingAccess = () => {
  const [form] = Form.useForm();
  const [isModalOpenDN, setIsModalDNOpen] = useState(false);
  const [openDN, setOpenDN] = useState(false);
  const [selected, setSelected] = useState("");
  const [selectsocode, setSelectSOcode] = useState("");
  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_DELIVERY);
  const [accessData, setAccessData] = useState([]);
  const [listDetail] = useState([]);

  const [setUnitOption] = React.useState([]);
  useEffect(() => {
    const initial = async () => {
      const data = {};
      dnservice
        .search({ ignoreLoading: Object.keys(data).length !== 0 })
        .then((res) => {
          const { data } = res.data;
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
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const getDNData = async () => {
    const res = await dnservice
      .get(form.getFieldValue("dncode"))
      .catch((error) => message.error("get Delivery Note data fail."));

    // values(res.data);
    // console.log(res);
    const { detail } = res.data;
    setAccessData(detail);
  };

  const handleSummaryPrice = () => {
    const newData = [...listDetail];

    const total_weight = newData.reduce(
      (a, v) => (a += Number(v.unit_weight || 0)),
      0
    );

    setFormDetail(() => ({
      ...formDetail,
      total_weight,
    }));
    // console.log(formDetail)
  };

  const handleChoosedDN = (val) => {
    const { header, detail } = val;
    // console.log(header);
    setAccessData(detail);

    const fvalue = form.getFieldsValue();
    const customer = {
      ...header,
      dncode: header.dncode,
      county_code: header.county_code,
      remark: header.remark,
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customer }));
    form.setFieldsValue({ ...fvalue, ...customer });
  };

  const handleScanBarcode = (val) => {

    const header = {
      ...form.getFieldsValue(),
      ...val,
      dncode: form.getFieldValue("dncode"),
      socode: selectsocode,
    };

    const parm = { header };
    // console.log(header);
    barcodeservice
      .confirm_shipping(parm)
      .then((r) => {
        message.success("Request GoodsReceipt success.");

        getDNData();
      })
      .catch((err) => {
        message.error("Request GoodsReceipt fail.");
        console.warn(err);
      });
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
  const handleScan = async (data) => {
    // alert
    setSelectSOcode(data.socode);
    setSelected(data.stcode);
    setIsModalDNOpen(true);
  };

  const prodcolumns = productColumn({ handleScan });
  const SectionCustomers = (
    <>
      <Form
        form={form}
        layout="vertical"
        className="width-100"
        autoComplete="off"
      >
        <Row className="m-0" gutter={[12, 12]}>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="dncode" label="รหัสใบส่งสินค้า" className="!mb-1">
              <Input readOnly placeholder="รหัสใบส่งสินค้า" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item
              name="dndate"
              label="วันที่ใบส่งสินค้า"
              className="!mb-1"
            >
              <Input readOnly placeholder="วันที่ใบส่งสินค้า" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cuscode" label="รหัสลูกค้า" className="!mb-1">
              <Input readOnly placeholder="รหัสลูกค้า" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item
              name="county_code"
              label="ที่อยู่จัดส่งสินค้า"
              className="!mb-1"
            >
              <Select
                size="large"
                placeholder="เลือกที่อยู่จัดส่งสินค้า"
                showSearch
                filterOption={filterOption}
                options={[
                  {
                    value: "1",
                    label: "กะตะ",
                  },
                  {
                    value: "2",
                    label: "กะรน",
                  },
                  {
                    value: "ป่าตอง",
                    label: "ป่าตอง",
                  },
                  {
                    value: "เมือง",
                    label: "เมือง",
                  },
                  {
                    value: "เขาหลัก พังงาน",
                    label: "เขาหลัก พังงาน",
                  },
                  {
                    value: "เชิงทะเล",
                    label: "เชิงทะเล",
                  },
                ]}
              ></Select>
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="remark" label="หมายเหตุ" className="!mb-1">
              <Input.TextArea
                placeholder="หมายเหตุ"
                size="large"
                readOnly
                rows={1}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </>
  );
  const SectionProduct = (
    <>
      <Flex className="width-100" vertical>
        <Table
          title={() => TitleTable}
          rowClassName={() => "editable-row"}
          bordered
          columns={prodcolumns}
          dataSource={accessData}
          pagination={false}
          rowKey="stcode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
        />
      </Flex>
    </>
  );
  const DN = [
    {
      key: "1",
      label: "ข้อมูลใบส่งสินค้า",
      children: (
        <>
          <Flex gap="small" wrap>
            <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                <Button
                  onClick={() => {
                    setOpenDN(true);
                  }}
                  type="primary"
                >
                  เลือกใบส่งสินค้า
                </Button>
              </Col>
              <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                {SectionCustomers}
              </Col>
            </Row>
          </Flex>
        </>
      ),
    },
  ];

  return (
    <div className="item-access">
      <Space
        direction="vertical"
        size="middle"
        style={{ display: "flex", position: "relative" }}
      >
        <Collapse items={DN} defaultActiveKey={["1"]} />
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
          <Divider orientation="left" className="!my-0">
            รายการใบส่งสินค้า
          </Divider>
          {SectionProduct}
        </Col>
      </Space>

      {openDN && (
        <ModalDN
          show={openDN}
          close={() => setOpenDN(false)}
          values={(v) => {
            handleChoosedDN(v);
          }}
        ></ModalDN>
      )}
      {isModalOpenDN && (
        <ModalScan
          show={isModalOpenDN}
          selected={selected}
          close={() => setIsModalDNOpen(false)}
          values={(v) => {
            handleScanBarcode(v);
          }}
        ></ModalScan>
      )}
    </div>
  );
};

export default ShippingAccess;
