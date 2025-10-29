/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Row, Col, Space, Descriptions, Table, Collapse,Empty } from "antd";
import { Typography, Button, message } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import ReceiptService from "../../service/Receipt.service";

import { TagReceiptStatus } from "../../components/badge-and-tag/";
import { formatMoney } from "../../utils/util";
import { reViewColumns, rePaymentViewColumns } from "./model";

import "./MyPage.css";

const reservice = ReceiptService();

export default function ReceiptView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };

  const [master, setMaster] = useState({});
  const [masterItems, setMasterItems] = useState([]);
  const [detailItems, setDetailItems] = useState([]);
  const [lastItems, setLastItems] = useState([]);
  const [reCode, setReCode] = useState(null);

  // Add: state for payment section
  const [paymentItems, setPaymentItems] = useState([]);

  useEffect(() => {
    const initial = async () => {
      if (!config?.code) return;
      try {
        const res = await reservice.get(config.code);
        // Receipt get() returns { data: { header, detail } }
        const { header, detail } = res?.data?.data || {};

        setMaster(header || {});
        setReCode(header?.recode || "");

        buildMasterItems(header || {});
        buildDetailItems(detail || []);

        // Add: build payments from API (or empty list)
        const payments = Array.isArray(header?.payments) ? header.payments : [];
        buildPaymentItems(payments);

        buildLastUpdateInfo(header || {});
      } catch (err) {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "Fail to load Receipt");
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
      { label: "เลขที่ใบเสร็จรับเงิน", children: h?.recode || "" },
      {
        label: "วันที่ใบเสร็จรับเงิน",
        children: h?.redate ? dayjs(h.redate).format("DD/MM/YYYY") : "",
      },
      {
        label: "สถานะ",
        children: <TagReceiptStatus result={h?.doc_status} />,
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
      {
        label: "ยอดรวมรับเงิน",
        children: formatMoney(Number(h?.total_price ?? h?.price ?? 0), 2),
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
        columns={reViewColumns}
        pagination={false}
        rowKey={(r) => r?.stcode ?? r?.id ?? r?.key ?? r?.seq}
        scroll={{ x: "max-content" }}
        size="small"
        summary={(pageData) => {
          const totalNet = (pageData || []).reduce((sum, r) => {
            const base = Number(r?.qty || 0) * Number(r?.price || 0);
            const net = base * (1 + Number(r?.vat || 0) / 100);
            return sum + net;
          }, 0);

          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="end" className="!pe-2">
                Grand Total
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right" className="!pe-2">
                <Typography.Text type="danger">
                  {formatMoney(totalNet, 2)}
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    );

    const d = [
      {
        key: "items",
        label: "Receipt Items",
        children: tableNode,
        disabled: true,
        showArrow: false,
      },
    ];
    setDetailItems(d);
  };

  // Add: Payment records section (view-only) with empty message
  const buildPaymentItems = (payments = []) => {
    const data = Array.isArray(payments) ? payments : [];

    const tableNode = (
      <Table
        style={{ backgroundColor: "#fafafa" }}
        dataSource={data}
        columns={rePaymentViewColumns}
        pagination={false}
        rowKey={(r) => r?.acc_no ?? r?.id ?? r?.key}
        scroll={{ x: "max-content" }}
        size="small"
        locale={{
          emptyText: <Empty style={{margin:"30px"}} description={<Typography.Text type="secondary">รอการชำระเงิน</Typography.Text>} />,
        }}
        summary={(pageData) => {
          const totalPaid = (pageData || []).reduce(
            (sum, r) => sum + Number(r?.amount || 0),
            0
          );
          // Show summary even when there are no rows? Keep it only when > 0.
          if (!pageData || pageData.length === 0) return null;
          return (
            <Table.Summary.Row>
              {/* rePaymentViewColumns has 6 columns; filler 4 + 2 cells */}
              <Table.Summary.Cell index={0} colSpan={4}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="end" className="!pe-2">
                Total Paid
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right" className="!pe-2">
                <Typography.Text type="success">
                  {formatMoney(totalPaid, 2)}
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    );

    const d = [
      {
        key: "payments",
        label: "รายการชำระเงิน",
        children: tableNode,
        disabled: true,
        showArrow: false,
      },
    ];
    setPaymentItems(d);
  };

  const handlePrint = () => {
    if (!reCode) return;
    const url = `/re-print/${reCode}`;
    const newWindow = window.open("", url, url);
    newWindow.location.href = url;
  };

  const handleClose = () => {
    navigate("/receipt", { replace: true });
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
        Print Receipt
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
      className="re-view"
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

      {/* Fix: use actual keys so the panel opens */}
      <Collapse
        size="large"
        className="view-collapse-sp"
        collapsible="disabled"
        activeKey={detailItems.map((p) => p.key)}
        bordered={false}
        style={{ backgroundColor: "transparent" }}
        items={detailItems}
      />

      {/* Add: Payment records section with empty message */}
      <Collapse
        size="large"
        className="view-collapse-sp"
        collapsible="disabled"
        activeKey={paymentItems.map((p) => p.key)}
        bordered={false}
        style={{ backgroundColor: "transparent" }}
        items={paymentItems}
      />

      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        items={lastItems}
      />
    </Space>
  );
}
