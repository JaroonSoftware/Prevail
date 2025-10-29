/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Row, Col, Space, Descriptions, Table, Collapse } from "antd";
import { Typography, Button, message } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import BillingNoteService from "../../service/BillingNote.Service";

import { TagInvoiceStatus } from "../../components/badge-and-tag";
import { formatMoney } from "../../utils/util";
import { blViewColumns } from "./model";

import "./MyPage.css";

const blservice = BillingNoteService();

export default function BillingView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };

  const [master, setMaster] = useState({});
  const [masterItems, setMasterItems] = useState([]);
  const [detailItems, setDetailItems] = useState([]);
  const [lastItems, setLastItems] = useState([]);
  const [blCode, setBlCode] = useState(null);

  useEffect(() => {
    const initial = async () => {
      if (!config?.code) return;
      try {
        const res = await blservice.get(config.code);
        // Billing get() returns { data: { header, detail } } (per Manage page usage)
        const { header, detail } = res?.data?.data || {};

        setMaster(header || {});
        setBlCode(header?.blcode || "");

        buildMasterItems(header || {});
        buildDetailItems(detail || []);
        buildLastUpdateInfo(header || {});
      } catch (err) {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "Fail to load Billing Note");
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
      { label: "เลขที่ใบแจ้งหนี้", children: h?.blcode || "" },
      {
        label: "วันที่ใบแจ้งหนี้",
        children: h?.bldate ? dayjs(h.bldate).format("DD/MM/YYYY") : "",
      },
      {
        label: "สถานะ",
        children: <TagInvoiceStatus result={h?.doc_status} />,
      },
      { label: "รหัสลูกค้า", children: h?.cuscode || "" },
      {
        label: "ชื่อลูกค้า",
        children: h?.cusname || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      {
        label: "ที่อยู่",
        children: h?.address || h?.cusaddress || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      { label: "ผู้ติดต่อ", children: h?.contact || "" },
      { label: "เบอร์โทรลูกค้า", children: h?.tel || "" },
      { label: "เงื่อนไขการชำระเงิน", children: h?.payment || "" },
      {
        label: "วันครบกำหนดชำระเงิน",
        children: h?.duedate ? dayjs(h.duedate).format("DD/MM/YYYY") : "",
      },
      {
        label: "หมายเหตุ",
        labelStyle: { verticalAlign: "top" },
        children: <pre style={{ margin: 0 }}>{h?.remark || ""}</pre>,
        span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
      },
    ];
    setMasterItems(items);
  };

  const buildLastUpdateInfo = (h) => {
    const items = [
      {
        label: "สร้างโดย",
        children: h?.created_by || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      {
        label: "วันที่สร้าง",
        children: h?.created_date
          ? dayjs(h.created_date).format("DD/MM/YYYY HH:mm:ss")
          : "",
      },
      {
        label: "อัพเดทล่าสุด",
        children: h?.updated_by || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      {
        label: "วันที่อัพเดท",
        children: h?.updated_date
          ? dayjs(h.updated_date).format("DD/MM/YYYY HH:mm:ss")
          : "",
      },
    ];
    setLastItems(items);
  };

  const buildDetailItems = (detail = []) => {
    const data = Array.isArray(detail) ? detail : [];

    const tableNode = (
      <Table
        style={{ backgroundColor: "#fafafa" }}
        dataSource={data}
        columns={blViewColumns}
        pagination={false}
        rowKey={(r) => r?.stcode ?? r?.id ?? r?.key ?? r?.seq}
        scroll={{ x: "max-content" }}
        size="small"
        summary={(pageData) => {
          const total = (pageData || []).reduce((sum, r) => {
            return sum + Number(r?.qty || 0) * Number(r?.price || 0);
          }, 0);
          const discount = Number(master?.discount || 0);
          const grandTotal = total - discount;

          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="end" className="!pe-2">
                  Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right" className="!pe-2">
                  <Typography.Text>
                    {formatMoney(total, 2)}
                  </Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="end" className="!pe-2">
                  ส่วนลด
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right" className="!pe-2">
                  <Typography.Text>
                    {formatMoney(discount, 2)}
                  </Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="end" className="!pe-2">
                  Grand Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right" className="!pe-2">
                  <Typography.Text type="danger">
                    {formatMoney(grandTotal, 2)}
                  </Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          );
        }}
      />
    );

    const d = [
      {
        key: "1",
        label: "Billing Items",
        children: tableNode,
        disabled: true,
        showArrow: false,
      },
    ];
    setDetailItems(d);
  };

  const handlePrint = () => {
    if (!blCode) return;
    const url = `/bl-print/${blCode}`;
    const newWindow = window.open("", url, url);
    newWindow.location.href = url;
  };

  const handleClose = () => {
    navigate("/billing", { replace: true });
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
      <Button
        icon={<PrinterOutlined />}
        onClick={handlePrint}
        className="bn-center bn-primary-outline"
      >
        Print Billing
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
      className="bl-view"
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

      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        items={lastItems}
      />
    </Space>
  );
}
