/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import "../delivery/delivery.css";
/* ต้องอยู่หลัง delivery.css เสมอ — ทับขนาดหน้ากระดาษเป็น Letter Fanfold 8.5 x 11 นิ้ว
   เฉพาะฟอร์มใบขายสินค้า ไม่กระทบใบส่งของ/ใบเสนอราคาที่ใช้ CSS ก้อนเดียวกัน */
import "./so.css";
import { Authenticate } from "../../../service/Authenticate.service";
import { Button, Flex, Table, Typography, message } from "antd";
/* คอลัมน์ของใบขายสินค้าโดยเฉพาะ — ห้ามใช้ delivery.model ตรงๆ
   เพราะไฟล์นั้นใช้ร่วมกับใบส่งของ แก้แล้วกระทบทั้งคู่ */
import { column } from "./so.model";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import SOService from "../../../service/SO.service";

const soservice = SOService();

/* ---- บังคับให้ช่อง "ขนาดกระดาษ" ใน dialog ปริ้นของ Chrome เด้งเป็น Letter Fanfold 8.5x11 เอง ----

   named page (@page so ใน so.css) คุมได้แค่ "กล่องหน้ากระดาษ" ตอน layout
   Chrome ไม่ได้เอาขนาดของ named page ไปตั้งค่าเริ่มต้นใน dialog ให้
   ค่าที่ dialog ใช้มาจาก @page แบบไม่มีชื่อ (ของทั้งเอกสาร) เท่านั้น
   ผู้ใช้เลยต้องไปเลือกขนาดกระดาษเองทุกครั้ง

   ทางออกคือแทรก @page ไม่มีชื่อ "เฉพาะตอนที่หน้าใบขายสินค้าเปิดอยู่"
   แล้วถอดออกตอน unmount จึงไม่รั่วไปหาฟอร์มอื่นเหมือน @page ใน CSS รวม
   ต้อง append ท้าย <head> ด้วย: react-to-print ก๊อป stylesheet ตามลำดับ
   ตัวที่มาทีหลังจึงชนะ */
const SO_PAGE_STYLE_ID = "so-print-page-size";
/* @page ไม่มีชื่อ = ค่าที่ Chrome ใช้ตั้งต้นให้ dialog
   ต้องประกาศ Tabloid ตรงนี้ด้วย ไม่งั้น dialog จะตกกลับไปใช้ A4 */
const SO_PAGE_STYLE = `@media print { @page { size: 11in 17in; margin: 0; } }`;

