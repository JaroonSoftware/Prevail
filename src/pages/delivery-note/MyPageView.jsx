/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Row, Col, Space, Descriptions, Table, Collapse } from "antd";
import { Typography, Button, Form, message } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { TbBasketCheck } from "react-icons/tb";
import dayjs from "dayjs";

import DeliveryNoteService from "../../service/DeliveryNote.service";

import { TagDeliveryNoteStatus } from "../../components/badge-and-tag";
import { formatMoney } from "../../utils/util";
import { soViewColumns } from "./model";
import useConfirm from "../../store/hook/use-confirm.hook";

import "./MyPage.css";

const dnservice = DeliveryNoteService();

export default function DeliveryNoteView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };

  const [form] = Form.useForm();
  const [master, setMaster] = useState({});
  const [masterItems, setMasterItems] = useState([]);
  const [detailItems, setDetailItems] = useState([]);
  const [lastItems, setLastItems] = useState([]);
  const [dnCode, setDnCode] = useState(null);

  const confirm = useConfirm();

  useEffect(() => {
    const initial = async () => {
      if (!config?.code) return;
      try {
        const res = await dnservice.get(config.code);
        // NOTE: DN manage.get() returns { header, detail } (based on Manage page)
        const { header, detail } = res.data;

        setMaster(header || {});
        setDnCode(header?.dncode || "");
        form.setFieldsValue({
          ...header,
          dndate: header?.dndate ? dayjs(header.dndate) : undefined,
        });

        buildMasterItems(header || {});
        buildDetailItems(detail || []);
        buildLastUpdateInfo(header || {});
      } catch (err) {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "Fail to load Delivery Note");
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
      { label: "เลขที่ใบส่งของ", children: h?.dncode || "" },
      {
        label: "วันที่ใบส่งของ",
        children: h?.dndate ? dayjs(h.dndate).format("DD/MM/YYYY") : "",
      },
      {
        label: "สถานะ",
        children: <TagDeliveryNoteStatus result={h?.doc_status} />,
      },
      { label: "รหัสลูกค้า", children: h?.cuscode || "" },
      {
        label: "ชื่อลูกค้า",
        children: h?.cusname || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      // {
      //   label: "วันที่นัดส่งสินค้า",
      //   children: h?.deldate ? dayjs(h.deldate).format("DD/MM/YYYY") : "",
      // },
      {
        label: "ที่อยู่",
        children: h?.address || h?.cusaddress || "",
        span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
      },
      { label: "ผู้ติดต่อ", children: h?.contact || "" },
      { label: "เบอร์โทรลูกค้า", children: h?.tel || "" },
      {
        label: "สถานะตัดสต๊อก",
        children: <TagDeliveryNoteStatus result={h?.issue_status} />,
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
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={7}></Table.Summary.Cell>
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
        key: "1",
        label: "Delivery Note Items",
        children: tableNode,
        disabled: true,
        showArrow: false,
      },
    ];
    setDetailItems(d);
  };

  const handlePrint = () => {
    const url = `../dn-print/${dnCode}`;
    const newWindow = window.open("", url, url);
    newWindow.location.href = url;
  };

  const handleClose = () => {
    navigate("/delivery-note", { replace: true });
  };

  const handleIssue = async (data) => {
    // alert("ยังไม่สามารถใช้งานได้ในขณะนี้");
    const result = await confirm.confirm({
      content: "คุณต้องการที่จะตัดสต๊อกหรือไม่",
    });
    if (!!result) {
      await dnservice
        .issue(data?.dncode)
        .then((r) => {
          // console.log(r);
          // handleSearch();
          message.success("ตัดสต๊อกสำเร็จ");
        })
        .catch((err) => {
          console.log(err);
          message.error(err.response.data.message);
        });
    }
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
      {master.issue_status === "ยังไม่ตัดสต๊อก" && (
        <Button
                  icon={<TbBasketCheck style={{fontSize:'1rem'}}/>} 
                  className='bn-center bn-success-outline'
                  onClick={(e) => handleIssue(master)}
                >ยืนยัน/ตัดสต๊อก</Button>
      )}
      <Button icon={<PrinterOutlined />} onClick={handlePrint} className='bn-center bn-primary-outline'>
        Print Delivery Note
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
      className="dn-view"
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
