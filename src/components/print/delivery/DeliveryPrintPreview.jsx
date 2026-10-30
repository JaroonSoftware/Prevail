/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
import "./delivery.css";
/* เลย์เอาต์ฟอร์มตามตัวอย่างลูกค้า ต้องอยู่หลัง delivery.css */
import "./delivery-form.css";
import { Authenticate } from "../../../service/Authenticate.service";
// import logo from "../../../assets/images/QRCODEDN.jpg";
import { Button, message } from "antd";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
import { comma, formatMoney } from "../../../utils/util";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import DeliveryService from "../../../service/DeliveryNote.service";

const dnservice = DeliveryService();

export default function DeliveryPrintPreview(props) {
  const { code } = useParams();
  const componentRef = useRef(null);
  const authService = Authenticate();
  const [userInfo, setUserInfo] = useState(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  const [hData, setHData] = useState({});
  const [details, setDetails] = useState([]);


  const [loading] = useState(false);

  const handleAfterPrint = () => {
    // setNewPageContent([]);
  };
  const handleBeforePrint = (e) => {
    // console.log("before printing...")
  };

  useEffect(() => {
    const init = () => {
      dnservice
        .getPrint(code)
        .then(async (res) => {
          const payload =
            res?.data?.header || res?.data?.detail
              ? res?.data
              : res?.data?.data || res?.data || res;
          const header = payload?.header || {};
          const detail = Array.isArray(payload?.detail) ? payload.detail : [];

          setHData({
            ...header,
            ivdate: header?.ivdate || header?.dndate || null,
            payment: header?.payment || "-",
            county_name: header?.county_name || "-",
          });
          setDetails(detail);
        })
        .catch((err) => {
          console.log(err);
          message.error("Error getting infomation Estimation.");
        });
    };

    init();
    return () => {};
  }, []);
  useEffect(() => {
    const users = authService.getUserInfo();
    setUserInfo(users);

    return () => {};
  }, []);

  const printDate = hData?.ivdate || hData?.dndate;

  /* ฟอร์มตัวอย่างใช้วันที่แบบ dd/mm/ปี พ.ศ. สองหลัก เช่น 02/11/69 */
  const formatBE = (d) => {
    if (!d) return "-";
    const v = dayjs(d);
    if (!v.isValid()) return "-";
    return `${v.format("DD/MM/")}${String((v.year() + 543) % 100).padStart(2, "0")}`;
  };

  // จำกัดรายการ 16/หน้า (ให้เหมาะกับแบบฟอร์ม)
  /* เดิม 16 แถว = เต็มหน้า A4 ตอนนี้กระดาษสูง 15 นิ้ว (ดู delivery.css)
     พื้นที่แถวเพิ่มจาก ~350px เป็น ~670px จึงได้ราว 30 แถว ตั้ง 28 เผื่อไว้
     สำคัญ: กล่องหน้าใช้ overflow:hidden ถ้าตั้งเกินที่ใส่ได้จริง
     แถวท้ายๆ จะถูกตัดหายเงียบๆ ไม่ได้ขึ้นหน้าใหม่ ตั้งน้อยไว้ปลอดภัยกว่า */
  const ROWS_PER_PAGE = 28;

  const pages = useMemo(() => {
    const list = Array.isArray(details) ? details : [];
    const out = [];
    if (list.length === 0) {
      out.push({ rows: [], pageIndex: 0 });
      return out;
    }

    const groups = [];
    let currentGroup = null;

    list.forEach((row, index) => {
      const soCode = row?.socode || `__ungrouped__-${index}`;
      if (!currentGroup || currentGroup.soCode !== soCode) {
        currentGroup = { soCode, rows: [] };
        groups.push(currentGroup);
      }
      currentGroup.rows.push(row);
    });

    let currentPageRows = [];
    let pageIndex = 0;
    let rowNo = 1;

    const pushPage = () => {
      if (currentPageRows.length === 0) return;
      out.push({ rows: currentPageRows, pageIndex });
      pageIndex += 1;
      currentPageRows = [];
    };

    groups.forEach((group) => {
      const groupRows = group.rows;
      const groupTotal = groupRows.reduce(
        (sum, row) => sum + Number(row?.qty || 0) * Number(row?.price || 0),
        0,
      );

      pushPage();

      let remainingRows = [...groupRows];
      while (remainingRows.length > 0) {
        const isSummaryPage = remainingRows.length <= ROWS_PER_PAGE - 1;
        const chunkSize = isSummaryPage
          ? remainingRows.length
          : remainingRows.length === ROWS_PER_PAGE
            ? 1
            : ROWS_PER_PAGE;
        const chunk = remainingRows.slice(0, chunkSize);
        remainingRows = remainingRows.slice(chunkSize);
        const withRowNo = [];
        for (const row of chunk) {
          withRowNo.push({
            ...row,
            __rowNo: rowNo,
          });
          rowNo += 1;
        }
        out.push({
          rows: withRowNo,
          pageIndex,
          showGroupSummary: isSummaryPage,
          groupTotal,
          socode: group.soCode,
        });
        pageIndex += 1;
      }
    });

    if (out.length === 0) {
      out.push({ rows: [], pageIndex: 0 });
    }

    return out;
  }, [details]);

  const totalPages = pages.length || 1;

  /* null = ลูกค้ารายนี้ไม่มีเครดิต (ต่างจาก 0 วัน) */
  const creditDay =
    hData?.credit_day === null ||
    hData?.credit_day === undefined ||
    hData?.credit_day === ""
      ? null
      : Number(hData.credit_day);

  /* ---------- หัวบริษัท + ข้อมูลลูกค้า/เอกสาร (ทุกหน้า) ---------- */
  const SheetHead = () => (
    <>
      <div className="dnf-head">
        <div className="dnf-co-th">บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด</div>
        <div>Prevail International Food Co.,Ltd</div>
        <div>60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000</div>
        <div>โทร : 098 192 9391</div>
        <div>
          เลขประจำตัวผู้เสียภาษี 0835561011645
          <span className="dnf-tax-branch">สำนักงานใหญ่</span>
        </div>
        <div className="dnf-title">ใบส่งสินค้า/ใบแจ้งหนี้</div>
      </div>

      <div className="dnf-info">
        <div className="dnf-cus">
          {/* ชื่ออังกฤษอยู่บรรทัดเดียวกับ "ลูกค้า" ตามตัวอย่าง
              ยังไม่ได้กรอกชื่ออังกฤษก็ใช้รหัสลูกค้าแทน */}
          <div>
            ลูกค้า<span className="dnf-gap">{hData?.cusname_en || hData?.cuscode}</span>
          </div>
          <div>
            {hData?.prename} {hData?.cusname}
          </div>
          <div>{hData?.address}</div>
          <div>
            เลขประจำตัวผู้เสียภาษี
            {hData?.taxnumber ? <span className="dnf-gap">{hData.taxnumber}</span> : null}
          </div>
          <div>
            Tel.{hData?.tel || ""} Attn: {hData?.contact || ""}
          </div>
          <div>
            ขนส่งโดย<span className="dnf-gap">ส่งให้ลูกค้า</span>
          </div>
        </div>

        <div className="dnf-doc">
          <div>เลขที่</div>
          <div>{hData?.dncode}</div>

          <div>วันที่</div>
          <div>{formatBE(printDate)}</div>

          <div>อ้างอิง</div>
          <div>{hData?.customer_po ? `PO ${hData.customer_po}` : ""}</div>

          {/* ตามตัวอย่าง: "เครดิต 30 วัน" อยู่ช่องป้าย, "ครบกำหนด ..." อยู่ช่องค่า */}
          <div>{creditDay !== null ? `เครดิต ${creditDay} วัน` : "เครดิต"}</div>
          <div>
            {creditDay !== null
              ? `ครบกำหนด ${formatBE(dayjs(printDate).add(creditDay, "day"))}`
              : ""}
          </div>

          <div>เขตการขาย</div>
          <div>{hData?.county_name && hData.county_name !== "-" ? hData.county_name : ""}</div>
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
        <col style={{ width: "16%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "13%" }} />
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
              {/* ตามตัวอย่าง: ทศนิยม 3 ตำแหน่ง ตามด้วยหน่วย เช่น "1.000 Kg." */}
              <td className="dnf-r">
                {`${comma(qty, 3, 3)} ${r?.unit || ""}`.trim()}
              </td>
              <td className="dnf-r">{comma(price, 2, 2)}</td>
              <td className="dnf-r">{comma(qty * price, 2, 2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  /* ---------- ส่วนท้าย (เฉพาะหน้าสุดท้ายของแต่ละใบขาย) ---------- */
  const SheetFoot = ({ total }) => (
    <>
      <div className="dnf-rule" />
      <div className="dnf-total">
        <span>({thaiBahtText(total || 0, 2, 2)}).</span>
        <span>รวมเป็นเงิน</span>
        <span className="dnf-total-amt">{formatMoney(total || 0, 2, 2)}</span>
      </div>
      <div className="dnf-rule" />
      <div className="dnf-recv">
        <div>ได้รับสินค้าตามรายการข้างบนนี้ไว้ถูกต้อง</div>
        <div>Received by/ผู้รับสินค้า ________________ วันที่ ___/___/___</div>
      </div>
      <div className="dnf-rule" />
      {/* เวลาที่กดพิมพ์จริง ไม่ใช่ ivdate/dndate ที่เก็บแค่วันที่ */}
      <div className="dnf-printed">
        <span className="lb">วันที่พิมพ์</span>
        {`${formatBE(dayjs())} ${dayjs().format("HH:mm:ss")}`}
      </div>
    </>
  );

  const PrintablePages = () => {
    return (
      <div ref={componentRef}>
        {pages.map((p, idx) => (
          <React.Fragment key={`page-${idx}`}>
            <div className="dnpv-pages flex flex-col">
              <div className="dnf">
                <SheetHead />
                <div className="dnf-body">
                  <SheetTable rows={p.rows} />
                </div>
                {p.showGroupSummary ? (
                  <SheetFoot total={p.groupTotal} />
                ) : (
                  /* หน้ากลางของใบขายที่ยาวหลายหน้า ปิดท้ายด้วยเส้นประเฉยๆ */
                  <div className="dnf-rule" />
                )}
              </div>
            </div>
            {idx < totalPages - 1 && <div className="page-break" />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24, }} spin />} fullscreen /> */}
      <div className="page-show" id="dnpv">
        {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}
        <div className="title-preview">
          <Button
            className="bn-center bg-blue-400"
            // onClick={() => { handleCheckMultiPages() }}
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
        {/* <div className='hidden'>
                    <div ref={printRef}>
                        {newPageContent?.map( (page, i) => ( 
                        <div key={i}>
                            <ContentData pageNum={i+1} total={(newPageContent.length)} > 
                                {page?.map( (eml, ind) => (<div key={ind} dangerouslySetInnerHTML={{ __html: eml.outerHTML }} ></div>) )}
                            </ContentData>
                            {i < (newPageContent.length-1) && <div className='page-break'></div>}
                        </div> 
                        ))}
                    </div>
                </div> */}
      </div>
    </>
  );
}