export default function SOPrintPreview() {
  const { code } = useParams();
  const componentRef = useRef(null);
  const authService = Authenticate();
  const [userInfo, setUserInfo] = useState(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print Sales Order",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  const [hData, setHData] = useState({});
  const [details, setDetails] = useState([]);

  const columnDesc = column;

  const [loading] = useState(false);

  const handleAfterPrint = () => {};
  const handleBeforePrint = () => {};

  useEffect(() => {
    const init = () => {
      soservice
        .get(code)
        .then(async (res) => {
          const {
            data: { header, detail },
          } = res.data;

          setHData(header || {});
          setDetails(detail || []);
        })
        .catch((err) => {
          console.log(err);
          message.error("Error getting infomation Sales Order.");
        });
    };

    init();
    return () => {};
  }, []);

  useEffect(() => {
    /* กันซ้ำ เผื่อ StrictMode เรียก effect สองรอบตอน dev */
    let el = document.getElementById(SO_PAGE_STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = SO_PAGE_STYLE_ID;
      el.appendChild(document.createTextNode(SO_PAGE_STYLE));
      document.head.appendChild(el);
    }
    return () => {
      /* ออกจากหน้านี้เมื่อไหร่ต้องเอาออกทันที ไม่งั้นฟอร์มอื่น
         ที่เปิดต่อใน SPA เดียวกันจะติดกระดาษ 8.5x11 ไปด้วย */
      const cur = document.getElementById(SO_PAGE_STYLE_ID);
      if (cur && cur.parentNode) cur.parentNode.removeChild(cur);
    };
  }, []);

  useEffect(() => {
    const users = authService.getUserInfo();
    setUserInfo(users);

    return () => {};
  }, []);

  const ContentHead = () => {
    return (
      <div className="content-head in-sample flex flex-col dnpv-header">
        <div className="print-title flex pb-2">
          <div className="flex ps-3 grow-0" style={{ width: "80%" }}>
            <Flex className="mb-1.5" vertical>
              <Typography.Text
                className="tx-title min-w-80 weight600"
                strong
                /* nowrap: ชื่อบริษัทยาวจนตกบรรทัด "จำกัด" ไปอยู่บรรทัดสอง
                   ลดขนาดลงหน่อยให้พอดีความกว้างคอลัมน์ซ้าย (80%) */
                style={{ fontSize: 21, whiteSpace: "nowrap" }}
              >
                บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
                60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
                TEL: 076 641 117, 098 192 9391
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
                เลขประจำตัวผู้เสียภาษี 083556101164 สำนักงานใหญ่
              </Typography.Text>
            </Flex>
          </div>

          <div className="flex ps-3 grow" style={{ float: "right" }}>
            <Flex className="mb-1.5" vertical style={{ paddingLeft: 0 }}>
              <Typography.Text
                className="tx-title min-w-48"
                style={{ textAlign: "right", fontSize: 17 }}
                strong
              >
                ใบขายสินค้า
              </Typography.Text>
            </Flex>
          </div>
        </div>
      </div>
    );
  };

  /* หัวเอกสารท่อนที่สอง: ซ้าย = ข้อมูลลูกค้า / ขวา = ข้อมูลเอกสาร

     ของเดิมดันค่าด้วย paddingLeft รายบรรทัด (65, 70, 33, 25, 35) ซึ่งต้อง
     ไล่เดาทีละบรรทัดและไม่เคยตรงกันจริง เปลี่ยนมาใช้ flex + ป้ายกำกับ
     ความกว้างคงที่ ค่าทุกบรรทัดจึงเริ่มที่เส้นเดียวกันเสมอ */
  const HeadRow = ({ label, labelWidth, children }) => (
    <div style={{ display: "flex", minHeight: 21 }}>
      {/* minWidth ไม่ใช่ width: ป้ายสั้น ๆ จะเรียงตรงกันที่ labelWidth
          ส่วนป้ายยาวอย่าง "เลขประจำตัวผู้เสียภาษี" ดันค่าของตัวเองไปทางขวา
          แทนที่จะบังคับให้ทุกบรรทัดเว้นห่างตามป้ายที่ยาวที่สุด */}
      <span
        style={{
          minWidth: labelWidth,
          flex: "0 0 auto",
          whiteSpace: "nowrap",
          paddingRight: 12,
        }}
      >
        {label}
      </span>
      <span>{children}</span>
    </div>
  );

  const ContentHead2 = () => {
    /* ความกว้างป้ายกำกับขั้นต่ำของแต่ละฝั่ง
       ซ้าย 55: อิง "ลูกค้า" ซึ่งเป็นป้ายที่สั้นที่สุด เพื่อให้
       รหัสลูกค้า/ชื่อ/ที่อยู่ ชิดซ้ายมากที่สุดเท่าที่ทำได้ ตามที่ลูกค้าขอ
       ป้ายที่ยาวกว่า ("ผู้ติดต่อ", "เลขประจำตัวผู้เสียภาษี") จะดันค่าของ
       ตัวเองไปทางขวาแทน
       ขวา 95: อิง "วันที่นัดส่ง" ซึ่งเป็นป้ายที่ยาวสุดฝั่งขวา */
    const LW = 55;
    const RW = 95;

    return (
      <div className="content-head in-sample flex flex-col dnpv-header">
        <div className="print-title flex pb-2">
          <Flex className="flex ps-3 grow-0" style={{ width: "60%" }}>
            <Flex vertical className="tx-info">
              <HeadRow label="ลูกค้า" labelWidth={LW}>
                {hData?.cuscode}
              </HeadRow>
              <HeadRow label="" labelWidth={LW}>
                {hData?.prename} {hData?.cusname}
              </HeadRow>
              <HeadRow label="" labelWidth={LW}>
                {hData?.address}
              </HeadRow>
              {/* เอาบรรทัดว่างคั่นออก ให้เลขผู้เสียภาษีขึ้นมาติดกับที่อยู่ */}
              {/* ใช้ taxnumber: c.idno คือบ้านเลขที่ ซึ่งถูกเอาไปประกอบ address
                  อยู่แล้ว ของเดิมดึง idno มาแสดงตรงนี้จึงขึ้น "-" ตลอด */}
              <HeadRow label="เลขประจำตัวผู้เสียภาษี" labelWidth={LW}>
                {hData?.taxnumber || "-"}
              </HeadRow>
              <HeadRow label="ผู้ติดต่อ" labelWidth={LW}>
                {hData?.contact || "-"}
              </HeadRow>
            </Flex>
          </Flex>
          <Flex className="flex ps-3 grow-0" style={{ width: "40%" }}>
            <Flex vertical className="tx-info">
              <HeadRow label="เลขที่" labelWidth={RW}>
                {hData?.socode}
              </HeadRow>
              <HeadRow label="วันที่" labelWidth={RW}>
                {hData?.sodate ? dayjs(hData.sodate).format("DD/MM/YYYY") : "-"}
              </HeadRow>
              <HeadRow label="PO ลูกค้า" labelWidth={RW}>
                {hData?.customer_po || "-"}
              </HeadRow>
              <HeadRow label="วันที่นัดส่ง" labelWidth={RW}>
                {hData?.deldate
                  ? dayjs(hData.deldate).format("DD/MM/YYYY")
                  : "-"}
              </HeadRow>
              <HeadRow label="ห้องครัว" labelWidth={RW}>
                {hData?.del_room || "-"}
              </HeadRow>
            </Flex>
          </Flex>
        </div>
      </div>
    );
  };

  const ReceiptSummary = () => {
    return (
      <>
        <Table.Summary.Row className="dnpv-footer">
          <Table.Summary.Cell
            /* ตารางมี 5 คอลัมน์ (No./รายละเอียด/จำนวน/หน่วยละ/จำนวนเงิน)
               ผลรวม colSpan ของแถวสรุปต้องเท่ากับ 5 พอดี
               ถ้าไม่เท่า antd จะคำนวณความกว้างคอลัมน์ของ "หน้าที่มีแถวสรุป"
               ต่างจากหน้าอื่น -> หน้าสุดท้ายตารางหดเล็กลงกว่าหน้าแรก */
            colSpan={3}
            className="!align-top !ps-0 !pe-0"
            style={{ height: 20 }}
          >
            <Flex
              style={{
                borderTop: "1px dashed",
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{ fontSize: 18, marginLeft: 10 }}
                strong
              >
                ({thaiBahtText(hData?.total_price || 0, 2, 2)}).
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0 !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{ fontSize: 15, marginLeft: 10, marginTop: 4 }}
                strong
              >
                รวมเป็นเงิน
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0 !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{ fontSize: 15, marginLeft: 10, marginTop: 4 }}
                strong
              >
                {hData?.total_price}
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row className="dnpv-footer">
          <Table.Summary.Cell colSpan={5} className="!align-top !ps-0 !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
                padding: 3,
                height: 70,
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{
                  fontSize: 15,
                  paddingLeft: 5,
                  /* 1em ทำให้สองบรรทัดชิดกันจนดูอึดอัด โดยเฉพาะสระบน-ล่างไทย
                     ที่เกือบชนกัน 1.7em กำลังอ่านสบาย */
                  lineHeight: "1.7em",
                  paddingTop: 7,
                }}
              >
                <p>ยืนยันรายการใบขายสินค้าตามรายละเอียดข้างต้น</p>
                <p>
                  Confirmed by/ผู้ยืนยัน _____________________ วันที่
                  ____/____/____
                </p>
              </Typography.Text>
            </Flex>
            <Flex
              style={{
                borderTop: "1px dashed",
                padding: 3,
                height: 70,
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{
                  fontSize: 15,
                  paddingLeft: 5,
                  lineHeight: "1em",
                  paddingTop: 7,
                }}
              >
                {/* จัดด้วย flex + ความกว้างป้ายกำกับคงที่ แทนการเคาะ &nbsp;
                    เรียงเป็น 2 บรรทัด ป้ายกับค่าตรงแนวกันทั้งคู่
                    วันที่มีเวลาต่อท้ายตามที่ลูกค้าขอ */}
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <div style={{ display: "flex", marginBottom: 4 }}>
                      <span style={{ width: 85 }}>พิมพ์โดย</span>
                      <span>
                        {userInfo?.firstname} {userInfo?.lastname}
                      </span>
                    </div>
                    <div style={{ display: "flex" }}>
                      <span style={{ width: 85 }}>บันทึกโดย</span>
                      <span>
                        {userInfo?.firstname} {userInfo?.lastname}
                      </span>
                    </div>
                  </div>
                  <div>
                    {/* เวลาที่กดพิมพ์จริง ไม่ใช่ sodate:
                        sodate ในฐานข้อมูลเก็บแค่วันที่ เวลาจึงออกมาเป็น
                        00:00:00 เสมอ ซึ่งไม่ได้บอกอะไร */}
                    <div style={{ display: "flex", marginBottom: 4 }}>
                      <span style={{ width: 80 }}>วันที่</span>
                      <span>{dayjs().format("DD/MM/YYYY  HH:mm:ss")}</span>
                    </div>
                  </div>
                </div>
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };

  /* จำนวนแถวต่อหน้า — ต้องลดตาม zoom ใน so.css ที่เพิ่งเพิ่มเป็น 1.55
     เพราะ zoom ขยายแนวตั้งไปพร้อมกัน พื้นที่ใส่แถวจึงลดลงราว 13%
     (30 แถวที่ zoom 1.35 -> ราว 26 แถวที่ zoom 1.55)
     ถ้าพิมพ์จริงแล้วแถวท้ายหายหรือยอดรวมหลุดหน้า ให้ลดตัวเลขนี้
     ถ้ายังเหลือที่ว่างท้ายใบให้เพิ่ม */
  const ROWS_PER_PAGE = 26;
  const ROW_HEIGHT = 17;

  const pages = useMemo(() => {
    const list = Array.isArray(details) ? details : [];
    const out = [];
    if (list.length === 0) {
      out.push({ rows: [], pageIndex: 0 });
      return out;
    }

    for (let start = 0; start < list.length; start += ROWS_PER_PAGE) {
      const slice = list.slice(start, start + ROWS_PER_PAGE);
      const withRowNo = slice.map((row, idx) => ({
        ...row,
        __rowNo: start + idx + 1,
      }));
      out.push({ rows: withRowNo, pageIndex: out.length });
    }
    return out;
  }, [details]);

  const totalPages = pages.length || 1;

  const padRows = (rows, pageIndex) => {
    const out = Array.isArray(rows) ? [...rows] : [];
    for (let i = out.length; i < ROWS_PER_PAGE; i++) {
      out.push({ _empty: true, key: `empty-${pageIndex}-${i}` });
    }
    return out;
  };

  const renderedColumns = useMemo(() => {
    return (columnDesc || []).map((col) => {
      const originalRender = col.render;
      return {
        ...col,
        render: (text, record, idx) => {
          if (record && record._empty) return "";
          if (col.key === "index" && typeof originalRender === "function") {
            const rowNo = Number(record?.__rowNo);
            if (Number.isFinite(rowNo)) {
              return originalRender(text, record, rowNo - 1);
            }
          }
          return originalRender ? originalRender(text, record, idx) : text;
        },
      };
    });
  }, [columnDesc]);

  const ContentBody = ({ rows, showSummary, pageIndex }) => {
    const paddedRows = padRows(rows, pageIndex);
    return (
      <div
        className="dnpv-table-wrap"
        style={{
          "--dnpv-empty-row-height": `${ROW_HEIGHT}px`,
          "--dnpv-row-height": `${ROW_HEIGHT}px`,
        }}
      >
        <Table
          className="dnpv-table"
          size="small"
          dataSource={paddedRows}
          columns={renderedColumns}
          pagination={false}
          rowKey={(rec) => {
            if (rec?._empty) return rec.key;
            const base = rec?.id || rec?.rowid || rec?.stcode || "row";
            const rowNo = rec?.__rowNo ? `-${rec.__rowNo}` : "";
            return `${base}${rowNo}`;
          }}
          bordered={false}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          onRow={(record) => {
            return { className: record._empty ? "dnpv-empty-row" : "r-sub" };
          }}
          summary={showSummary ? ReceiptSummary : undefined}
        />
      </div>
    );
  };

  const ContentData = ({ children }) => {
    return (
      <div className="dnpv-pages flex flex-col">
        <div className="print-content">{children}</div>
      </div>
    );
  };

  const PrintablePages = () => {
    return (
      /* ต้องมี so-9x11 ที่ตัวนี้ด้วย: react-to-print โคลนเฉพาะ element ที่
       componentRef ชี้ ตัว #dnpv ที่ถือคลาสนี้อยู่ข้างนอกไม่ถูกโคลนไปด้วย
       กฎ #dnpv.so-9x11 ... จึงไม่ match อะไรเลยใน iframe ที่ใช้พิมพ์
       แล้วตกกลับไปใช้ .dnpv-pages ของ delivery.css ซึ่งเป็น A4 */
    <div ref={componentRef} className="so-9x11">
        {pages.map((p, idx) => {
          const isLast = idx === totalPages - 1;
          return (
            <React.Fragment key={`page-${idx}`}>
              <ContentData>
                <ContentHead />
                <ContentHead2 />
                <ContentBody rows={p.rows} showSummary={isLast} pageIndex={idx} />
              </ContentData>
              {idx < totalPages - 1 && <div className="page-break" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* so-9x11 คือสวิตช์ขนาดกระดาษของฟอร์มนี้ (ดู so.css) */}
      <div className="page-show so-9x11" id="dnpv">
        {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}
        <div className="title-preview">
          <Button
            className="bn-center bg-blue-400"
            onClick={() => {
              handlePrint(null, () => componentRef.current);
            }}
            icon={<PiPrinterFill style={{ fontSize: "1.1rem" }} />}
          >
            PRINT
          </Button>
        </div>
        <div className="layout-preview">
          <PrintablePages />
        </div>
      </div>
    </>
  );
}