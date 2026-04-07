/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import "../delivery/delivery.css";
import "./DryReportPrintPreview.css";
import { Authenticate } from "../../../service/Authenticate.service";
import { Button, Empty, Flex, Table, Typography, message } from "antd";
import dayjs from "dayjs";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import { loadMyAccessSearchCookie } from "../../../utils/myaccessSearchCookie";
import { printColumns } from "./model";

const rpservice = ReportService();
const PAGE_COOKIE_KEY = "dry-report";
const ROWS_PER_PAGE = 16;
const ROW_HEIGHT = 18;

const formatDateRangeLabel = (value) => {
  if (!Array.isArray(value) || value.length !== 2) {
    return "ทั้งหมด";
  }

  return value.map((item) => dayjs(item).format("DD/MM/YYYY")).join(" - ");
};

const buildSearchPayload = (values = {}) => {
  const data = { ...values };

  if (Array.isArray(data?.sodate) && data.sodate.length === 2) {
    const [sodate_form, sodate_to] = data.sodate.map((value) =>
      dayjs(value).format("YYYY-MM-DD")
    );
    Object.assign(data, { sodate_form, sodate_to });
  }

  delete data.sodate;
  return data;
};

export default function DryReportPrintPreview() {
  const componentRef = useRef(null);
  const authService = Authenticate();
  const [userInfo, setUserInfo] = useState(null);
  const [searchValues, setSearchValues] = useState({});
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAfterPrint = () => {};
  const handleBeforePrint = () => {};

  const handlePrint = useReactToPrint({
    documentTitle: "Dry Goods Report",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  useEffect(() => {
    const init = () => {
      const restored = loadMyAccessSearchCookie(PAGE_COOKIE_KEY)?.searchValues ?? {};
      setSearchValues(restored);
      setLoading(true);

      rpservice
        .getDryGoods(buildSearchPayload(restored), { ignoreLoading: true })
        .then((res) => {
          const { data } = res.data;
          setDetails(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.log(err);
          message.error("ไม่สามารถดึงข้อมูลรายงานของแห้งได้");
        })
        .finally(() => {
          setLoading(false);
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

  const selectedDateLabel = useMemo(
    () => formatDateRangeLabel(searchValues?.sodate),
    [searchValues]
  );

  const orderedDetails = useMemo(() => {
    return [...details].sort((left, right) => {
      const leftDate = dayjs(left?.sodate).valueOf() || 0;
      const rightDate = dayjs(right?.sodate).valueOf() || 0;

      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      const soCompare = String(left?.socode || "").localeCompare(
        String(right?.socode || ""),
        "th"
      );
      if (soCompare !== 0) {
        return soCompare;
      }

      return String(left?.stname || "").localeCompare(String(right?.stname || ""), "th");
    });
  }, [details]);

  const totalQty = useMemo(
    () => orderedDetails.reduce((sum, item) => sum + Number(item?.qty_result || 0), 0),
    [orderedDetails]
  );

  const totalSo = useMemo(
    () => new Set(orderedDetails.map((item) => item?.socode).filter(Boolean)).size,
    [orderedDetails]
  );

  const pages = useMemo(() => {
    const list = Array.isArray(orderedDetails) ? orderedDetails : [];
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
  }, [orderedDetails]);

  const totalPages = pages.length || 1;

  const padRows = (rows, pageIndex) => {
    const out = Array.isArray(rows) ? [...rows] : [];
    for (let i = out.length; i < ROWS_PER_PAGE; i++) {
      out.push({ _empty: true, key: `empty-${pageIndex}-${i}` });
    }
    return out;
  };

  const ContentHead = ({ pageNumber }) => {
    return (
      <div className="dry-report-page-header">
        <div className="dry-report-page-header-top">
          <div className="dry-report-brand-block">
            <div className="dry-report-brand-badge">Dry Goods Purchase Report</div>
            <Flex className="mb-1.5" vertical>
              <Typography.Text
                className="dry-report-company"
                strong
              >
                บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด
              </Typography.Text>
              <Typography.Text className="dry-report-company-meta">
                60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
              </Typography.Text>
              <Typography.Text className="dry-report-company-meta">
                TEL: 076 641 117, 098 192 9391
              </Typography.Text>
              <Typography.Text className="dry-report-company-meta">
                เลขประจำตัวผู้เสียภาษี 083556101164 สำนักงานใหญ่
              </Typography.Text>
            </Flex>
          </div>
          <div className="dry-report-title-block">
            <Typography.Text className="dry-report-title" strong>
              รายงานของแห้ง
            </Typography.Text>
            <Typography.Text className="dry-report-title-subtitle">
              เอกสารสรุปรายการสินค้าที่ต้องซื้อสำหรับฝ่ายจัดซื้อ
            </Typography.Text>
            <Typography.Text className="dry-report-page-counter">
              หน้า {pageNumber} / {totalPages}
            </Typography.Text>
          </div>
        </div>
      </div>
    );
  };

  const ContentHead2 = () => {
    return (
      <div className="dry-report-meta-grid">
        <div className="dry-report-meta-card">
          <div className="dry-report-meta-label">ช่วงวันที่</div>
          <div className="dry-report-meta-value">{selectedDateLabel}</div>
        </div>
        <div className="dry-report-meta-card">
          <div className="dry-report-meta-label">จำนวนรายการ</div>
          <div className="dry-report-meta-value">{orderedDetails.length}</div>
        </div>
        <div className="dry-report-meta-card">
          <div className="dry-report-meta-label">จำนวนใบขายสินค้า</div>
          <div className="dry-report-meta-value">{totalSo}</div>
        </div>
        <div className="dry-report-meta-card">
          <div className="dry-report-meta-label">ยอดรวมจำนวนซื้อ</div>
          <div className="dry-report-meta-value dry-report-meta-value-accent">
            {formatMoney(totalQty, 2, 2)}
          </div>
        </div>
        <div className="dry-report-meta-card">
          <div className="dry-report-meta-label">พิมพ์เมื่อ</div>
          <div className="dry-report-meta-value">{dayjs().format("DD/MM/YYYY HH:mm:ss")}</div>
        </div>
        <div className="dry-report-meta-card">
          <div className="dry-report-meta-label">พิมพ์โดย</div>
          <div className="dry-report-meta-value">
            {userInfo?.firstname} {userInfo?.lastname}
          </div>
        </div>
      </div>
    );
  };

  const ReceiptSummary = () => {
    return (
      <>
        <Table.Summary.Row className="dnpv-footer dry-report-summary-row">
          <Table.Summary.Cell colSpan={5} className="!align-top !ps-0 !pe-0" style={{ height: 20 }}>
            <Flex className="dry-report-summary-box">
              <Typography.Text className="dry-report-summary-text" strong>
                รวมรายการรายงานของแห้งทั้งหมด {details.length} รายการ
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={2} className="!align-top !ps-0 !pe-0">
            <Flex className="dry-report-summary-box">
              <Typography.Text className="dry-report-summary-label" strong>
                รวมจำนวนที่ต้องซื้อ
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0 !pe-0">
            <Flex className="dry-report-summary-box dry-report-summary-box-total">
              <Typography.Text className="dry-report-summary-total" strong>
                {formatMoney(totalQty, 2, 2)}
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row className="dnpv-footer">
          <Table.Summary.Cell colSpan={8} className="!align-top !ps-0 !pe-0">
            <Flex className="dry-report-footer-box">
              <Typography.Text className="dry-report-footer-text">
                <p>รายงานนี้แสดงข้อมูลของแห้งสำหรับฝ่ายจัดซื้อจากเงื่อนไขค้นหาล่าสุด</p>
                <p>ตรวจสอบจำนวนที่ต้องซื้อก่อนยืนยันการจัดซื้อทุกครั้ง</p>
              </Typography.Text>
            </Flex>
            <Flex className="dry-report-footer-box">
              <Typography.Text className="dry-report-footer-text">
                <p>
                  พิมพ์โดย
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  วันที่ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {dayjs().format("DD/MM/YYYY  HH:mm:ss")}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; บันทึกโดย {userInfo?.firstname}{" "}
                  {userInfo?.lastname}
                </p>
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };

  const ContentBody = ({ rows, showSummary, pageIndex }) => {
    const paddedRows = padRows(rows, pageIndex);
    return (
      <div
        className="dnpv-table-wrap dry-report-table-wrap"
        style={{
          "--dnpv-empty-row-height": `${ROW_HEIGHT}px`,
          "--dnpv-row-height": `${ROW_HEIGHT}px`,
        }}
      >
        <Table
          className="dnpv-table dry-report-table"
          size="small"
          dataSource={paddedRows}
          columns={printColumns}
          pagination={false}
          rowKey={(rec) => {
            if (rec?._empty) return rec.key;
            const base = rec?.id || rec?.rowid || rec?.socode || rec?.stcode || "row";
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
      <div className="dry-report-paper">
        <div className="dry-report-paper-content">{children}</div>
      </div>
    );
  };

  const PrintablePages = () => {
    if (!loading && details.length === 0) {
      return (
        <div ref={componentRef}>
          <ContentData>
            <ContentHead pageNumber={1} />
            <ContentHead2 />
            <Flex justify="center" align="center" style={{ minHeight: 320 }}>
              <Empty description="ไม่พบข้อมูลรายงานของแห้งจากเงื่อนไขล่าสุด" />
            </Flex>
          </ContentData>
        </div>
      );
    }

    return (
      <div ref={componentRef}>
        {pages.map((p, idx) => {
          const isLast = idx === totalPages - 1;
          return (
            <React.Fragment key={`page-${idx}`}>
              <ContentData>
                <ContentHead pageNumber={idx + 1} />
                <ContentHead2 />
                <ContentBody rows={p.rows} showSummary={isLast} pageIndex={idx} />
              </ContentData>
              {idx < totalPages - 1 && <div className="dry-report-page-break" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dry-report-print-screen" id="dnpv">
        {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}
        <div className="dry-report-toolbar">
          <div className="dry-report-toolbar-copy">
            <span className="dry-report-toolbar-kicker">Preview</span>
            <h1 className="dry-report-toolbar-title">Dry Report Print Preview</h1>
          </div>
          <Button
            type="primary"
            className="dry-report-print-button"
            onClick={() => {
              handlePrint(null, () => componentRef.current);
            }}
            icon={<PiPrinterFill className="dry-report-print-button-icon" />}
          >
            พิมพ์รายงาน
          </Button>
        </div>
        <div className="dry-report-preview-shell">
          <PrintablePages />
        </div>
      </div>
  );
}