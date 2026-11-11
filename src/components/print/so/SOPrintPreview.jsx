import "../print-font.css";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import "../delivery/delivery.css";
/* ใช้เลย์เอาต์ใบส่งสินค้าและกำหนดตัวอักษรของใบขายแยกต่างหาก */
import "../delivery/delivery-form.css";
import "./sales-order-font.css";
import { Authenticate } from "../../../service/Authenticate.service";
import { Button, message } from "antd";
import thaiBahtText from "thai-baht-text";
import { comma, formatMoney } from "../../../utils/util";
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
const SO_PAGE_STYLE = `@media print { @page { size: 9in 11in; margin: 0; } }`;

export default function SOPrintPreview() {
  const { code } = useParams();
  const componentRef = useRef(null);
  const authService = Authenticate();
  const [userInfo, setUserInfo] = useState(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print Sales Order",
    /* ใส่ @page ตรงเข้า iframe ที่ใช้พิมพ์ด้วย: ระยะขอบ 0 = Chrome ไม่มีที่วางหัว/ท้ายกระดาษ (URL, วันที่, ชื่อเอกสาร)
       ใช้ได้เมื่อ dialog ตั้ง "ระยะขอบ" เป็น ค่าเริ่มต้น/ไม่มี — ถ้าผู้ใช้ตั้ง กำหนดเอง/ต่ำสุด Chrome จะใช้ค่าของผู้ใช้แทน */
    pageStyle: "@page { size: 9in 11in; margin: 0; } html, body { margin: 0; }",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  const [hData, setHData] = useState({});
  const [details, setDetails] = useState([]);

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

  /* ---------- หัวบริษัท + ข้อมูลลูกค้า/เอกสาร (ทุกหน้า) ----------
     ใช้คลาส .dnf ชุดเดียวกับใบส่งสินค้า (delivery-form.css)
     ขนาดตัวอักษร ระยะบรรทัด เส้นประ และขนาดหน้าจึงเท่ากันเป๊ะ */
  const fmtDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "-");

  const SheetHead = ({ pageNo, pageTotal }) => (
    <>
      <div className="dnf-head">
        <div className="dnf-co-th">บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด</div>
        <div className="so-bold">Prevail International Food Co.,Ltd</div>
        <div>60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000</div>
        <div><span className="so-bold">โทร :</span> 098 192 9391</div>
        <div>
          <span className="so-bold">เลขประจำตัวผู้เสียภาษี</span> 0835561011645
          <span className="dnf-tax-branch">สำนักงานใหญ่</span>
        </div>
        <div className="dnf-title">
          ใบขายสินค้า{pageTotal > 1 ? ` (${pageNo}/${pageTotal})` : ""}
        </div>
      </div>

      <div className="dnf-info">
        <div className="dnf-cus">
          <div>
            <span className="so-bold">ลูกค้า</span><span className="dnf-gap">{hData?.cuscode}</span>
          </div>
          <div>
            <span className="so-bold">{hData?.prename}</span> {hData?.cusname}
          </div>
          <div>{hData?.address}</div>
          <div>
            <span className="so-bold">เลขประจำตัวผู้เสียภาษี</span>
            {hData?.taxnumber ? <span className="dnf-gap">{hData.taxnumber}</span> : null}
          </div>
          <div>
            <span className="so-bold">ผู้ติดต่อ</span><span className="dnf-gap">{hData?.contact || "-"}</span>
          </div>
        </div>

        <div className="dnf-doc">
          <div>เลขที่</div>
          <div>{hData?.socode}</div>

          <div>วันที่</div>
          <div>{fmtDate(hData?.sodate)}</div>

          <div>PO ลูกค้า</div>
          <div>{hData?.customer_po || "-"}</div>

          <div>วันที่นัดส่ง</div>
          <div>{fmtDate(hData?.deldate)}</div>

          <div>ห้องครัว</div>
          <div>{hData?.del_room || "-"}</div>
        </div>
      </div>
    </>
  );

  /* ---------- ตารางรายการ ---------- */
  const SheetTable = ({ rows }) => (
    <table className="dnf-table">
      <colgroup>
        <col style={{ width: "7%" }} />
        <col />
        <col style={{ width: "14%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>
      <thead>
        <tr>
          <th className="dnf-c">No.</th>
          <th className="dnf-c">รายละเอียด</th>
          <th className="dnf-r">จำนวน</th>
          <th className="dnf-r">หน่วยละ</th>
          <th className="dnf-r">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const qty = Number(r?.qty || 0);
          const price = Number(r?.price || 0);
          return (
            <tr key={`${r?.stcode || "row"}-${r?.__rowNo ?? i}`}>
              <td className="dnf-c">{r?.__rowNo ?? i + 1}</td>
              <td className="dnf-l">{r?.stname}</td>
              {/* ใบขายสินค้าแสดงจำนวน 2 ตำแหน่ง ไม่มีหน่วย (ต่างจากใบส่งสินค้า) */}
              <td className="dnf-r">{comma(qty, 2, 2)}</td>
              <td className="dnf-r">{comma(price, 2, 2)}</td>
              <td className="dnf-r">{comma(qty * price, 2, 2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  /* ---------- ส่วนท้าย (หน้าสุดท้าย) ---------- */
  const SheetFoot = () => {
    const total = Number(hData?.total_price || 0);
    const who = `${userInfo?.firstname || ""} ${userInfo?.lastname || ""}`.trim();
    return (
      <>
        <div className="dnf-rule" />
        <div className="dnf-total">
          <span>({thaiBahtText(total, 2, 2)}).</span>
          <span>รวมเป็นเงิน</span>
          <span className="dnf-total-amt">{formatMoney(total, 2, 2)}</span>
        </div>
        <div className="dnf-rule" />
        <div className="dnf-recv">
          <div>ยืนยันรายการใบขายสินค้าตามรายละเอียดข้างต้น</div>
          <div>Confirmed by/ผู้ยืนยัน ________________ วันที่ ___/___/___</div>
        </div>
        <div className="dnf-rule" />
        {/* เวลาที่กดพิมพ์จริง (sodate เก็บแค่วันที่ เวลาจะเป็น 00:00:00 เสมอ) */}
        {/* บรรทัดเดียว: พิมพ์โดย / วันที่ / บันทึกโดย ตามที่ลูกค้าขอ
            ช่องระหว่างป้ายกับค่าแคบลง (เดิมเว้นกว้างเกิน ดูห่างกัน) */}
        <div className="dnf-printed so-printed">
          <span className="lb">พิมพ์โดย</span>
          <span>{who}</span>
          <span className="lb grp">วันที่</span>
          <span>{dayjs().format("DD/MM/YYYY HH:mm:ss")}</span>
          <span className="lb grp">บันทึกโดย</span>
          <span>{who}</span>
        </div>
      </>
    );
  };

  /* แถวต่อหน้าเท่าใบส่งสินค้า (กล่องหน้าเดียวกัน 11 x 15.5 นิ้ว ดู delivery.css) */
  const ROWS_PER_PAGE = 16;

  const pages = useMemo(() => {
    const list = Array.isArray(details) ? details : [];
    if (list.length === 0) return [{ rows: [] }];
    const out = [];
    for (let start = 0; start < list.length; start += ROWS_PER_PAGE) {
      out.push({
        rows: list
          .slice(start, start + ROWS_PER_PAGE)
          .map((row, idx) => ({ ...row, __rowNo: start + idx + 1 })),
      });
    }
    return out;
  }, [details]);

  const totalPages = pages.length || 1;

  const PrintablePages = () => (
    <div ref={componentRef}>
      {pages.map((p, idx) => {
        const isLast = idx === totalPages - 1;
        return (
          <React.Fragment key={`page-${idx}`}>
            <div className="dnpv-pages flex flex-col">
              <div className="dnf so-form">
                <SheetHead pageNo={idx + 1} pageTotal={totalPages} />
                <div className="dnf-body">
                  <SheetTable rows={p.rows} />
                </div>
                {isLast ? <SheetFoot /> : <div className="dnf-rule" />}
              </div>
            </div>
            {idx < totalPages - 1 && <div className="page-break" />}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ไม่มีคลาส so-9x11 แล้ว: ใช้กล่องหน้า/ขนาดกระดาษเดียวกับใบส่งสินค้า */}
      <div className="page-show" id="dnpv">
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
