/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
import "./delivery.css";
import { Authenticate } from "../../../service/Authenticate.service";
// import logo from "../../../assets/images/QRCODEDN.jpg";
import { Button, Flex, Table, Typography, message } from "antd";
import { column } from "./delivery.model";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
import { comma } from "../../../utils/util";
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

  const columnDesc = column;

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

  const ContentHead = ({ page }) => {
    return (
      <div className="content-head in-sample flex flex-col dnpv-header">
        <div className="print-title flex pb-2">
          <div className="flex ps-3 grow-0" style={{ width: "80%" }}>
            <Flex className="mb-1.5" vertical>
              <Typography.Text
                className="tx-title min-w-80 weight600"
                strong
                style={{ fontSize: 24 }}
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
                ใบส่งสินค้า/ใบแจ้งหนี้
              </Typography.Text>
            </Flex>
          </div>
        </div>
      </div>
    );
  };

  const ContentHead2 = () => {
    return (
      <div className="content-head in-sample flex flex-col dnpv-header">
        <div className="print-title flex pb-2">
          <Flex className="flex ps-3 grow-0" style={{ width: "60%" }}>
            <Flex vertical>
              <Typography.Text className="tx-info">
                ลูกค้า
                <span style={{ paddingLeft: 22 }}>{hData?.cuscode}</span>
              </Typography.Text>
              <Typography.Text className="tx-info">
                <span>
                  {hData?.prename} {hData?.cusname}
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                <span>{hData?.address}</span>
              </Typography.Text>
              <Typography.Text className="tx-info">
                <span>
                  <br></br>
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                เลขประตัวผู้เสียภาษี
                <span style={{ paddingLeft: 20 }}>{hData?.remark}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                ขนส่งโดย ส่งให้ลูกค้า
                {/* <span style={{ paddingLeft: 20 }}>{hData?.remark}</span> */}
              </Typography.Text>
            </Flex>
          </Flex>
          <Flex className="flex ps-3 grow-0" style={{ width: "40%" }}>
            <Flex vertical>
              <Typography.Text className="tx-info">
                เลขที่
                <span style={{ paddingLeft: 65 }}>{hData?.dncode}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                วันที่
                <span style={{ paddingLeft: 70 }}>
                  {printDate ? dayjs(printDate).format("DD/MM/YYYY") : "-"}
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                อ้างอิง
                <span style={{ paddingLeft: 60 }}>{hData?.remark}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                เครดิต
                <span style={{ paddingLeft: 60 }}>{hData?.payment}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                เขตการขาย
                <span style={{ paddingLeft: 20 }}>{hData?.county_name}</span>
              </Typography.Text>
            </Flex>
          </Flex>
        </div>
      </div>
    );
  };

  const ReceiptFooter = () => {
    return (
      <>
        <Table.Summary.Row className="dnpv-footer" style={{}}>
          <Table.Summary.Cell
            colSpan={4}
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
          <Table.Summary.Cell colSpan={6} className="!align-top !ps-0 !pe-0">
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
                <p>ได้รับสินค้าตามรายการข้างบนนี้ไว้ถูกต้อง</p>
                <p>
                  Received by/ผู้รับสินค้า _____________________ วันที่
                  ____/____/____
                </p>
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row className="dnpv-footer">
          <Table.Summary.Cell colSpan={6} className="!align-top !ps-0 !pe-0">
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
                <p>
                  พิมพ์โดย
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  วันที่ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {printDate
                    ? dayjs(printDate).format("DD/MM/YYYY  HH:mm:ss")
                    : dayjs().format("DD/MM/YYYY  HH:mm:ss")}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; บันทึกโดย{" "}
                  {userInfo?.firstname} {userInfo?.lastname}
                </p>
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };

  // จำกัดรายการ 16/หน้า (ให้เหมาะกับแบบฟอร์ม)
  const ROWS_PER_PAGE = 16;
  const ROW_HEIGHT = 17;

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

  const padRows = (rows, pageIndex, reserveRows = 0) => {
    const out = Array.isArray(rows) ? [...rows] : [];
    for (let i = out.length; i < ROWS_PER_PAGE - reserveRows; i++) {
      out.push({ _empty: true, key: `empty-${pageIndex}-${i}` });
    }
    return out;
  };

  // map columnDesc เพื่อไม่ให้แสดงข้อมูลและหมายเลขเมื่อเป็นแถวว่าง
  const renderedColumns = useMemo(() => {
    return (columnDesc || []).map((col) => {
      const originalRender = col.render;
      return {
        ...col,
        render: (text, record, idx) => {
          if (record && record._empty) return ""; // blank for empty row
          // ทำให้เลขลำดับ No. ต่อเนื่องข้ามหน้า
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

  const ContentBody = ({
    rows,
    pageIndex,
    showGroupSummary,
    groupTotal,
    socode,
  }) => {
    const paddedRows = padRows(rows, pageIndex, showGroupSummary ? 1 : 0);
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
          summary={() => <ReceiptFooter />}
        />
      </div>
    );
  };

  const ContentData = ({ children, pageNum = 1, total = 1 }) => {
    return (
      <div className="dnpv-pages flex flex-col">
        <div className="print-content">{children}</div>
      </div>
    );
  };

  const PrintablePages = () => {
    return (
      <div ref={componentRef}>
        {pages.map((p, idx) => {
          return (
            <React.Fragment key={`page-${idx}`}>
              <ContentData pageNum={idx + 1} total={totalPages}>
                <ContentHead page={`${idx + 1} of ${totalPages}`} />
                <ContentHead2 />
                <ContentBody
                  rows={p.rows}
                  pageIndex={idx}
                  showGroupSummary={p.showGroupSummary}
                  groupTotal={p.groupTotal}
                  socode={p.socode}
                />
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
