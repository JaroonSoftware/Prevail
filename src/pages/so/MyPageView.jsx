import DocumentLink from "../../components/DocumentLink";
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Row, Col, Space, Descriptions, Table, Collapse } from "antd";
import { Typography, Button, Form, message, Modal, Alert } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";

import dayjs from "dayjs";

import SOService from "../../service/SO.service";

import { TagSalesOrderStatus } from "../../components/badge-and-tag";
import { formatMoney } from "../../utils/util";
import { soViewColumns } from "./model";

import "./MyPage.css";

import AiSoImportService from "../../service/AiSoImport.service";
import AuditInfo from "../../components/AuditInfo";
const aiSoService = AiSoImportService();
const soservice = SOService();
const dateFormat = "DD/MM/YYYY";

export default function SOView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };

  const [form] = Form.useForm();
  const [master, setMaster] = useState({});
  const [pending, setPending] = useState([]);
  const [cancelling, setCancelling] = useState(false);
  const [masterItems, setMasterItems] = useState([]);
  const [detailItems, setDetailItems] = useState([]);
  const [lastItems, setLastItems] = useState([]);
  const [soCode, setSoCode] = useState(null);

  useEffect(() => {
    const initial = async () => {

      if (!config?.code) return;
      try {
        const res = await soservice.get(config.code);
        const {
          data: { header, detail },
        } = res.data;

        setMaster(header || {});
        setSoCode(header?.socode || "");
        form.setFieldsValue({
          ...header,
          sodate: header?.sodate ? dayjs(header.sodate) : undefined,
        });

        buildMasterItems(header || {});
        buildDetailItems(detail || [], header || {});
        setPending([]);
        if (header?.doc_status === 'รอยืนยันใบขายสินค้า') {
          const result = await aiSoService.pending(header.socode);
          setPending(result?.data?.data || []);
        }
        buildLastUpdateInfo(header || {});
      } catch (err) {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "Fail to load Sales Order");
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
      { label: "เลขที่ใบขายสินค้า", children: <DocumentLink type="socode" code={h?.socode} /> },
      {
        label: "วันที่ใบขายสินค้า",
        children: h?.sodate ? dayjs(h.sodate).format("DD/MM/YYYY") : "",
      },
      {
        label: "สถานะ",
        children: <TagSalesOrderStatus result={h?.doc_status} />,
      },
      { label: "รหัสลูกค้า", children: h?.cuscode || "" },
      {
        label: "ชื่อลูกค้า",
        children: h?.cusname || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      { label: "วันที่นัดส่งสินค้า", children: h?.deldate ? dayjs(h.deldate).format("DD/MM/YYYY") : "" },
      /* ข้อมูลที่บันทึกในใบขายแต่เดิมหน้าดูไม่ได้แสดง */
      { label: "PO ลูกค้า", children: h?.customer_po || "-" },
      { label: "ห้องครัว", children: h?.del_room || "-" },
      { label: "เลขประจำตัวผู้เสียภาษี", children: h?.taxnumber || "-" },
      
      { label: "ที่อยู่", children: h?.address || h?.cusaddress || "" ,span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },},
      { label: "ผู้ติดต่อ", children: h?.contact || "" },
      { label: "เบอร์โทรลูกค้า", children: h?.tel || "" },
      {
        label: "สถานะปริ้น",
        children: <TagSalesOrderStatus result={h?.print_status} />,
      },
      {
        label: "หมายเหตุ",
        labelStyle: { verticalAlign: "top" },
        children: (
          <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", minWidth: 0 }}>
            {h?.remark || ""}
          </div>
        ),
        span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
      },
    ];
    setMasterItems(items);
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

  const buildDetailItems = (detail = [], h = {}) => {
    const data = Array.isArray(detail) ? detail : [];

    const tableNode = (
      <Table
        style={{ backgroundColor: "#fafafa" }}
        dataSource={data}
        columns={soViewColumns}
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
          /* ส่วนลดรวม % ของใบขาย (คิดจากยอดก่อน VAT) */
          const pct = Number(h?.discount_pct || 0);
          const subtotal = (pageData || []).reduce((sum, r) => sum + Number(r?.qty || 0) * Number(r?.price || 0), 0);
          const discount = Math.round(subtotal * pct) / 100;
          const row = (label, value, strong) => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={7}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="end" className="!pe-2">{strong ? <b>{label}</b> : label}</Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right" className="!pe-2">
                <Typography.Text type="danger" strong={strong}>{value}</Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
          // 9 คอลัมน์ด้านบน => เว้น 7 ช่องซ้าย ให้ป้ายอยู่คอลัมน์ 8 และยอดคอลัมน์ 9
          return (
            <>
              {row("Grand Total", formatMoney(totalNet, 2))}
              {/* แสดงตลอด (ไม่มีส่วนลด = 0) จะได้ไม่งงว่าหายไปไหน */}
              {row(pct > 0 ? `ส่วนลดรวม ${pct}%` : "ส่วนลดรวม", pct > 0 ? "-" + formatMoney(discount, 2) : formatMoney(0, 2))}
              {row("ยอดสุทธิ", formatMoney(totalNet - discount, 2), true)}
            </>
          );
        }}
      />
    );

    const d = [
      {
        key: "1",
        label: "Sales Order Items",
        children: tableNode,
        disabled: true,
        showArrow: false,
      },
    ];
    setDetailItems(d);
  };

  const canCancel = master.active_status === 'Y' && ['รอยืนยันใบขายสินค้า', 'รอออกใบส่งของ'].includes(master.doc_status);
  const handleCancel = () => {
    if (!canCancel || !soCode || cancelling) return;
    Modal.confirm({ title: 'ยืนยันยกเลิกใบขาย ' + soCode + '?', okText: 'ยกเลิกใบขาย', cancelText: 'กลับ', okType: 'danger',
      async onOk() {
        setCancelling(true);
        try {
          await soservice.deleted(soCode);
          setMaster((h) => ({ ...h, active_status: 'N', doc_status: 'ยกเลิก' }));
          message.success('ยกเลิกใบขายเรียบร้อยแล้ว');
        } catch (err) { message.error(err?.response?.data?.message || 'ยกเลิกไม่สำเร็จ'); throw err; }
        finally { setCancelling(false); }
      }
    });
  };
  const handlePrint = () => {
    const url = `/so-print/${soCode}`;
    const newWindow = window.open("", url, url);
    newWindow.location.href = url;
  };

  const handleClose = () => {
    location.state?.documentReturn ? navigate(-1) : navigate("/sales-order", { replace: true });
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
      <Button danger disabled={!canCancel} loading={cancelling} onClick={handleCancel}>ยกเลิกใบขาย</Button>
      <Button icon={<PrinterOutlined />} onClick={handlePrint} type="primary" >
        Print SO
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
      className="so-view"
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

      {pending.length > 0 && <>
        <Alert type="warning" showIcon message={'สินค้าจาก PO รอจับคู่ ' + pending.length + ' รายการ (แยกจากรายการสินค้าด้านล่าง)'} />
        <Table size="small" rowKey="pending_id" dataSource={pending} pagination={false} columns={[
          { title: 'ลำดับใน PO', dataIndex: 'seq' }, { title: 'ข้อความรอจับคู่', dataIndex: 'raw_name' },
          { title: 'รหัสใน PO', dataIndex: 'raw_code', render: (v) => v || '-' },
          { title: 'จำนวน', dataIndex: 'qty' }, { title: 'หน่วย', dataIndex: 'unit' }
        ]} />
      </>}
      <AuditInfo data={master} style={{ marginBottom: 8 }} />
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
