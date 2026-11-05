import DocumentLink from "../../components/DocumentLink";
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Row, Col, Space, Descriptions, Table, Collapse } from "antd";
import { Typography, Button, DatePicker, Form, Input, message } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";

import dayjs from "dayjs";

import PurchaseOrderService from "../../service/PurchaseOrder.service";
import OptionService from "../../service/Options.service";

import { TagPurchaseOrderStatus } from "../../components/badge-and-tag";
import { LuPrinter } from "react-icons/lu";
import { formatMoney } from "../../utils/util";

import "./MyPage.css";

import {
  purchaseorderForm,
  columnsParametersEditable,
  poColumnView,
} from "./model";

const poservice = PurchaseOrderService();
const opservice = OptionService();
const dateFormat = "DD/MM/YYYY";

export default function PurchaseOrderView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };

  const [form] = Form.useForm();
  const [master, setMaster] = useState({});
  const [masterItems, setMasterItems] = useState([]);
  const [detailItems, setDetailItems] = useState([]);
  const [lastItems, setLastItems] = useState([]);
  const [poCode, setPoCode] = useState(null);

  useEffect(() => {
    const initial = async () => {

      if (!config?.code) return;
      try {
        const res = await poservice.get(config.code);
        const {
          data: { header, detail },
        } = res.data;
        setMaster(header || {});
        setPoCode(header?.pocode || header?.pocode || "");
        form.setFieldsValue({
          ...header,
          podate: header?.podate ? dayjs(header.podate) : undefined,
          deldate: header?.deldate ? dayjs(header.deldate) : undefined,
        });

        buildMasterItems(header || {});

        // const newDetail = detail.map((item, index) => ({ ...item, ind: index + 1 }));
        buildDetailItems(detail);
        buildLastUpdateInfo(header || {});
      } catch (err) {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "Fail to load Purchase Order");
      }
    };

    initial();
    return () => {};
  }, [config]);

  useEffect(() => {
    // keep masterItems in sync if master changed externally
    buildMasterItems(master);
  }, [master]);

  const buildMasterItems = (h) => {
    const items = [
      { label: "รหัสใบสั่งซื้อ", children: <DocumentLink type="pocode" code={h?.pocode} /> },
      {
        label: "วันที่ใบสั่งซื้อ",
        children: h?.podate ? dayjs(h.podate).format("DD/MM/YYYY") : "",
      },

      {
        label: "สถานะ",
        children: <TagPurchaseOrderStatus result={h?.doc_status} />,
      },
      { label: "รหัสลูกค้า", children: h?.supcode || "" },
      {
        label: "ชื่อลูกค้า",
        children: h?.supname || h?.supplier || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      {
        label: "วันที่นัดส่งของ",
        children: h?.deldate ? dayjs(h.deldate).format("DD/MM/YYYY") : "",
      },
      { label: "การชำระเงิน", children: h?.payment || "" },
      { label: "ใบเสนอราคา", children: h?.poqua || "" },
      {
        label: "หมายเหตุ",
        labelStyle: { verticalAlign: "top" },
        children: <pre style={{ margin: 0 }}>{h?.remark || ""}</pre>,
        span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
      },
    ];
    setMasterItems(items);
  };

  const buildDetailItems = (detail = []) => {
    // create a read-only version of columns from model

    const tableNode = (
      <Table
        style={{ backgroundColor: "#fafafa" }}
        dataSource={detail}
        columns={poColumnView}
        pagination={false}
        rowKey="stcode"
        scroll={{ x: "max-content" }}
        size="small"
        summary={(pageData) => {
          // รวมราคารวมสุทธิของทุกแถวในหน้า
          const totalNet = (pageData || []).reduce((sum, r) => {
            const qty = Number(r?.qty || 0);
            const price = Number(r?.buyprice || 0);
            const discount = Number(r?.discount || 0);
            const vat = Number(r?.vat || 0);
            const base = qty * price * (1 - discount / 100);
            const net = base * (1 + vat / 100);
            return sum + net;
          }, 0);

          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={8}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="end" className="!pe-2">
                Grand Total
              </Table.Summary.Cell>
              <Table.Summary.Cell className="!pe-1 text-end" style={{ borderRigth: "0px solid" }}>
                <Typography.Text type="danger">
                  {formatMoney(totalNet, 2)}&nbsp;
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    );

    const d = [
      {
        key: "1",
        label: "Purchase Order Items",
        children: tableNode,
        disabled: true,
        showArrow: false,
      },
    ];
    setDetailItems(d);
  };

  const buildLastUpdateInfo = (h) => {
      const items = [
        { label: "สร้างโดย", children: h?.created_by || "" ,span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },},
        { label: "วันที่สร้าง", children: h?.created_date ? dayjs(h.created_date).format("DD/MM/YYYY HH:mm:ss") : "" },
        { label: "อัพเดทล่าสุด", children: h?.updated_by || "" ,span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },},
        { label: "วันที่อัพเดท", children: h?.updated_date ? dayjs(h.updated_date).format("DD/MM/YYYY HH:mm:ss") : "" },
      ];
      setLastItems(items);
    };

  const handlePrint = () => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = `/po-print/${master?.pocode || poCode}`;
  };

  const hendleClose = () => {
    location.state?.documentReturn ? navigate(-1) : navigate("/purchase-order", { replace: true });
  };

  const ButtonActionLeft = (
    <Space
      gap="small"
      align="center"
      style={{ display: "flex", justifyContent: "start" }}
    >
      <Button
        style={{ width: 120 }}
        icon={<ArrowLeftOutlined />}
        onClick={hendleClose}
      >
        Back
      </Button>
    </Space>
  );

  const ButtonActionRight = (
    <Space
      gap="small"
      align="center"
      style={{ display: "flex", justifyContent: "end" }}
    >
      <Button icon={<PrinterOutlined />} onClick={handlePrint} type="primary">
        Print PO
      </Button>
    </Space>
  );

  return (
    <Space
      direction="vertical"
      size="middle"
      style={{
        display: "flex",
        position: "relative",
        paddingInline: "1.34rem",
      }}
      className="purchaseorder-view"
    >
      <Row
        gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
        className="m-0"
      >
        <Col span={12} style={{ paddingInline: "0px" }}>
          {ButtonActionLeft}
        </Col>
        {/* <Col span={12} style={{ paddingInline: "0px" }}>
          {ButtonActionRight}
        </Col> */}
      </Row>

      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        items={masterItems}
      />

      <Collapse
        size="large"
        className="view-collapse-sp"
        collapsible="disabled"
        activeKey={detailItems.map((_, i) => `${i + 1}`)}
        bordered={false}
        style={{ backgroundColor: "transparent" }}
        items={detailItems}
      />

      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        items={lastItems}
      />
    </Space>
  );
}
