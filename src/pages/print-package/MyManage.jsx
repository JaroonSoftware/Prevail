import { isPackedPrinted as isPackedPrintedForValidation } from "./model";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  // Modal,
  Collapse,
  Table,
  Typography,
  message,
} from "antd";
import { Card, Col, Divider, Flex, Row, Space, Modal } from "antd";
import OptionService from "../../service/Options.service";
import PackageService from "../../service/Package.service";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";
import ModalPreviewPKBarcode from "../../components/modal/print-weight/ModalPreviewPKBarcode";
import {
  soForm,
  columnsParametersEditable,
  componentsEditable,
  columnsParametersInCollape,
} from "./model";
import { ModalItems } from "../../components/modal/itemsbyCL/modal-items";
import dayjs from "dayjs";
import { formatMoney } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation } from "react-router-dom";
import { BarcodeOutlined, PrinterOutlined } from "@ant-design/icons";
// import { useReactToPrint } from "react-to-print";

const opservice = OptionService();
const pkservice = PackageService();

const gotoFrom = "/print-weight";
const dateFormat = "DD/MM/YYYY";

function MyManage() {
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);

  /** SaleOrder state */
  const [soCode, setSOCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(soForm);

  const [unitOption, setUnitOption] = React.useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [resultData, setResultData] = useState([]);

  const printRef = useRef();

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
        const res = await pkservice
          .get(config?.code)
          .catch((error) => message.error("get SaleOrder data fail."));
        const {
          data: { header, detail },
        } = res.data;
        const { socode, sodate } = header;
        setFormDetail(header);
        /* ติด _rowKey ที่ไม่ซ้ำให้ทุกแถวตั้งแต่ตอนโหลด
           ใช้ stcode เป็น rowKey ไม่ได้ เพราะใบขายเดียวกันใส่สินค้าตัวเดียวกัน
           ซ้ำหลายบรรทัดได้ (คนละราคา/คนละหน่วย) แล้วติ๊กทีเดียวจะเลือกติดกันหมด */
        setListDetail(
          (detail || []).map((item, i) => ({
            ...item,
            _rowKey: `${item?.socode ?? ""}::${item?.stcode ?? ""}::${i}`,
          }))
        );
        setSOCode(socode);
        form.setFieldsValue({ ...header, sodate: dayjs(sodate) });

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

    const total_price = newData.reduce(
      (a, v) =>
        (a +=
          Number(v.qty || 0) *
            Number(v?.price || 0) *
            (1 - Number(v?.discount || 0) / 100) +
          Number(v.qty || 0) *
            Number(v?.price || 0) *
            (1 - Number(v?.discount || 0) / 100) *
            (v.vat / 100)),
      0
    );

    setFormDetail(() => ({
      ...formDetail,
      total_price,
    }));
    // console.log(formDetail)
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

  const handleSO = (e) => {
    const { valid_price_until } = form.getFieldsValue();
    if (!!valid_price_until && !!e) {
      handleCalculatePrice(valid_price_until || 0, e || new Date());
    }
  };

  /** Function modal handle */
  const handleChoosedCustomer = (val) => {
    // console.log(val)
    const fvalue = form.getFieldsValue();
    const addr = [
      !!val?.idno ? `${val.idno} ` : "",
      !!val?.road ? `${val?.road} ` : "",
      !!val?.subdistrict ? `${val.subdistrict} ` : "",
      !!val?.district ? `${val.district} ` : "",
      !!val?.province ? `${val.province} ` : "",
      !!val?.zipcode ? `${val.zipcode} ` : "",
      !!val?.country ? `(${val.country})` : "",
    ];
    const customer = {
      ...val,
      cusaddress: addr.join(""),
      cuscontact: val.contact,
      custel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customer }));
    form.setFieldsValue({ ...fvalue, ...customer });
  };

  const handleItemsChoosed = (value) => {
    /* ติด _rowKey ให้รายการที่เลือกใหม่ด้วย ไม่งั้นตารางจะไม่มี key ที่ไม่ซ้ำ */
    setListDetail(
      (value || []).map((item, i) => ({
        ...item,
        _rowKey: item?._rowKey || `${item?.socode ?? ""}::${item?.stcode ?? ""}::${i}`,
      }))
    );
    handleSummaryPrice();
  };

  /* ล้าง barcode ที่สร้างไว้แล้วของรายการที่เลือก (เฉพาะแถวที่ปริ้นแล้ว) เพื่อปริ้นใหม่ */
  const handleClearBarcode = () => {
    const rows = selectedData.filter((it) => isPackedPrintedForValidation(it));
    if (!rows.length) return message.warning("เลือกรายการที่ปริ้นหน้าถุงแล้วก่อน");
    Modal.confirm({
      title: `ล้าง barcode ${rows.length} รายการ?`,
      content: (
        <>
          {rows.map((r) => <div key={r._rowKey}>• {r.stcode} {r.stname} ({r.qty} {r.unit})</div>)}
          <div style={{ color: "#cf1322", marginTop: 8 }}>
            สติ๊กเกอร์ที่ปริ้นไปแล้วจะใช้สแกนไม่ได้ ต้องปริ้นใหม่และเปลี่ยนสติ๊กเกอร์บนถุงทั้งหมด
            · ถุงที่สแกนส่งของไปแล้วล้างไม่ได้
          </div>
        </>
      ),
      okText: "ล้าง barcode", okType: "danger", cancelText: "ยกเลิก",
      onOk: () =>
        pkservice
          .clearpackage({ detail: rows.map((r) => ({ socode: r.socode, stcode: r.stcode, code: r.code })) })
          .then(async () => {
            message.success("ล้าง barcode แล้ว — เลือกรายการแล้วกด Print เพื่อปริ้นใหม่");
            const res = await pkservice.get(config?.code);
            const detail = res?.data?.data?.detail || [];
            setListDetail(detail.map((item, i) => ({ ...item, _rowKey: `${item?.socode ?? ""}::${item?.stcode ?? ""}::${i}` })));
            setSelectedData([]);
          })
          .catch((err) => {
            message.error(err?.response?.data?.message || "ล้าง barcode ไม่สำเร็จ");
          }),
    });
  };

  /* คำนวณน้ำหนักต่อถุงใหม่ — ใช้ได้ทั้งแถวที่ปริ้นแล้วและยังไม่ปริ้น
     ถ้ามี barcode อยู่จะล้างให้ด้วย แล้วดึงน้ำหนักต่อถุงล่าสุด (แคตตาล็อกลูกค้า > ข้อมูลสินค้า) */
  const handleRepack = async () => {
    const rows = selectedData;
    if (!rows.length) return message.warning("เลือกรายการก่อน");
    const detail = rows.map((r) => ({ socode: r.socode, stcode: r.stcode, code: r.code }));

    /* 1) ขอผลล่วงหน้าจาก server (ยังไม่บันทึกอะไร) */
    let pv;
    try {
      const r = await pkservice.clearpackage({ repack: true, preview: true, detail });
      pv = r?.data?.data || {};
    } catch (err) {
      return message.error(err?.response?.data?.message || "คำนวณน้ำหนักต่อถุงใหม่ไม่สำเร็จ");
    }
    const up = pv.updated || [];
    const nameOf = (u) => rows.find((r) => String(r.code) === String(u.code))?.stname
      || rows.find((r) => r.stcode === u.stcode)?.stname || "";
    const same = (u) => Number(u.old ?? 0) === Number(u.new ?? 0);
    const changed = up.filter((u) => !same(u));
    const removed = Number(pv.removed || 0);

    if (!changed.length && !removed) return message.info("น้ำหนักต่อถุงเป็นค่าล่าสุดอยู่แล้ว ไม่มีอะไรต้องแก้");

    /* 2) แสดงสิ่งที่จะแก้ แล้วให้ยืนยันอีกครั้ง */
    const cell = { padding: "4px 8px", borderBottom: "1px solid #f0f0f0" };
    Modal.confirm({
      width: 640,
      title: "ยืนยันคำนวณน้ำหนักต่อถุงใหม่",
      content: (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead><tr style={{ background: "#fafafa" }}>
              <th style={{ ...cell, textAlign: "left" }}>สินค้า</th>
              <th style={{ ...cell, textAlign: "right" }}>เดิม</th>
              <th style={cell}></th>
              <th style={{ ...cell, textAlign: "right" }}>ใหม่</th>
            </tr></thead>
            <tbody>
              {up.map((u, i) => (
                <tr key={i} style={same(u) ? { color: "#999" } : { fontWeight: 600 }}>
                  <td style={cell}>{u.stcode} {nameOf(u)}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{u.old ?? "-"}</td>
                  <td style={{ ...cell, textAlign: "center" }}>→</td>
                  <td style={{ ...cell, textAlign: "right", color: same(u) ? undefined : "#389e0d" }}>
                    {u.new ?? "-"} {same(u) ? "(เท่าเดิม)" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10 }}>เปลี่ยน {changed.length} รายการ (หน่วยต่อถุงตามหน่วยสินค้า)</div>
          {removed > 0 && (
            <div style={{ color: "#cf1322", marginTop: 6 }}>
              จะล้าง barcode {removed} ถุง — สติ๊กเกอร์เดิมใช้สแกนไม่ได้ ต้องปริ้นและเปลี่ยนสติ๊กเกอร์ใหม่
            </div>
          )}
        </>
      ),
      okText: "ยืนยัน แก้ไข", cancelText: "ยกเลิก",
      onOk: () =>
        pkservice
          .clearpackage({ repack: true, detail })
          .then(async () => {
            message.success(`อัปเดตน้ำหนักต่อถุงแล้ว ${changed.length} รายการ`);
            const res = await pkservice.get(config?.code);
            const d = res?.data?.data?.detail || [];
            setListDetail(d.map((item, i) => ({ ...item, _rowKey: `${item?.socode ?? ""}::${item?.stcode ?? ""}::${i}` })));
            setSelectedData([]);
          })
          .catch((err) => {
            message.error(err?.response?.data?.message || "คำนวณน้ำหนักต่อถุงใหม่ไม่สำเร็จ");
          }),
    });
  };

  const handlePrint = () => {
    /* รวมบรรทัดที่รหัสสินค้าซ้ำกันให้เหลือรายการเดียวก่อนส่ง

       ฝั่ง backend ผูก package_barcode ไว้กับ socode + stcode เท่านั้น
       ไม่มีตัวระบุว่าเป็นบรรทัดไหนของใบขาย ถ้าส่งสินค้าตัวเดียวกันไป
       หลายบรรทัด จะเกิดปัญหาต่อกันเป็นทอด:
         1. บรรทัดแรกสร้างถุง แล้วสั่ง update packing_status
            ด้วยเงื่อนไข socode+stcode ซึ่งไปโดนบรรทัดที่ซ้ำกันทั้งหมด
         2. พอวนมาบรรทัดที่ 2 ระบบเห็นว่า "ปริ้นแล้ว" เลยข้ามการสร้างถุง
            แล้วไปดึงถุงของบรรทัดแรกมาแสดงซ้ำ
         -> ได้ฉลากซ้ำ จำนวนถุงขาด และน้ำหนักไม่ตรงกับที่สั่ง

       รวมจำนวนเข้าด้วยกันก่อนจึงถูกต้องกว่า เพราะถุงเป็นของจริงทางกายภาพ
       สินค้าตัวเดียวกันย่อมใช้ packing_weight เดียวกัน (มาจากตาราง items) */
    /* selectedData เป็นภาพ ณ ตอนติ๊กเลือก ถ้าผู้ใช้ติ๊กก่อนแล้วค่อยแก้
       "น้ำหนักสูงสุดต่อถุง" ค่าที่แก้จะไม่ติดมาด้วย ดึงแถวล่าสุดจาก
       listDetail ด้วย _rowKey ทุกครั้งก่อนส่ง */
    const latestByKey = new Map(listDetail.map((it) => [it?._rowKey, it]));
    const picked = selectedData.map((it) => latestByKey.get(it?._rowKey) || it);

    /* ไม่รวมบรรทัดที่รหัสสินค้าซ้ำแล้ว: ส่งทีละบรรทัดพร้อม code (sodetail.code)
       backend แยกถุงตามบรรทัด (ถ้ารัน sql/2026-11-11_package_barcode_line.sql แล้ว)
       ถ้ายังไม่รัน backend จะรวมตามรหัสสินค้าให้เองแบบเดิม */
    const chosen = picked.map((it) => ({ ...it, qty: Number(it?.qty || 0) }));

    /* กันส่งค่าที่แบ่งถุงไม่ได้ไปให้ backend (0 หรือติดลบ = ไม่เกิดถุงเลย
       หรือวนสร้างถุงไม่รู้จบ) เช็คตั้งแต่หน้าจอจะบอกได้ตรงกว่า */
    const bad = chosen.find((it) => !isPackedPrintedForValidation(it) && !(Number(it?.packing_weight) > 0));
    if (bad) {
      message.error(
        `กรุณากรอกน้ำหนักสูงสุดต่อถุงของ ${bad?.stcode ?? ""} ให้มากกว่า 0`
      );
      return;
    }

    let obj = { detail: chosen };

    pkservice
      .printpackage(obj)
      .then((r) => {
        const raw = r?.data?.data;

        /* backend เวอร์ชันเก่าอาจคืนเป็น object เมื่อ index ขาดช่วง
           (เช่น {"0":[...],"2":[...]}) แทนที่จะเป็น array แปลงให้รองรับทั้งสองแบบ */
        const groups = Array.isArray(raw)
          ? raw
          : raw && typeof raw === "object"
          ? Object.values(raw)
          : [];

        const withUnit = groups.map((group, gi) =>
          (Array.isArray(group) ? group : []).map((item) => ({
            ...item,
            unit: item?.unit || chosen[gi]?.unit || "",
          }))
        );

        const total = withUnit.reduce((n, g) => n + g.length, 0);
        if (total < 1) {
          /* ไม่เปิด modal เปล่าๆ ให้งง บอกไปเลยว่าไม่มีฉลากถูกสร้าง */
          console.warn("print-pk.php ตอบกลับ:", raw);
          message.warning(
            "ไม่มีฉลากถูกสร้าง — รายการนี้อาจถูกมาร์คว่าปริ้นแล้ว แต่ไม่มีข้อมูลถุงใน package_barcode"
          );
          return;
        }

        setResultData(withUnit);
        setOpenPrint(true);
      })
      .catch((err) => {
        /* แสดงข้อความจริงจาก API แทนข้อความรวมๆ จะได้รู้ว่าพังตรงไหน */
        const msg =
          err?.response?.data?.message || err?.message || "Something went wrong !";
        console.error("print-pk.php error:", err?.response?.data ?? err);
        message.error(msg);
      });
  };

  const handleRemove = (record) => {
    const itemDetail = [...listDetail];
    return itemDetail.length >= 1 ? (
      <Button
        className="bt-icon"
        icon={
          <BarcodeOutlined
            style={{ fontSize: "1rem", marginTop: "3px", color: "##2ecc71" }}
          />
        }
      />
    ) : null;
  };

  const handleEditCell = (row) => {
    const newData = (r) => {
      const itemDetail = [...listDetail];
      const newData = [...itemDetail];

      /* หาแถวด้วย _rowKey ไม่ใช่ stcode ไม่งั้นถ้าสินค้าซ้ำกันหลายบรรทัด
         การแก้บรรทัดล่างจะไปเขียนทับบรรทัดแรกที่เจอแทน */
      const ind = newData.findIndex((item) => r?._rowKey === item?._rowKey);
      if (ind < 0) return itemDetail;
      const item = newData[ind];
      newData.splice(ind, 1, {
        ...item,
        ...row,
      });

      handleSummaryPrice();
      return newData;
    };
    setListDetail([...newData(row)]);
  };

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
      setSelectedData(selectedRows);
      // console.log(selectedData)
    },
  };

  /** setting column table */
  const prodcolumns = columnsParametersEditable(handleEditCell, unitOption, {
    handleRemove,
  });

  const prodcolumnsincollape = columnsParametersInCollape(
    handleEditCell,
    unitOption,
    {
      handleRemove,
    }
  );

  const SectionCustomer = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item
              name="cuscode"
              htmlFor="cuscode-1"
              label="รหัสลูกค้า"
              className="!mb-1"
              rules={[{ required: true, message: "Missing Loading type" }]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือก ลูกค้า"
                  id="cuscode-1"
                  value={formDetail.cuscode}
                  className="!bg-white"
                />
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input
                placeholder="Customer Name."
                readOnly
                className="!bg-white"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input
                placeholder="Customer Address."
                readOnly
                className="!bg-white"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="contact" label="ผู้ติดต่อ" className="!mb-1">
              <Input
                placeholder="Customer Contact."
                readOnly
                className="!bg-white"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="tel" label="เบอร์โทรลูกค้า" className="!mb-1">
              <Input
                placeholder="Customer Tel."
                readOnly
                className="!bg-white"
              />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );

  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการหน้าถุงสินค้า
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end" gap={8}>
          <Button
            danger
            className="bn-center justify-center"
            disabled={!selectedData.some((it) => isPackedPrintedForValidation(it))}
            onClick={handleClearBarcode}
          >
            ล้าง barcode
          </Button>
          <Button
            className="bn-center justify-center"
            disabled={selectedData.length < 1}
            onClick={handleRepack}
          >
            คำนวณน้ำหนักต่อถุงใหม่
          </Button>
          <Button
            icon={<PrinterOutlined style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
            if (selectedData.length < 1) throw message.error("กรุณาเลือกสินค้าก่อนปริ้น");
              handlePrint();
            }}
          >
            Print
          </Button>
        </Flex>
      </Col>
    </Flex>
  );
  const TitleTableIncollape = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการใบขายสินค้า
          </Typography.Title>
        </Flex>
      </Col>
    </Flex>
  );
  const SectionProduct = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTable}
          rowSelection={{
            type: "checkbox",
            ...rowSelection,
            /* คุมการติ๊กจาก state ให้ล้างติ๊กได้หลังล้าง barcode */
            selectedRowKeys: selectedData.map((r) => r._rowKey),
          }}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          readOnly
          dataSource={listDetail}
          columns={prodcolumns}
          pagination={false}
          rowKey="_rowKey"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          summary={(record) => {
            return <>{listDetail.length > 0}</>;
          }}
        />
      </Flex>
    </>
  );
  const SectionProductIncollpe = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTableIncollape}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listDetail}
          columns={prodcolumnsincollape}
          pagination={false}
          rowKey="_rowKey"
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
                      <Table.Summary.Cell
                        index={0}
                        colSpan={7}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={4}
                        align="end"
                        className="!pe-4"
                      >
                        Grand Total
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {formatMoney(Number(formDetail?.total_price || 0), 2)}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell className="!pe-4 text-end">
                        Baht
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )}
              </>
            );
          }}
        />
      </Flex>
    </>
  );
  const SectionOther = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item name="remark" label="Remark">
              <Input.TextArea placeholder="Enter Remark" rows={4} />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );

  ///** button */

  const back = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          <ButtonBack target={gotoFrom} />
        </Flex>
      </Col>
    </Row>
  );

  return (
    <div className="quotation-manage">
      <div id="quotation-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {back}
          <Form
            form={form}
            layout="vertical"
            className="width-100"
            autoComplete="off"
          >
            {/* style={{ backgroundColor: "red" }} */}
            <Card
              title={
                <>
                  <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Typography.Title level={3} className="m-0">
                        รหัสใบขายสินค้า : {soCode}
                      </Typography.Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Flex
                        gap={10}
                        align="center"
                        className="justify-start sm:justify-end"
                      >
                        <Typography.Title level={3} className="m-0">
                          วันที่ใบขายสินค้า :
                        </Typography.Title>
                        <Form.Item name="sodate" className="!m-0">
                          <DatePicker
                            className="input-40"
                            disabled
                            allowClear={false}
                            onChange={handleSO}
                            format={dateFormat}
                          />
                        </Form.Item>
                      </Flex>
                    </Col>
                  </Row>
                </>
              }
            >
              <Collapse
                items={[
                  {
                    key: "1",
                    label: "ข้อมูลใบขายสินค้า",
                    children: (
                      <Row className="m-0" gutter={[12, 12]}>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                          <Divider orientation="left" className="!mb-3 !mt-1">
                            Customer
                          </Divider>
                          <Card style={cardStyle}>{SectionCustomer}</Card>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                          <Divider orientation="left" className="!mb-3 !mt-1">
                            รายละเอียดอื่นๆ
                          </Divider>
                          <Card style={cardStyle}>{SectionOther}</Card>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                          <Divider orientation="left" className="!mb-3 !mt-1">
                            Product
                          </Divider>
                          <Card style={{ backgroundColor: "#f0f0f0" }}>
                            {SectionProductIncollpe}
                          </Card>
                        </Col>
                      </Row>
                    ),
                  },
                ]}
              />
              <br></br>
              <Divider orientation="left" className="!mb-3 !mt-1">
                Print
              </Divider>
              <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                <Card style={{ backgroundColor: "#f0f0f0" }}>
                  {SectionProduct}
                </Card>
              </Col>
            </Card>
          </Form>
          {back}
        </Space>
      </div>

      {openCustomer && (
        <ModalCustomers
          show={openCustomer}
          close={() => setOpenCustomer(false)}
          values={(v) => {
            handleChoosedCustomer(v);
          }}
        ></ModalCustomers>
      )}

      {openProduct && (
        <ModalItems
          show={openProduct}
          close={() => setOpenProduct(false)}
          values={(v) => {
            handleItemsChoosed(v);
          }}
          cuscode={form.getFieldValue("cuscode")}
          selected={listDetail}
        ></ModalItems>
      )}

      {openPrint && (
        <ModalPreviewPKBarcode
          show={openPrint}
          close={() => setOpenPrint(false)}
          printRef={printRef}
          printData={resultData}
          // isReprint={true}
        />
      )}
    </div>
  );
}

export default MyManage;
