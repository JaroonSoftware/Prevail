/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Row, Col, Space, Descriptions, Table, Collapse } from "antd";
import { Typography, Button, DatePicker, Form, Input, message } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";

import dayjs from "dayjs";

import QuotationService from "../../service/Quotation.service";
import OptionService from "../../service/Options.service";

import { TagQuotationStatus } from "../../components/badge-and-tag";
import { formatMoney } from "../../utils/util";

import "./MyPage.css";

const qtservice = QuotationService();
const opservice = OptionService();
const dateFormat = "DD/MM/YYYY";

export default function QuotationView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };

  const [form] = Form.useForm();
  const [master, setMaster] = useState({});
  const [masterItems, setMasterItems] = useState([]);
  const [detailItems, setDetailItems] = useState([]);
  const [unitOption, setUnitOption] = useState([]);
  const [qtCode, setQtCode] = useState(null);

  useEffect(() => {
    const initial = async () => {
      try {
        const [unitOprionRes] = await Promise.all([
          opservice.optionsUnit({ p: "unit-option" }),
        ]);
        setUnitOption(unitOprionRes?.data?.data || []);
      } catch (e) {
        // ignore
      }

      if (!config?.code) return;
      try {
        const res = await qtservice.get(config.code);
        const {
          data: { header, detail },
        } = res.data;

        setMaster(header || {});
        setQtCode(header?.qtcode || "");
        form.setFieldsValue({
          ...header,
          qtdate: header?.qtdate ? dayjs(header.qtdate) : undefined,
        });

        buildMasterItems(header || {});
        buildDetailItems(detail || []);
      } catch (err) {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "Fail to load Quotation");
      }
    };

    initial();
    return () => {};
  }, [config]);

  useEffect(() => {
    buildMasterItems(master);
  }, [master]);

  const buildMasterItems = (h) => {
    const items = [
      { label: "เลขที่ใบเสนอราคา", children: h?.qtcode || "" },
      {
        label: "วันที่ใบเสนอราคา",
        children: h?.qtdate ? dayjs(h.qtdate).format("DD/MM/YYYY") : "",
      },
      {
        label: "สถานะ",
        children: <TagQuotationStatus result={h?.doc_status} />,
      },
      { label: "รหัสลูกค้า", children: h?.cuscode || "" },
      {
        label: "ชื่อลูกค้า",
        children: h?.cusname || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      { label: "ผู้ติดต่อ", children: h?.contact || "" },
      { label: "เบอร์โทรลูกค้า", children: h?.tel || "" },
      { label: "ที่อยู่", children: h?.address || h?.cusaddress || "" },
      {
        label: "หมายเหตุ",
        labelStyle: { verticalAlign: "top" },
        children: <pre style={{ margin: 0 }}>{h?.remark || ""}</pre>,
        span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
      },
    ];
    setMasterItems(items);
  };

  const getUnitLabel = (val) => {
    if (!val) return "";
    const found = unitOption?.find((u) => u.value === val);
    return found?.label || String(val);
  };

  const buildDetailItems = (detail = []) => {
    const data = Array.isArray(detail) ? detail : [];

    // read-only columns for quotation items
    const quoViewColumns = [
      {
        title: "ลำดับ",
        key: "__no",
        width: 80,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "รหัสสินค้า",
        dataIndex: "stcode",
        key: "stcode",
        width: 140,
        align: "left",
      },
      {
        title: "ชื่อสินค้า",
        key: "stname",
        align: "left",
        render: (_, rec) => rec?.stname || rec?.purdetail || "-",
      },
      {
        title: "ราคาขาย",
        dataIndex: "price",
        key: "price",
        align: "right",
        width: 140,
        className: "!pe-3",
        render: (v) => formatMoney(Number(v || 0), 2),
      },
      {
        title: "หน่วยสินค้า",
        dataIndex: "unit",
        key: "unit",
        align: "right",
        width: 120,
        render: (v) => getUnitLabel(v),
      },
    ];

    const tableNode = (
      <Table
        style={{ backgroundColor: "#fafafa" }}
        dataSource={data}
        columns={quoViewColumns}
        pagination={false}
        rowKey={(r) => r?.stcode ?? r?.id ?? r?.key ?? r?.seq}
        scroll={{ x: "max-content" }}
        size="small"
      />
    );

    const d = [
      {
        key: "1",
        label: "Quotation Items",
        children: tableNode,
        disabled: true,
        showArrow: false,
      },
    ];
    setDetailItems(d);
  };
  
  const handlePrint = () => {
    const url = `/quo-print/${qtCode}`;
    const newWindow = window.open('', url, url);
    newWindow.location.href = url;
  };
  

  const handleClose = () => {
    navigate("/quotation", { replace: true });
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
        onClick={handleClose}
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
        Print Quotation
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
      className="quotation-view"
    >
      <Row
        gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
        className="m-0"
      >
        <Col span={12} style={{ paddingInline: "0px" }}>
          {ButtonActionLeft}
        </Col>
        <Col span={12} style={{ paddingInline: "0px" }}>
          {ButtonActionRight}
        </Col>
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
    </Space>
  );
}
